import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Test-only scraper: builds enriched line-items CSV for a given day.
// Usage: EXPORTS_DIR=orders_exports_TEST node scripts/test_line_items_export.mjs YYYY-MM-DD

const EXPORTS_DIR = process.env.EXPORTS_DIR || 'orders_exports';
const STORAGE_STATE_PATH = 'storageState.json';
const dateStr = process.argv[2];
const OUTPUT_SUFFIX = process.env.OUTPUT_SUFFIX || 'v2';
const BASE_URL = 'https://manager.filson.p.newstore.net/sales/orders';
const USERNAME = process.env.NS_USERNAME || 'ben.durazzo@filson.com';
const PASSWORD = process.env.NS_PASSWORD || 'BDbd6464555@';

if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
  console.error('Usage: node scripts/test_line_items_export.mjs YYYY-MM-DD');
  process.exit(1);
}

const COLS = [
  'order_id','order_date_time','channel_type','fulfillment','demand_location','fulfillment_location','associate',
  'customer_id','customer_name','email','shipping_option',
  'product_name','color','size','ax_item_number','jasper_product_id','magento_sku','sku','tax_class_id','upc','variant_group_id','product_id','quantity',
  'unit_price','line_discount','discounted_price','taxes'
];

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function csvEscape(v){ if (v == null) return ''; const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; }

function readOrdersCsv(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines.shift();
  const cols = header.split(',');
  const idx = Object.fromEntries(cols.map((c,i)=>[c,i]));
  const rows = [];
  for (const line of lines) {
    // Naive CSV: split by commas outside quotes (handles our current files)
    const cells = [];
    let cur = ''; let inQ = false;
    for (let i=0;i<line.length;i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; cur += ch; }
      else if (ch === ',' && !inQ) { cells.push(cur); cur=''; }
      else { cur += ch; }
    }
    cells.push(cur);
    const val = (k)=> (cells[idx[k]]||'').replace(/^"|"$/g,'');
    rows.push({
      order_id: val('order_id'),
      href: val('href'),
      customer_name: val('customer_name'),
      associate: val('associate'),
      date_time: val('date_time'),
      channel_type: val('channel_type'),
      channel: val('channel'),
      fulfillment_type: val('fulfillment_type'),
      demand_location: val('demand_location'),
      fulfillment_location: val('fulfillment_location'),
      carrier: val('carrier'),
      shipment_method: val('shipment_method'),
      total: val('total'),
      discount: val('discount'),
      status: val('status')
    });
  }
  return rows;
}

async function extractFromOrder(page, order) {
  await page.goto(order.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});

  const rows = await page.evaluate((ORDER_ID) => {
    const norm = (s) => (s||'').replace(/\s+/g,' ').trim();
    const keyify = (s) => (s||'').trim().toUpperCase().replace(/\s+/g,'_').replace(/[^A-Z0-9_]/g,'');

    function findByLabel(label){
      const xp = `//*[normalize-space(text())='${label}']`;
      const res = document.evaluate(xp, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      if (res.snapshotLength === 0) return '';
      const node = res.snapshotItem(0);
      let v = '';
      if (node.parentElement) {
        const sib = node.parentElement.querySelector(':scope > *:not(:first-child)');
        if (sib) v = norm(sib.textContent);
      }
      if (!v && node.nextElementSibling) v = norm(node.nextElementSibling.textContent);
      return v;
    }

    // No totals in test export

    function parseKV(group){
      const kv={};
      const items = group.querySelectorAll('.ant-descriptions-item');
      if (items.length){
        items.forEach(it=>{
          const label=(it.querySelector('.ant-descriptions-item-label')?.textContent||'').trim();
          const val=(it.querySelector('.ant-descriptions-item-content')?.textContent||'').trim();
          if(label) kv[keyify(label)]=val;
        });
      } else {
        const raw=(group.innerText||'').replace(/\r/g,'');
        const lines=raw.split('\n').map(s=>s.trim()).filter(Boolean);
        for (const line of lines){
          const idx=line.indexOf(':'); if(idx>-1){
            const label=line.slice(0,idx).trim(); const val=line.slice(idx+1).trim();
            if(label) kv[keyify(label)]=val;
          }
        }
      }
      return kv;
    }

    function closestRow(el){
      let cur=el;
      while(cur && cur!==document.body){
        if (cur.querySelector('a') && /\$[0-9]/.test(cur.textContent||'')) return cur;
        cur=cur.parentElement;
      }
      return el;
    }

    function headerPositions(){
      const defs = [
        { name: 'Price', re: /^(price)$/i },
        { name: 'Discount', re: /^(discount)$/i },
        { name: 'Disc. Price', re: /^(disc\.?\s*price|discounted\s*price)$/i },
        { name: 'Taxes', re: /^(tax|taxes)$/i }
      ];
      const pos = {};
      const els = Array.from(document.querySelectorAll('body *'));
      for (const {name, re} of defs){
        let best = null; let bestY = Infinity;
        for (const el of els){
          const text = (el.textContent||'').trim();
          if (!text || text.length>30) continue;
          if (!re.test(text)) continue;
          const r = el.getBoundingClientRect();
          if (r.width>0 && r.height>0 && r.top < bestY){ bestY = r.top; best = r; }
        }
        if (best) pos[name] = best.left + best.width/2;
      }
      return pos;
    }
    function mapAmountsByHeader(row, exclude){
      const headers = headerPositions();
      const out = { 'Price':'', 'Discount':'', 'Disc. Price':'', 'Taxes':'' };
      const rr = row.getBoundingClientRect();
      const walker = document.createTreeWalker(row, NodeFilter.SHOW_ELEMENT, null);
      let n = walker.currentNode;
      const cands = [];
      while (n){
        if (exclude && exclude.contains(n)) { n = walker.nextSibling(); continue; }
        const t = (n.textContent||'').trim();
        const m = t.match(/\$[0-9][\d,]*\.?\d*/);
        if (m){
          const r = n.getBoundingClientRect();
          if (r.width>0 && r.height>0 && r.bottom >= rr.top-4 && r.top <= rr.bottom+4){
            let red = false;
            try {
              const cs = window.getComputedStyle(n);
              const col = cs.color || '';
              const mm = col.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
              if (mm){ const R=+mm[1],G=+mm[2],B=+mm[3]; if (R>=170 && G<=90 && B<=90) red = true; }
            } catch {}
            cands.push({ price:m[0], x:r.left + r.width/2, red });
          }
        }
        n = walker.nextNode();
      }
      // Helper: pick closest candidate to header x with optional filters
      const pickClosest = (name, filter) => {
        const hx = headers[name]; if (hx == null) return '';
        let best = null; let bestDx = Infinity;
        for (const c of cands){
          if (filter && !filter(c)) continue;
          const dx = Math.abs(c.x - hx);
          if (dx < bestDx){ bestDx = dx; best = c; }
        }
        return best ? best.price : '';
      };
      out['Price'] = pickClosest('Price', c=>!c.red) || '';
      out['Discount'] = pickClosest('Discount', c=>c.red) || 'N/A';
      out['Disc. Price'] = pickClosest('Disc. Price', c=>!c.red && c.price !== out['Price']) || '';
      out['Taxes'] = pickClosest('Taxes', c=>c.red) || '';
      return out;
    }

    function moneyToPlain(s){
      if (!s || s === 'N/A') return '0';
      const v = String(s).replace(/[^0-9.\-]/g, '');
      return v === '' ? '0' : v;
    }

    const orderFields={
      order_date_time: findByLabel('Date/Time') || '',
      channel_type: findByLabel('Channel Type') || '',
      fulfillment: findByLabel('Fulfillment') || '',
      demand_location: findByLabel('Demand Location') || '',
      fulfillment_location: findByLabel('Fulfillment Location') || '',
      associate: findByLabel('Associate') || '',
      customer_id: findByLabel('Customer ID') || '',
      customer_name: findByLabel('Customer Name') || '',
      email: findByLabel('Email') || '',
      shipping_option: findByLabel('Shipping Option') || '',
      billing_address: findByLabel('Billing Address') || ''
    };

    const out=[];
    const groups=Array.from(document.querySelectorAll('.ant-descriptions'));
    for (const g of groups){
      const kv = parseKV(g);
      const hasLineKeys=['SKU','UPC','AX_ITEM_NUMBER','JASPER_PRODUCT_ID','VARIANT_GROUP_ID'].some(k=>kv[k]);
      if(!hasLineKeys) continue;
      // choose best ancestor row (widest container holding price columns)
      let bestRow = null; let bestCount = -1; let cur = g.parentElement; let steps = 0;
      const countPrices = (node)=>{
        const rr = node.getBoundingClientRect();
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT, null);
        let n = walker.currentNode; let c = 0;
        while (n) {
          if (g.contains(n)) { n = walker.nextSibling(); continue; }
          const t = (n.textContent||'').trim();
          if (/\$[0-9][\d,]*\.?\d*/.test(t)) {
            const r = n.getBoundingClientRect();
            if (r.width>0 && r.height>0 && r.bottom >= rr.top-4 && r.top <= rr.bottom+4) c++;
          }
          n = walker.nextNode();
        }
        return c;
      };
      while (cur && steps < 8) { const c = countPrices(cur); if (c > bestCount) { bestCount = c; bestRow = cur; } cur = cur.parentElement; steps++; }
      const row = bestRow || closestRow(g);
      const link = row.querySelector('a');
      const product_name = norm(link?.textContent||'');
      const mapped = mapAmountsByHeader(row,g);
      const unit_price = moneyToPlain(mapped['Price']);
      const line_discount = moneyToPlain(mapped['Discount']);
      const discounted_price = moneyToPlain(mapped['Disc. Price'] || mapped['Price']);
      const taxesRaw = moneyToPlain(mapped['Taxes']);
      const taxes = (parseFloat(taxesRaw || '0') > 0) ? taxesRaw : '0';
      out.push({ order_id: ORDER_ID, ...orderFields,
        product_name,
        color: kv.COLOR || '', size: kv.SIZE || '',
        ax_item_number: kv.AX_ITEM_NUMBER || '', jasper_product_id: kv.JASPER_PRODUCT_ID || '',
        magento_sku: kv.MAGENTO_SKU || '', sku: kv.SKU || '', tax_class_id: kv.TAX_CLASS_ID || '',
        upc: kv.UPC || '', variant_group_id: kv.VARIANT_GROUP_ID || '', product_id: kv.PRODUCT_ID || '',
        quantity: '1', unit_price, line_discount, discounted_price, taxes });
    }
    return out;
  }, order.order_id);

  return rows;
}

