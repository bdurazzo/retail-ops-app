

// scripts/smoke/validate_orders_in_store_month.mjs
// Purpose: Verify the registry's orders_in_store dataset points to a CSV
// whose rows are all within the target month (YYYY-MM) and that it contains
// the required headers defined in the matching JSON schema.
//
// Run with: npm run smoke:orders:in-store:july
//
// Prereq (once): npm i -D csv-parse

import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

const REPO_ROOT = process.cwd(); // assume the script runs from repo root
const REGISTRY_PATH = path.join(REPO_ROOT, 'data/registry/index.json');
const SCHEMA_PATH = path.join(REPO_ROOT, 'data/schemas/orders_in_store.schema.v1.json');

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

try {
  // 1) Load registry and dataset entry
  const registryRaw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(registryRaw);
  const ds = registry?.datasets?.orders_in_store;
  if (!ds?.path) {
    fail('orders_in_store path missing in registry.');
    process.exit(1);
  }

  // 2) Resolve CSV absolute path
  const csvPath = path.join(REPO_ROOT, ds.path);
  if (!fs.existsSync(csvPath)) {
    fail(`CSV not found at ${csvPath}`);
    process.exit(1);
  }

  // 3) Load schema & required columns
  const schemaRaw = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const schema = JSON.parse(schemaRaw);
  const requiredCols = schema.required || [];
  ok(`Loaded schema with ${requiredCols.length} required columns.`);

  // 4) Read & parse CSV
  const csvBuf = fs.readFileSync(csvPath);
  const records = parse(csvBuf, {
    columns: true,
    skip_empty_lines: true
  });

  if (records.length === 0) {
    fail('CSV has zero data rows.');
  } else {
    ok(`Parsed ${records.length} rows from ${ds.path}`);
  }

  // 5) Validate headers contain required columns
  const headers = Object.keys(records[0]);
  const missing = requiredCols.filter((c) => !headers.includes(c));
  if (missing.length) {
    fail(`Missing required columns: ${missing.join(', ')}`);
  } else {
    ok('All required columns present.');
  }

  // 6) Validate month window (YYYY-MM at start of "Order Date/Time")
  const period = ds.period || '2025-07';
  const periodRe = new RegExp(`^\\s*${period}-\\d{2}\\b`);
  let badDateCount = 0;

  for (const row of records) {
    const v = (row['Order Date/Time'] || '').toString();
    if (!periodRe.test(v)) {
      badDateCount++;
      if (badDateCount <= 5) {
        console.error(`   • Off-period row (example): "${v}"`);
      }
    }
  }

  if (badDateCount > 0) {
    fail(`Found ${badDateCount} rows outside ${period}.`);
  } else {
    ok(`All rows fall within ${period}.`);
  }

  // 7) Done
  if (process.exitCode !== 1) {
    ok('Smoke check passed.');
  }
} catch (err) {
  fail(`Unhandled error: ${err.message}`);
  process.exit(1);
}