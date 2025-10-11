import { chromium } from 'playwright';
import fs from 'fs';

// Usage: node scripts/sample_order_to_csv.mjs <order_id> <href>
const ORDER_ID = process.argv[2];
const HREF = process.argv[3];
if (!ORDER_ID || !HREF) {
  console.error('Usage: node scripts/sample_order_to_csv.mjs <order_id> <href>');
  process.exit(1);
}

const STORAGE_STATE_PATH = 'storageState.json';

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function headers() {
  return [
    'order_id','order_date_time','channel_type','fulfillment','demand_location','fulfillment_location','associate',
    'customer_id','customer_name','email','shipping_option','billing_address',
    'product_name','color','size','ax_item_number','jasper_product_id','magento_sku','sku','tax_class_id','upc','variant_group_id','product_id','quantity',
    'unit_price','line_discount','discounted_price','taxes','subtotal','total_discounts','total'
  ];
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
  const page = await context.newPage();

  await page.goto(HREF, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});

  const data = await page.evaluate((ORDER_ID) => {
    function norm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
    function findByLabel(label) {
      const xpath = `//*[normalize-space(text())='${label}']`;
      const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      if (result.snapshotLength === 0) return '';
      const node = result.snapshotItem(0);
      // Try next sibling text
      let v = '';
      if (node.parentElement) {
        const sib = node.parentElement.querySelector(':scope > *:not(:first-child)');
        if (sib) v = norm(sib.textContent);
      }
      if (!v && node.nextElementSibling) v = norm(node.nextElementSibling.textContent);
      return v;
    }
    function extractTotals() {
      const labels = ['Subtotal','Total discounts','Total'];
      const out = {};
      for (const lab of labels) {
        const xp = `//*[contains(normalize-space(.), '${lab}')]`;
        const it = document.evaluate(xp, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < it.snapshotLength; i++) {
          const el = it.snapshotItem(i);
          const text = norm(el.textContent);
          const m = text.match(/\$[0-9][\d,]*\.?\d*/);
          if (m) { out[lab] = m[0]; break; }
          // try sibling on the right
          const price = el.parentElement?.querySelector('*:not(:first-child)');
          const t = norm(price?.textContent || '');
          const m2 = t.match(/\$[0-9][\d,]*\.?\d*/);
          if (m2) { out[lab] = m2[0]; break; }
        }
      }
      return out;
    }
    function keyify(s){return (s||'').trim().toUpperCase().replace(/\s+/g,'_').replace(/[^A-Z0-9_]/g,'');}
    function parseKVFromDescriptions(group){
      const kv = {};
      const lines = norm(group.innerText).split(/\s{2,}|\n/);
      // Prefer structured pairs
      group.querySelectorAll('.ant-descriptions-item').forEach(it => {
        const label = norm(it.querySelector('.ant-descriptions-item-label')?.textContent || '');
        const val = norm(it.querySelector('.ant-descriptions-item-content')?.textContent || '');
        if (label) kv[keyify(label)] = val;
      });
      // Fallback: scan text for known keys
      const known = ['Color','Size','AX_ITEM_NUMBER','JASPER_PRODUCT_ID','MAGENTO_SKU','SKU','TAX_CLASS_ID','UPC','VARIANT_GROUP_ID','Product ID'];
      const txt = norm(group.innerText);
      for (const k of known) {
        const re = new RegExp(`${k}\s*:?\s*([^\n]+)`);
        const m = txt.match(re);
        if (m) kv[keyify(k)] = norm(m[1]);
      }
      return kv;
    }
    function closestRowRoot(el){
      let cur = el;
      while (cur && cur !== document.body) {
        if (cur.querySelector('a') && /\$[0-9]/.test(cur.textContent||'')) return cur;
        cur = cur.parentElement;
      }
      return el;
    }
    function amountsFromRow(row, excludeWithin){
      const amounts = [];
      const walker = document.createTreeWalker(row, NodeFilter.SHOW_ELEMENT, null);
      let n = walker.currentNode;
      while (n) {
        if (excludeWithin && excludeWithin.contains(n)) { n = walker.nextSibling(); continue; }
        const t = (n.textContent||'').trim();
        const m = t.match(/\$[0-9][\d,]*\.?\d*/);
        if (m) amounts.push(m[0]);
        n = walker.nextNode();
      }
      // De-dup consecutive identical matches
      return amounts.filter((v,i,a)=> i===0 || v!==a[i-1]);
    }

    // Order-level fields
    const order = {
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
    const totals = extractTotals();

    // Line items via descriptions groups
    const items = [];
    const groups = Array.from(document.querySelectorAll('.ant-descriptions'));
    for (const g of groups) {
      const kv = parseKVFromDescriptions(g);
      const hasLineKeys = ['SKU','UPC','AX_ITEM_NUMBER','JASPER_PRODUCT_ID','VARIANT_GROUP_ID']
        .some(k => kv[k]);
      if (!hasLineKeys) continue;
      const row = closestRowRoot(g);
      const link = row.querySelector('a');
      const product_name = norm(link?.textContent || '');
      const amts = amountsFromRow(row, g);
      const unit_price = amts[0] || '';
      const line_discount = amts[1] || 'N/A';
      const discounted_price = amts[2] || unit_price || '';
      const taxes = amts[3] || '';

      items.push({
        order_id: ORDER_ID,
        product_name,
        color: kv.COLOR || '',
        size: kv.SIZE || '',
        ax_item_number: kv.AX_ITEM_NUMBER || '',
        jasper_product_id: kv.JASPER_PRODUCT_ID || '',
        magento_sku: kv.MAGENTO_SKU || '',
        sku: kv.SKU || '',
        tax_class_id: kv.TAX_CLASS_ID || '',
        upc: kv.UPC || '',
        variant_group_id: kv.VARIANT_GROUP_ID || '',
        product_id: kv.PRODUCT_ID || '',
        quantity: kv.QTY || kv.QUANTITY || '1',
        unit_price, line_discount, discounted_price, taxes,
        subtotal: totals['Subtotal'] || '',
        total_discounts: totals['Total discounts'] || '',
        total: totals['Total'] || ''
      });
    }

    return { order, items };
  }, ORDER_ID);

  const cols = headers();
  const lines = [cols.join(',')];
  for (const it of data.items) {
    const row = {
      order_id: ORDER_ID,
      order_date_time: data.order.order_date_time,
      channel_type: data.order.channel_type,
      fulfillment: data.order.fulfillment,
      demand_location: data.order.demand_location,
      fulfillment_location: data.order.fulfillment_location,
      associate: data.order.associate,
      customer_id: data.order.customer_id,
      customer_name: data.order.customer_name,
      email: data.order.email,
      shipping_option: data.order.shipping_option,
      billing_address: data.order.billing_address,
      ...it
    };
    const values = cols.map(c => csvEscape(row[c] ?? ''));
    lines.push(values.join(','));
  }

  console.log(lines.join('\n'));
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });

