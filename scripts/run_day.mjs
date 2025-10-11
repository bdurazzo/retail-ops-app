import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Usage: node scripts/run_day.mjs YYYY-MM-DD
// Runs orders export then line-items export for the given day.

const dateStr = process.argv[2];
if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
  console.error('Usage: node scripts/run_day.mjs YYYY-MM-DD');
  process.exit(1);
}

const ENV = {
  ...process.env,
  // Defaults that make debugging easier; can be overridden by caller
  EXPORTS_DIR: process.env.EXPORTS_DIR || 'orders_exports',
  HEADLESS: process.env.HEADLESS ?? 'false',
  SLOWMO: process.env.SLOWMO || '150',
};

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env: ENV });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

(async () => {
  // Compute monthsBack to target the month of dateStr from today
  const today = new Date();
  const [Y, M] = dateStr.split('-').map(Number);
  const targetMonthIdx = (Y * 12) + (M - 1);
  const currentMonthIdx = (today.getFullYear() * 12) + today.getMonth();
  const monthsBack = Math.max(0, currentMonthIdx - targetMonthIdx);

  console.log(`\n=== Running scraper for ${dateStr} (monthsBack=${monthsBack}) ===`);
  const env = {
    ...ENV,
    DEBUG: process.env.DEBUG ?? 'true',
    SCREENSHOT: process.env.SCREENSHOT ?? 'true',
    MAX_MONTHS: '1',
    START_MONTHS_BACK: String(monthsBack),
    SINGLE_DAY: dateStr,
    FORCE_REBUILD_DATE: dateStr,
    ORDERS_ONLY: 'false',
  };
  await new Promise((resolve, reject) => {
    const child = spawn('node', ['scripts/scrape_orders_by_day.mjs'], { stdio: 'inherit', env });
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`scrape_orders_by_day exited ${code}`)));
  });

  // Verify outputs exist and contain rows
  const [year, month] = dateStr.split('-');
  const monthDir = path.join(ENV.EXPORTS_DIR, year, `${year}-${month}`);
  const dayDir = path.join(monthDir, dateStr);

  function resolveFile(prefix) {
    const base = path.join(monthDir, `${dateStr}_${prefix}.csv`);
    if (fs.existsSync(base)) return base;
    const suffixed = (fs.readdirSync(monthDir, { withFileTypes: true })
      .filter(d => d.isFile() && d.name.startsWith(`${dateStr}_${prefix}.`) && d.name.endsWith('.csv'))
      .map(d => path.join(monthDir, d.name)))[0];
    if (suffixed) return suffixed;
    const perDay = path.join(dayDir, `${dateStr}_${prefix}.csv`);
    if (fs.existsSync(perDay)) return perDay;
    return '';
  }

  const ordersFile = resolveFile('orders');
  const itemsFile = resolveFile('line-items');

  function countRows(file) {
    if (!file || !fs.existsSync(file)) return 0;
    const txt = fs.readFileSync(file, 'utf8').trim();
    if (!txt) return 0;
    const lines = txt.split(/\r?\n/);
    return Math.max(0, lines.length - 1); // exclude header
  }

  const ordersRows = countRows(ordersFile);
  const itemsRows = countRows(itemsFile);

  console.log(`\n— Output check —`);
  console.log(`Orders file    : ${ordersFile || '(missing)'}`);
  console.log(`Orders rows    : ${ordersRows}`);
  console.log(`Line-items file: ${itemsFile || '(missing)'}`);
  console.log(`Line-items rows: ${itemsRows}`);

  if (!ordersFile || ordersRows === 0) {
    console.error('❌ Orders export missing or empty.');
    process.exit(1);
  }
  if (!itemsFile || itemsRows === 0) {
    console.error('❌ Line-items export missing or empty.');
    process.exit(1);
  }

  console.log(`\n✅ Done for ${dateStr} — outputs verified.`);
})();
