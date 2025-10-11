import { chromium } from 'playwright';

// Usage: node scripts/sample_order_to_csv_v2.mjs <order_id> <href>
const ORDER_ID = process.argv[2];
const HREF = process.argv[3];
if (!ORDER_ID || !HREF) {
  console.error('Usage: node scripts/sample_order_to_csv_v2.mjs <order_id> <href>');
  process.exit(1);
}

const STORAGE_STATE_PATH = 'storageState.json';

const COLS = [
  'order_id','order_date_time','channel_type','fulfillment','demand_location','fulfillment_location','associate',
  'customer_id','customer_name','email','shipping_option','billing_address',
  'product_name','color','size','ax_item_number','jasper_product_id','magento_sku','sku','tax_class_id','upc','variant_group_id','product_id','quantity',
  'unit_price','line_discount','discounted_price','taxes','subtotal','total_discounts','total'
];

function csvEscape(v){
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
  const page = await context.newPage();
  await page.goto(HREF, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});

  const out = await page.evaluate((ORDER_ID) => {
    const norm = (s) => (s||'').replace(/\s+/g, ' ').trim();
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

    function extractTotals(){
      const labels = ['Subtotal','Total discounts','Total'];
      const out = {};
      for (const lab of labels) {
        const xp = `//*[normalize-space(text())='${lab}']`;
        const it = document.evaluate(xp, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i=0;i<it.snapshotLength;i++){
          const el = it.snapshotItem(i);
          // 1) try immediate next siblings within same parent
          const parent = el.parentElement;
          if (parent) {
            const kids = Array.from(parent.children);
            const idx = kids.indexOf(el);
            for (let j=idx+1;j<kids.length;j++){
              const t = (kids[j].textContent||'').trim();
              const m = t.match(/\$[0-9][\d,]*\.?\d*/);
              if (m) { out[lab] = m[0]; break; }
            }
            if (out[lab]) break;
          }
          // 2) search upward to a container and find the first $ to the right
          let container = el.parentElement;
          let steps = 0;
          while (container && steps < 4) { // don't climb too far
            const text = (container.textContent||'').trim();
            if (/\$[0-9]/.test(text)) {
              // pick the closest price that appears after label in DOM order
              const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, null);
              let foundLabel = false;
              let price = '';
              let n = walker.currentNode;
              while (n) {
                if (n === el) { foundLabel = true; }
                if (foundLabel) {
                  const t = (n.textContent||'').trim();
                  const m = t.match(/\$[0-9][\d,]*\.?\d*/);
                  if (m) { price = m[0]; break; }
                }
                n = walker.nextNode();
              }
              if (price) { out[lab] = price; break; }
            }
            container = container.parentElement; steps++;
          }
          if (out[lab]) break;
        }
      }
      return out;
    }

    function parseKV(group){
      const kv = {};
      const items = group.querySelectorAll('.ant-descriptions-item');
      if (items.length){
        items.forEach(it => {
          const label = (it.querySelector('.ant-descriptions-item-label')?.textContent || '').trim();
          const val = (it.querySelector('.ant-descriptions-item-content')?.textContent || '').trim();
          if (label) kv[keyify(label)] = val;
        });
      } else {
        const raw = (group.innerText || '').replace(/\r/g,'');
        const lines = raw.split('\n').map(s=>s.trim()).filter(Boolean);
        for (const line of lines){
          const idx = line.indexOf(':');
          if (idx>-1){
            const label = line.slice(0,idx).trim();
            const val = line.slice(idx+1).trim();
            if (label) kv[keyify(label)] = val;
          }
        }
      }
      return kv;
    }

    function closestRow(el){
      let cur = el;
      while (cur && cur !== document.body){
        if (cur.querySelector('a') && /\$[0-9]/.test(cur.textContent||'')) return cur;
        cur = cur.parentElement;
      }
      return el;
    }

    function amountsFromRow(row, exclude){
      const amounts = [];
      const walker = document.createTreeWalker(row, NodeFilter.SHOW_ELEMENT, null);
      let n = walker.currentNode;
      while(n){
        if (exclude && exclude.contains(n)) { n = walker.nextSibling(); continue; }
        const t = (n.textContent||'').trim();
        const m = t.match(/\$[0-9][\d,]*\.?\d*/);
        if (m) amounts.push(m[0]);
        n = walker.nextNode();
      }
      return amounts.filter((v,i,a)=> i===0 || v!==a[i-1]);
    }

    const orderFields = {
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

    const rows = [];
    const groups = Array.from(document.querySelectorAll('.ant-descriptions'));
    for (const g of groups){
      const kv = parseKV(g);
      const hasLineKeys = ['SKU','UPC','AX_ITEM_NUMBER','JASPER_PRODUCT_ID','VARIANT_GROUP_ID']
        .some(k => kv[k]);
      if (!hasLineKeys) continue;
      const row = closestRow(g);
      const link = row.querySelector('a');
      const product_name = norm(link?.textContent || '');
      const amts = amountsFromRow(row, g);
      const unit_price = amts[0] || '';
      const line_discount = amts[1] || 'N/A';
      const discounted_price = amts[2] || unit_price || '';
      const taxes = amts[3] || '';

      rows.push({
        order_id: ORDER_ID,
        ...orderFields,
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

    return rows;
  }, ORDER_ID);

  // Emit CSV
  console.log(COLS.join(','));
  for (const r of out){
    console.log(COLS.map(c => csvEscape(r[c] ?? '')).join(','));
  }

  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
