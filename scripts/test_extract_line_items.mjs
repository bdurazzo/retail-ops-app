import { chromium } from 'playwright';

const ORDER = {
  order_id: 'FCO00542057',
  href: 'https://manager.filson.p.newstore.net/sales/orders/81f1f049-062d-4421-89de-50150fc505bd',
  status: 'Complete',
  total: '$27.50',
  discount: ''
};

const STORAGE_STATE_PATH = 'storageState.json';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
  const page = await context.newPage();
  const lineItems = [];

  await page.goto(ORDER.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  await page.waitForSelector('.ant-descriptions', { timeout: 10000 }).catch(() => {});

  const groups = await page.evaluate(() => {
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
      arr.push({ item, unitPrice });
    });
    return arr;
  });

  for (const grp of groups) {
    const kv = grp.item || {};
    const hasLineKeys = ['SKU', 'UPC', 'AX_ITEM_NUMBER', 'JASPER_PRODUCT_ID', 'VARIANT_GROUP_ID']
      .some(k => kv[k] && kv[k].length);
    if (!hasLineKeys) continue;
    lineItems.push({
      order_id: ORDER.order_id,
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
      product_id: kv.PRODUCT_ID || kv['PRODUCT_ID'] || '',
      status: ORDER.status,
      unit_price: grp.unitPrice || ORDER.total,
      line_discount: ORDER.discount || '',
      discounted_price: grp.unitPrice || ORDER.total,
      taxes: ''
    });
  }

  console.log(JSON.stringify(lineItems, null, 2));
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });

