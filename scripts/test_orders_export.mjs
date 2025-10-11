import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Test-only orders exporter: builds orders.csv with totals for a given day.
// Usage: EXPORTS_DIR=orders_exports_TEST node scripts/test_orders_export.mjs YYYY-MM-DD

const EXPORTS_DIR = process.env.EXPORTS_DIR || 'orders_exports';
const STORAGE_STATE_PATH = 'storageState.json';
const dateStr = process.argv[2];
const OUTPUT_SUFFIX = process.env.OUTPUT_SUFFIX || 'v2';
const BASE_URL = 'https://manager.filson.p.newstore.net/sales/orders';
const USERNAME = process.env.NS_USERNAME || 'ben.durazzo@filson.com';
const PASSWORD = process.env.NS_PASSWORD || 'BDbd6464555@';

if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
  console.error('Usage: node scripts/test_orders_export.mjs YYYY-MM-DD');
  process.exit(1);
}

const COLS = [
  'order_id','date_time','channel_type','channel','demand_location','fulfillment_location','associate',
  'customer_id','customer_name','email','shipping_option',
  'subtotal','total_discounts','taxes_total','total'
];

function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function csvEscape(v){ if (v == null) return ''; const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; }
function moneyToPlain(s){ if (!s) return '0'; const v = String(s).replace(/[^0-9.\-]/g, ''); return v === '' ? '0' : v; }

function readOrdersCsv(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines.shift();
  const cols = header.split(',');
  const idx = Object.fromEntries(cols.map((c,i)=>[c,i]));
  const rows = [];
  for (const line of lines) {
    // naive CSV split (ok for current files)
    const cells = []; let cur=''; let inQ=false;
    for (let i=0;i<line.length;i++){ const ch=line[i]; if (ch==='"'){ inQ=!inQ; cur+=ch; } else if (ch===',' && !inQ){ cells.push(cur); cur=''; } else cur+=ch; }
    cells.push(cur);
    const val=(k)=> (cells[idx[k]]||'').replace(/^"|"$/g,'');
    rows.push({
      order_id: val('order_id'),
      href: val('href'),
      date_time: val('date_time'),
      channel_type: val('channel_type'),
      channel: val('channel'),
      demand_location: val('demand_location'),
      fulfillment_location: val('fulfillment_location'),
      associate: val('associate'),
      customer_name: val('customer_name'),
    });
  }
  return rows;
}

async function extractOrderTotals(page, href){
  await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  return await page.evaluate(() => {
    const norm=(s)=> (s||'').replace(/\s+/g,' ').trim();
    function findByLabel(label){
      const xp = `//*[normalize-space(text())='${label}']`;
      const it = document.evaluate(xp, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (let i=0;i<it.snapshotLength;i++){
        const el = it.snapshotItem(i);
        const parent = el.parentElement;
        if (parent){
          // look right siblings on same row
          const kids = Array.from(parent.children);
          const idx = kids.indexOf(el);
          for (let j=idx+1;j<kids.length;j++){
            const t = norm(kids[j].textContent||'');
            const m = t.match(/\$[0-9][\d,]*\.?\d*/);
            if (m) return m[0];
          }
        }
      }
      return '';
    }
    function findSimple(label){
      const xp = `//*[normalize-space(text())='${label}']`;
      const it = document.evaluate(xp, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      if (it.snapshotLength===0) return '';
      const node = it.snapshotItem(0);
      let v='';
      if (node.parentElement){ const sib = node.parentElement.querySelector(':scope > *:not(:first-child)'); if (sib) v = norm(sib.textContent); }
      if (!v && node.nextElementSibling) v = norm(node.nextElementSibling.textContent);
      return v;
    }
    return {
      customer_id: findSimple('Customer ID'),
      customer_name: findSimple('Customer Name'),
      email: findSimple('Email'),
      shipping_option: findSimple('Shipping Option'),
      subtotal: findByLabel('Subtotal'),
      total_discounts: findByLabel('Total discounts'),
      taxes_total: findByLabel('Taxes'),
      total: findByLabel('Total')
    };
  });
}

(async () => {
  const [year, month] = dateStr.split('-');
  const monthDir = path.join(EXPORTS_DIR, year, `${year}-${month}`);
  const dayDir = path.join(monthDir, dateStr);
  ensureDir(monthDir); ensureDir(dayDir);

  const ordersListFile = path.join(monthDir, `${dateStr}_orders.csv`);
  if (!fs.existsSync(ordersListFile)) { console.error(`Orders CSV not found: ${ordersListFile}`); process.exit(1); }
  const orders = readOrdersCsv(ordersListFile);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
  const page = await context.newPage();

  // Ensure authenticated
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
  if (!ok) { console.error('Auth failed for orders export'); await browser.close(); process.exit(1); }

  const output = [];
  for (let i=0;i<orders.length;i++){
    const o = orders[i];
    const totals = await extractOrderTotals(page, o.href);
    output.push({
      order_id: o.order_id,
      date_time: o.date_time,
      channel_type: o.channel_type,
      channel: o.channel,
      demand_location: o.demand_location,
      fulfillment_location: o.fulfillment_location,
      associate: o.associate,
      customer_id: totals.customer_id || '',
      customer_name: totals.customer_name || o.customer_name || '',
      email: totals.email || '',
      shipping_option: totals.shipping_option || '',
      subtotal: moneyToPlain(totals.subtotal),
      total_discounts: moneyToPlain(totals.total_discounts),
      taxes_total: moneyToPlain(totals.taxes_total),
      total: moneyToPlain(totals.total)
    });
    if ((i+1)%5===0 || i===orders.length-1) console.log(`Orders: ${i+1}/${orders.length}`);
  }

  const lines = [COLS.join(',')];
  for (const r of output){ lines.push(COLS.map(c => csvEscape(r[c] ?? '')).join(',')); }

  // Write to month dir and per-day subfolder
  const outMonth = path.join(monthDir, `${dateStr}_orders.${OUTPUT_SUFFIX}.csv`);
  const outDay = path.join(dayDir, `${dateStr}_orders.csv`);
  fs.writeFileSync(outMonth, lines.join('\n'), 'utf8');
  fs.writeFileSync(outDay, lines.join('\n'), 'utf8');
  console.log(`Wrote ${output.length} rows -> ${outMonth}`);
  console.log(`Wrote ${output.length} rows -> ${outDay}`);

  await browser.close();
})();
