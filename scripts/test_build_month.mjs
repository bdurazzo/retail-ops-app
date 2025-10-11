import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Usage: EXPORTS_DIR=orders_exports_TEST node scripts/test_build_month.mjs 2025-08
const EXPORTS_DIR = process.env.EXPORTS_DIR || 'orders_exports_TEST';
const ym = process.argv[2];
if (!ym || !/^\d{4}-\d{2}$/.test(ym)) {
  console.error('Usage: node scripts/test_build_month.mjs YYYY-MM');
  process.exit(1);
}

const [year, month] = ym.split('-');
const monthDir = path.join(EXPORTS_DIR, year, `${year}-${month}`);
if (!fs.existsSync(monthDir)) {
  console.error(`Month dir not found: ${monthDir}`);
  process.exit(1);
}

function listOrderDays(dir){
  const files = fs.readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}_orders\.csv$/.test(f));
  return files.map(f => f.slice(0, 10)).sort();
}

function run(cmd, args){
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env: process.env });
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`)));
  });
}

(async () => {
  const days = listOrderDays(monthDir);
  console.log(`Found ${days.length} day(s) in ${monthDir}`);
  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    console.log(`\n=== Building ${d} (${i+1}/${days.length}) ===`);
    await run('node', ['scripts/test_orders_export.mjs', d]);
    await run('node', ['scripts/test_line_items_export.mjs', d]);
  }
  console.log('\nAll done.');
})();

