import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Usage: EXPORTS_DIR=orders_exports_TEST node scripts/rebuild_day_line_items.mjs 2025-08-31
const EXPORTS_DIR = process.env.EXPORTS_DIR || 'orders_exports';
const STORAGE_STATE_PATH = 'storageState.json';
const dateStr = process.argv[2];
if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
  console.error('Usage: node scripts/rebuild_day_line_items.mjs YYYY-MM-DD');
  process.exit(1);
}

function log(msg) { console.log(`[rebuild] ${msg}`); }

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function arrayToCSV(data) {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  for (const row of data) {
    const values = headers.map(h => {
      const v = row[h] ?? '';
      return typeof v === 'string' && (v.includes(',') || v.includes('"') || v.includes('\n'))
        ? '"' + v.replace(/"/g, '""') + '"'
        : v;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

function readOrdersCsv(file) {
  const text = fs.readFileSync(file, 'utf8');
  const [header, ...rows] = text.split(/\r?\n/).filter(Boolean);
  const cols = header.split(',');
  const idx = Object.fromEntries(cols.map((c, i) => [c, i]));
  return rows.map(line => {
    const cells = line.split(',');
    return {
      order_id: cells[idx.order_id],
      href: cells[idx.href],
      customer_name: cells[idx.customer_name],
      associate: cells[idx.associate],
      date_time: cells[idx.date_time],
      channel_type: cells[idx.channel_type],
      channel: cells[idx.channel],
      fulfillment_type: cells[idx.fulfillment_type],
      demand_location: cells[idx.demand_location],
      fulfillment_location: cells[idx.fulfillment_location],
      carrier: cells[idx.carrier],
      shipment_method: cells[idx.shipment_method],
      total: cells[idx.total],
      discount: cells[idx.discount],
      status: cells[idx.status]
    };
  });
}

async function extractOrderLineItems(page, orderInfo) {
  const lineItems = [];
  const orderPage = await page.context().newPage();
  try {
    await orderPage.goto(orderInfo.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await orderPage.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
    await orderPage.waitForSelector('.ant-descriptions', { timeout: 10000 }).catch(() => {});

    const groups = await orderPage.evaluate(() => {
      function labelKey(s) {
        return (s || '').trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
      }
      function findPrice(el) {
        if (!el) return '';
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT, null);
        let node = walker.currentNode;
        while (node) {
          const txt = node.textContent || '';
          const m = txt.match(/\$[0-9][\d,]*\.?\d*/);
          if (m) return m[0];
          node = walker.nextNode();
        }
        return '';
      }
      const arr = [];
      document.querySelectorAll('.ant-descriptions').forEach(group => {
        const item = {};
        group.querySelectorAll('.ant-descriptions-item').forEach(it => {
          const label = it.querySelector('.ant-descriptions-item-label')?.textContent || '';
          const val = it.querySelector('.ant-descriptions-item-content')?.textContent || '';
          const k = labelKey(label);
          if (k) item[k] = val.trim();
        });
        const unitPrice = findPrice(group);
        const rawText = (group.innerText || '').trim();
        arr.push({ item, unitPrice, rawText });
      });
      return arr;
    });

    let found = false;
    for (const grp of groups) {
      const kv = grp.item || {};
      const hasLineKeys = ['SKU', 'UPC', 'AX_ITEM_NUMBER', 'JASPER_PRODUCT_ID', 'VARIANT_GROUP_ID']
        .some(k => kv[k] && kv[k].length);
      if (!hasLineKeys) continue;
      lineItems.push({
        order_id: orderInfo.order_id,
        line_number: lineItems.length + 1,
        product_name: kv.PRODUCT_NAME || kv.SKU || 'Item',
        sku: kv.SKU || '',
        upc: kv.UPC || '',
        color: kv.COLOR || '',
        size: kv.SIZE || '',
        quantity: kv.QTY || kv.QUANTITY || '1',
        ax_item_number: kv.AX_ITEM_NUMBER || '',
        jasper_product_id: kv.JASPER_PRODUCT_ID || '',
        magento_sku: kv.MAGENTO_SKU || '',
        variant_group_id: kv.VARIANT_GROUP_ID || '',
        tax_class_id: kv.TAX_CLASS_ID || '',
        product_id: kv.PRODUCT_ID || '',
        status: orderInfo.status || 'Complete',
        unit_price: grp.unitPrice || orderInfo.total || '',
        line_discount: orderInfo.discount || '',
        discounted_price: grp.unitPrice || orderInfo.total || '',
        taxes: ''
      });
      found = true;
    }
    if (!found) {
      const pageText = (await orderPage.locator('body').innerText().catch(() => '')) || '';
      const m = pageText.match(/\$[0-9][\d,]*\.?\d*/);
      lineItems.push({
        order_id: orderInfo.order_id,
        line_number: 1,
        product_name: 'Store Purchase',
        sku: '', upc: '', color: '', size: '', quantity: '1',
        ax_item_number: '', jasper_product_id: '', magento_sku: '',
        variant_group_id: '', tax_class_id: '', product_id: '',
        status: orderInfo.status || 'Complete',
        unit_price: m ? m[0] : (orderInfo.total || '$0.00'),
        line_discount: orderInfo.discount || '',
        discounted_price: m ? m[0] : (orderInfo.total || '$0.00'),
        taxes: ''
      });
    }
  } finally {
    await orderPage.close();
  }
  return lineItems;
}

(async () => {
  const [year, month] = dateStr.split('-');
  const monthDir = path.join(EXPORTS_DIR, year, `${year}-${month}`);
  const ordersFile = path.join(monthDir, `${dateStr}_orders.csv`);
  const outFile = path.join(monthDir, `${dateStr}_line-items.csv`);
  if (!fs.existsSync(ordersFile)) {
    console.error(`Orders CSV not found: ${ordersFile}`);
    process.exit(1);
  }
  const orders = readOrdersCsv(ordersFile);
  log(`Loaded ${orders.length} orders from ${ordersFile}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
  const page = await context.newPage();

  const all = [];
  for (let i = 0; i < orders.length; i++) {
    const li = await extractOrderLineItems(page, orders[i]);
    all.push(...li);
    if ((i + 1) % 5 === 0 || i === orders.length - 1) {
      log(`Progress: ${i + 1}/${orders.length}`);
    }
  }

  ensureDirectoryExists(monthDir);
  const csv = arrayToCSV(all);
  fs.writeFileSync(outFile, csv, 'utf8');
  log(`Wrote ${all.length} line items -> ${outFile}`);

  await browser.close();
})();

