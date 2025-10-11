import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs/promises';
import cliProgress from 'cli-progress';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function shortenMiddle(s, max = 60) {
  const str = String(s || '');
  if (str.length <= max) return str;
  const half = Math.floor((max - 3) / 2);
  return str.slice(0, half) + '...' + str.slice(str.length - half);
}

const START_URL = 'https://manager.filson.p.newstore.net/store-operations/inventory/stock-on-hand?catalog=storefront-catalog-en&locale=en-us&location_id=50003';
// Output root (project root), timestamped run directory, and helpers
const OUT_ROOT = path.resolve(__dirname, '..', 'soh_exports');
const RUN_TS = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19); // e.g., 2025-08-28-18-10-05
const OUT_DIR = path.join(OUT_ROOT, RUN_TS);

const ROWS_SEL = 'table.core-table tbody tr';
const EXPORT_BTN_IN_ROW = 'td:last-child button';
const NEXT_LINK_SEL = 'nav[aria-label="Pagination Navigation"] a[aria-label="Next"]';
const PRODUCT_ID_IN_ROW = 'td:nth-child(2) a';

// Text normalization helpers
const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;
function normalizeText(s) {
  return (s || '')
    .replace(ZERO_WIDTH_RE, '')
    .replace(/\s+/g, ' ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
async function cellText(row, selector) {
  try {
    const t = await row.locator(selector).innerText();
    return normalizeText(t);
  } catch {
    return '';
  }
}
// File/path-safe segment sanitizer (hyphens)
function sanitizeSegment(s) {
  let t = normalizeText(s || '');
  t = t.replace(/[^A-Za-z0-9.\-]+/g, '-');
  t = t.replace(/-+/g, '-');
  t = t.replace(/^[\-.]+|[\-.]+$/g, '');
  t = t.toLowerCase();
  if (!t) t = 'na';
  if (t.length > 80) t = t.slice(0, 80);
  return t;
}
// Shard by last four digits of productId as nested folders: <last2>/<prev2>
function shardFromProductId(productId) {
  const id = String(productId || '');
  const last2 = id.slice(-2).padStart(2, '0');
  const prev2 = id.slice(-4, -2).padStart(2, '0');
  return path.join(last2, prev2);
}

await fs.mkdir(OUT_DIR, { recursive: true });

const MANIFEST = path.join(OUT_DIR, 'manifest.csv');
try {
  await fs.access(MANIFEST);
} catch {
  await fs.writeFile(
    MANIFEST,
    'timestamp,product_id,filename,shard,relative_path,status,message\n',
    { encoding: 'utf8' }
  );
}

const browser = await chromium.launch({ headless: false }); // switch to true once stable
const context = await browser.newContext({
  acceptDownloads: true,
  storageState: 'storageState.json', // created by auth.setup.mjs
});
const page = await context.newPage();

await page.goto(START_URL, { waitUntil: 'domcontentloaded' });

// Determine total rows from the pagination label '1–10 of 10791'
let totalRows = 0;
try {
  const label = await page.locator('nav[aria-label="Pagination Navigation"] span').innerText();
  const m = label && label.match(/of\s+(\d+)/i);
  if (m) totalRows = parseInt(m[1], 10) || 0;
} catch {}

// Try to derive page size and total pages from label like "1–10 of 10791"
let totalPages = 0;
let pageSize = 0;
try {
  // supports en dash or hyphen
  const label2 = await page.locator('nav[aria-label="Pagination Navigation"] span').innerText();
  const m2 = label2 && label2.match(/(\d+)\s*[–-]\s*(\d+)\s+of\s+(\d+)/i);
  if (m2) {
    const start = parseInt(m2[1], 10) || 1;
    const end = parseInt(m2[2], 10) || 0;
    pageSize = Math.max(0, end - start + 1);
    if (totalRows && pageSize) totalPages = Math.ceil(totalRows / pageSize);
  }
} catch {}

let processedCount = 0;
let barPayload = { last: '' };
const bar = new cliProgress.SingleBar({
  stopOnComplete: true,
  hideCursor: true,
  linewrap: false,
  format: ' {bar} {percentage}% | ETA: {eta}s | {value}/{total} | {last}'
}, cliProgress.Presets.shades_classic);
if (totalRows > 0) bar.start(totalRows, processedCount, barPayload);

function logBelowBar(msg) {
  if (totalRows > 0 && bar && bar.isActive) {
    const wasActive = bar.isActive;
    const current = processedCount;
    const payload = { ...barPayload };
    try { bar.stop(); } catch {}
    console.log(msg);
    if (wasActive) {
      try { bar.start(totalRows, current, payload); } catch {}
    }
  } else {
    console.log(msg);
  }
}

let pageIndex = 0;
let grandTotal = 0;
let successCount = 0;
let failureCount = 0;
const failures = [];

while (true) {
  pageIndex++;
  await page.waitForSelector(ROWS_SEL, { timeout: 30000 });
  const rows = page.locator(ROWS_SEL);
  const rowCount = await rows.count();
  logBelowBar(`Page ${pageIndex}${totalPages ? `/${totalPages}` : ''}: ${rowCount} rows`);

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);

    const productIdRaw      = await cellText(row, 'td:nth-child(2) a');

    const productIdSafe = sanitizeSegment(productIdRaw || `row${i+1}`);
    const shardRel = shardFromProductId(productIdSafe); // e.g., "32/94"
    const shardDir = path.join(OUT_DIR, shardRel);
    await fs.mkdir(shardDir, { recursive: true });
    const filename = `${productIdSafe}-stock-on-hand-portland-50003.csv`;
    const targetPath = path.join(shardDir, filename);

    const ts = new Date().toISOString();
    try {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 120_000 }),
        row.locator('td:nth-child(11) button').click()
      ]);
      await download.saveAs(targetPath);
      grandTotal++;
      await fs.appendFile(
        MANIFEST,
        `${ts},${productIdSafe},${filename},${shardRel},${JSON.stringify(path.relative(OUT_DIR, targetPath))},success,\n`,
        { encoding: 'utf8' }
      );
      successCount++;
      processedCount++;
      barPayload.last = `✔ ${shortenMiddle(path.relative(OUT_DIR, targetPath), 60)}`;
      if (totalRows > 0) bar.increment(1, { last: barPayload.last });
    } catch (err) {
      processedCount++;
      barPayload.last = `✖ ${shortenMiddle(path.join(shardRel, filename), 60)}`;
      if (totalRows > 0) bar.increment(1, { last: barPayload.last });
      await fs.appendFile(
        MANIFEST,
        `${ts},${productIdSafe},${filename},${shardRel},${JSON.stringify(path.join(shardRel, filename))},error,${JSON.stringify(String(err))}\n`,
        { encoding: 'utf8' }
      );
      failureCount++;
      failures.push({
        product_id: productIdSafe,
        shard: shardRel,
        relative_path: path.join(shardRel, filename),
        message: String(err && err.message ? err.message : err)
      });
    }
  }

  const next = await page.$(NEXT_LINK_SEL);
  if (!next) {
    logBelowBar('No Next link found; done.');
    break;
  }
  const href = await next.getAttribute('href');
  if (!href) {
    logBelowBar('Next link has no href; done.');
    break;
  }
  await page.goto(new URL(href, page.url()).toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
}

if (totalRows > 0) try { bar.stop(); } catch {}

if (failureCount > 0) {
  logBelowBar(`\nSummary: ${successCount} success, ${failureCount} failed`);
  const FAIL_CSV = path.join(OUT_DIR, 'failures.csv');
  // header
  await fs.writeFile(
    FAIL_CSV,
    'product_id,shard,relative_path,message\n',
    { encoding: 'utf8' }
  );
  for (const f of failures) {
    const line = [
      f.product_id,
      f.shard,
      JSON.stringify(f.relative_path),
      JSON.stringify(f.message)
    ].join(',') + '\n';
    await fs.appendFile(FAIL_CSV, line, { encoding: 'utf8' });
  }
  // show first few in console
  const preview = failures.slice(0, Math.min(10, failures.length));
  for (const f of preview) {
    logBelowBar(`  ✖ ${f.product_id} :: ${f.message}`);
  }
  if (failures.length > preview.length) {
    logBelowBar(`  … plus ${failures.length - preview.length} more (see failures.csv)`);
  }
} else {
  logBelowBar(`\nSummary: ${successCount} success, 0 failed`);
}

logBelowBar(`All done. Saved ${grandTotal} CSV file(s) to ${OUT_DIR}`);
await browser.close();