(async () => {
  const [year, month] = dateStr.split('-');
  const monthDir = path.join(EXPORTS_DIR, year, `${year}-${month}`);
  const outFile = path.join(monthDir, `${dateStr}_line-items.${OUTPUT_SUFFIX}.csv`);
  const dayDir = path.join(monthDir, dateStr);
  ensureDir(dayDir);
  function resolveOrdersFile() {
    const primary = path.join(monthDir, `${dateStr}_orders.csv`);
    if (fs.existsSync(primary)) return primary;
    // Fallback: any suffixed version e.g. _orders.v2.csv in month dir
    const files = fs.readdirSync(monthDir).filter(f => f.startsWith(`${dateStr}_orders.`) && f.endsWith('.csv'));
    if (files.length > 0) return path.join(monthDir, files[0]);
    // Fallback: per-day copy in dayDir
    const perDay = path.join(dayDir, `${dateStr}_orders.csv`);
    if (fs.existsSync(perDay)) return perDay;
    return '';
  }
  const ordersPath = resolveOrdersFile();
  if (!ordersPath) {
    console.error(`Orders CSV not found in ${monthDir} or ${dayDir}.`);
    console.error(`Hint: run: node scripts/test_orders_export.mjs ${dateStr}`);
    process.exit(1);
  }
  console.log(`Reading orders from: ${ordersPath}`);
  const orders = readOrdersCsv(ordersPath);
  ensureDir(monthDir);

  const HEADLESS = process.env.HEADLESS === 'false' ? false : true;
  const SLOWMO = Number(process.env.SLOWMO || 0);
  const ONLY_ORDER_ID = process.env.ONLY_ORDER_ID || '';
  const LIMIT = Number(process.env.LIMIT || 0);

  const browser = await chromium.launch({ headless: HEADLESS, slowMo: SLOWMO });
  const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
  const page = await context.newPage();

  // Ensure we are authenticated (storage state can expire)
  async function authenticateWithFallback() {
    try {
      await page.goto(BASE_URL, { timeout: 60000 });
      await page.waitForSelector('[role="grid"]', { timeout: 10000 });
      return true;
    } catch {
      try {
        await page.goto(BASE_URL, { timeout: 60000 });
        await page.getByRole('link', { name: 'Login with my company email' }).click();
        await page.getByRole('textbox', { name: 'Enter your email, phone, or' }).fill(USERNAME);
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByRole('textbox', { name: /Enter the password for/ }).fill(PASSWORD);
        await page.getByRole('button', { name: 'Sign in' }).click();
        await page.getByRole('button', { name: 'Yes' }).click({ timeout: 10000 }).catch(() => {});
        await page.waitForSelector('[role="grid"]', { timeout: 30000 });
        await context.storageState({ path: STORAGE_STATE_PATH });
        return true;
      } catch {
        return false;
      }
    }
  }
  const ok = await authenticateWithFallback();
  if (!ok) { console.error('Auth failed for line-items export'); await browser.close(); process.exit(1); }

  const results = [];
  let processed = 0;
  for (let i=0;i<orders.length;i++){
    const o = orders[i];
    if (ONLY_ORDER_ID && o.order_id !== ONLY_ORDER_ID) continue;
    const rows = await extractFromOrder(page, o);
    results.push(...rows);
    processed++;
    if ((processed)%5===0 || i===orders.length-1) console.log(`Processed ${processed}/${ONLY_ORDER_ID? 'filtered' : orders.length}`);
    if (LIMIT && processed >= LIMIT) break;
  }

  const lines = [COLS.join(',')];
  for (const r of results) lines.push(COLS.map(c=>csvEscape(r[c] ?? '')).join(','));
  fs.writeFileSync(outFile, lines.join('\n'), 'utf8');
  // Also write a copy inside per-day folder named YYYY-MM-DD_line-items.csv
  const perDay = path.join(dayDir, `${dateStr}_line-items.csv`);
  fs.writeFileSync(perDay, lines.join('\n'), 'utf8');
  console.log(`Wrote ${results.length} rows -> ${outFile}`);
  console.log(`Wrote ${results.length} rows -> ${perDay}`);

  await browser.close();
})();
