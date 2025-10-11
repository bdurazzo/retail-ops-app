import { chromium } from 'playwright';

// Usage: node scripts/debug_line_items.mjs <order_url>
const ORDER_URL = process.argv[2];
if (!ORDER_URL) {
  console.error('Usage: node scripts/debug_line_items.mjs <order_url>');
  process.exit(1);
}

const STORAGE_STATE_PATH = 'storageState.json';

function log(section, kv = {}) {
  const ts = new Date().toISOString();
  const extra = Object.entries(kv).map(([k, v]) => `${k}=${v}`).join(' ');
  console.log(`[${ts}] ${section}${extra ? ' | ' + extra : ''}`);
}

async function textOf(locator, limit = 2000) {
  try {
    const txt = (await locator.first().innerText({ timeout: 3000 })).trim();
    return txt.slice(0, limit);
  } catch {
    return '';
  }
}

(async () => {
  log('launching');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
  const page = await context.newPage();

  log('goto', { url: ORDER_URL });
  await page.goto(ORDER_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});

  // Small settle
  await page.waitForTimeout(2000);

  // Probe common containers
  const probes = [
    { name: 'ant-table rows', q: '.ant-table table tbody tr' },
    { name: 'ant-list items', q: '.ant-list .ant-list-item' },
    { name: 'ant-descriptions items', q: '.ant-descriptions .ant-descriptions-item' },
    { name: 'generic line-item classes', q: '[class*="line-item" i], [class*="order-item" i], [class*="product" i]' },
    { name: 'data-test line items', q: '[data-test*="line" i], [data-testid*="line" i]' },
    { name: 'price cells', q: ':text("$")' },
  ];

  for (const { name, q } of probes) {
    const loc = page.locator(q);
    const count = await loc.count();
    log('probe', { name, count });
    if (count > 0) {
      const sample = await textOf(loc.nth(0));
      log('sample', { name, sample: sample.replace(/\s+/g, ' ').slice(0, 200) });
    }
  }

  // If there is a visible table, dump first few rows' cell texts
  const tblRows = page.locator('.ant-table table tbody tr');
  const rowCount = await tblRows.count();
  if (rowCount > 0) {
    log('table_rows_found', { rows: rowCount });
    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      const row = tblRows.nth(i);
      const cells = row.locator('td');
      const c = await cells.count();
      const values = [];
      for (let j = 0; j < c; j++) {
        values.push((await textOf(cells.nth(j), 200)).replace(/\s+/g, ' '));
      }
      console.log(`ROW ${i}: ${values.join(' | ')}`);
    }
  }

  // Dump first few ant-descriptions groups (often used for item attributes)
  const descGroups = page.locator('.ant-descriptions');
  const dCount = await descGroups.count();
  log('ant_descriptions_groups', { count: dCount });
  for (let i = 0; i < Math.min(dCount, 5); i++) {
    const grp = descGroups.nth(i);
    const text = (await grp.innerText().catch(() => ''))?.trim().replace(/\s+/g, ' ').slice(0, 300) || '';
    console.log(`DESCRIPTIONS[${i}]: ${text}`);
  }

  // Dump first few ant-card blocks (common grouping)
  const cards = page.locator('.ant-card');
  const cCount = await cards.count();
  log('ant_card_groups', { count: cCount });
  for (let i = 0; i < Math.min(cCount, 5); i++) {
    const card = cards.nth(i);
    const header = await textOf(card.locator('.ant-card-head-title'));
    const body = (await card.locator('.ant-card-body').innerText().catch(() => ''))?.trim().replace(/\s+/g, ' ').slice(0, 300) || '';
    console.log(`CARD[${i}] title="${header}" body="${body}"`);
  }

  await browser.close();
  log('done');
})().catch(err => { console.error(err); process.exit(1); });
