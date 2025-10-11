// Read-only architecture printout for the analytics pipeline
// No writes. No imports from app aliases. Pure fs + path.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");

const files = [
  // Registry & KPIs
  "src/features/analytics/registry/kpiRegistry.js",
  "src/features/analytics/registry/kpis/top_performers.js",
  "src/features/analytics/registry/tableDataRegistry.js",

  // Loader registry + orders loader
  "src/features/analytics/data/loaders/loaderRegistry.js",
  "src/features/analytics/data/loaders/orders/loadRows.js",

  // Time utils
  "src/features/analytics/utilities/time/index.js",
  "src/features/analytics/utilities/time/timeParse.js",
  "src/features/analytics/utilities/time/timeGrain.js",

  // Bridge + consumer
  "src/features/analytics/analyticsBridge.js",
  "src/features/storeDashboard/components/VisualStoreTrends.jsx"
];

function short(p) {
  return p.length > 80 ? p.slice(0, 80) + " …" : p;
}

function printSection(title) {
  console.log("\n" + "═".repeat(80));
  console.log("■ " + title);
  console.log("═".repeat(80));
}

function printFileHeader(fp) {
  const rel = path.relative(root, fp);
  console.log(`\n— ${rel}`);
}

function sniffExports(src) {
  const out = [];
  const re = /export\s+(?:default\s+([A-Za-z0-9_$]+)|\{([^}]+)\}|function\s+([A-Za-z0-9_$]+)|const\s+([A-Za-z0-9_$]+)\s*=)/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[1]) out.push(`default:${m[1]}`);
    else if (m[2]) out.push(...m[2].split(",").map(s => s.trim()));
    else if (m[3]) out.push(m[3]);
    else if (m[4]) out.push(m[4]);
  }
  return [...new Set(out)].filter(Boolean);
}

function showHeadTail(src, lines = 12) {
  const arr = src.split("\n");
  const head = arr.slice(0, lines).join("\n");
  const tail = arr.slice(-lines).join("\n");
  return { head, tail, lineCount: arr.length };
}

async function main() {
  printSection("Analytics Pipeline Architecture (read-only)");

  for (const rel of files) {
    const fp = path.join(root, rel);
    printFileHeader(fp);

    if (!fs.existsSync(fp)) {
      console.log("  ✗ missing");
      continue;
    }

    const src = fs.readFileSync(fp, "utf8");
    const { head, tail, lineCount } = showHeadTail(src, 14);
    const exportsList = sniffExports(src);

    console.log(`  ✓ exists | ${lineCount} lines`);
    if (exportsList.length) console.log(`  exports: ${exportsList.map(short).join(", ")}`);
    console.log("  --- head ---");
    console.log(head);
    console.log("  --- tail ---");
    console.log(tail);
  }

  printSection("Quick Assertions");
  try {
    // Soft regex checks (no alias imports)
    const kpi = fs.readFileSync(path.join(root, "src/features/analytics/registry/kpis/top_performers.js"), "utf8");
    console.log("• top_performers.js: has dataset:\"orders\" →", /dataset\s*:\s*["']orders["']/.test(kpi) ? "YES" : "NO");

    const tbl = fs.readFileSync(path.join(root, "src/features/analytics/registry/tableDataRegistry.js"), "utf8");
    console.log("• tableDataRegistry.js: uses getKPI() →", /getKPI\(/.test(tbl) ? "YES" : "NO");
    console.log("• tableDataRegistry.js: uses getLoader()/DATASET →", /getLoader\s*\(|DATASET\./.test(tbl) ? "YES" : "NO");

    const loadReg = fs.readFileSync(path.join(root, "src/features/analytics/data/loaders/loaderRegistry.js"), "utf8");
    console.log("• loaderRegistry.js: exports getLoader & DATASET →", /export\s+(?:\{[^}]*getLoader[^}]*,|const\s+DATASET|export\s+const\s+DATASET)/.test(loadReg) ? "YES" : "NO");
  } catch {
    console.log("• quick assertions skipped (file missing)");
  }

  console.log("\nDone. No files were modified.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});