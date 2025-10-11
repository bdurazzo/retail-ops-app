// step3-products-from-sitemap.mjs
// PURPOSE: Discover ALL product URLs by walking sitemap.xml -> product sitemaps.
// OUTPUT: scripts/crawlers/exports/products_map.csv  (column: product_url)

import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";
import ProgressBar from "cli-progress";
import PQueue from "p-queue";
import { parseArgs } from "node:util";
import { EOL } from "node:os";

const {
  values: {
    root = "https://www.filson.com/sitemap.xml",
    out = "scripts/crawlers/exports/products_map.csv",
    concurrency = "8",
    timeout = "20000",
    ua = "Mozilla/5.0 (compatible; ProductsFromSitemap/1.0)"
  }
} = parseArgs({
  options: {
    root: { type: "string" },
    out: { type: "string" },
    concurrency: { type: "string" },
    timeout: { type: "string" },
    ua: { type: "string" },
  }
});

const CONCURRENCY = Number(concurrency);
const TIMEOUT_MS = Number(timeout);

const ensureDir = (file) => fs.mkdirSync(path.dirname(file), { recursive: true });
const csvEscape = (s="") => /[",\n]/.test(s) ? `"${String(s).replace(/"/g,'""')}"` : String(s);

async function get(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": ua, "accept": "application/xml,text/xml,*/*" },
      signal: ctl.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function parseXml(xml) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@",
    trimValues: true
  });
  return parser.parse(xml);
}

function collectLocsFromIndex(obj) {
  // Expect <sitemapindex><sitemap><loc>...</loc></sitemap>...
  const out = [];
  const index = obj?.sitemapindex?.sitemap;
  if (!index) return out;
  const items = Array.isArray(index) ? index : [index];
  for (const it of items) {
    if (it?.loc) out.push(it.loc);
    else if (it?.loc?.["#text"]) out.push(it.loc["#text"]);
  }
  return out;
}

function collectUrlsFromUrlset(obj) {
  // Expect <urlset><url><loc>...</loc></url>...
  const out = [];
  const urlset = obj?.urlset?.url;
  if (!urlset) return out;
  const items = Array.isArray(urlset) ? urlset : [urlset];
  for (const it of items) {
    if (it?.loc) out.push(it.loc);
    else if (it?.loc?.["#text"]) out.push(it.loc["#text"]);
  }
  return out;
}

function onlyProductUrls(urls) {
  // Keep canonical product pages only
  return urls
    .filter(u => typeof u === "string" && /\/products\//i.test(u))
    .map(u => u.split("?")[0])                 // drop querystring
    .map(u => u.replace(/\/+$/, ""));          // drop trailing slash
}

(async () => {
  console.log("STEP 3: Discover ALL product URLs from sitemap…");
  console.log(`Root sitemap: ${root}`);
  console.log(`Output: ${out}`);
  console.log(`Concurrency: ${CONCURRENCY}, Timeout: ${TIMEOUT_MS}ms`);

  ensureDir(out);

  // 1) Load top-level sitemap.xml
  let indexXml;
  try {
    indexXml = await get(root);
  } catch (e) {
    console.error(`Failed to fetch root sitemap: ${e.message}`);
    process.exit(1);
  }
  const indexObj = parseXml(indexXml);

  // 2) Find product sitemaps within the index
  const allSitemaps = collectLocsFromIndex(indexObj);
  const productSitemaps = allSitemaps.filter(loc =>
    /product/i.test(loc) || /sitemap_products_/i.test(loc)
  );

  if (productSitemaps.length === 0) {
    // Some shops list URLs directly in root (rare); handle that too
    const directUrls = onlyProductUrls(collectUrlsFromUrlset(indexObj));
    if (directUrls.length === 0) {
      console.error("No product sitemaps or product URLs found in the root sitemap.");
      process.exit(1);
    }
    const unique = [...new Set(directUrls)];
    fs.writeFileSync(out, `product_url${EOL}`, "utf8");
    for (const u of unique) fs.appendFileSync(out, `${csvEscape(u)}${EOL}`, "utf8");
    console.log(`Wrote ${unique.length} product URLs to ${out}`);
    return;
  }

  // 3) Walk each product sitemap and gather URLs
  const bar = new ProgressBar.SingleBar({
    format: "Fetch product sitemaps [{bar}] {percentage}% | {value}/{total} | {eta_formatted}",
    hideCursor: true
  }, ProgressBar.Presets.shades_classic);
  bar.start(productSitemaps.length, 0);

  const q = new PQueue({ concurrency: CONCURRENCY });
  const productUrlSet = new Set();

  await Promise.all(productSitemaps.map(loc => q.add(async () => {
    bar.increment();
    try {
      const xml = await get(loc);
      const obj = parseXml(xml);
      const urls = collectUrlsFromUrlset(obj);
      for (const u of onlyProductUrls(urls)) productUrlSet.add(u);
    } catch (e) {
      console.warn(`WARN: failed ${loc}: ${e.message}`);
    }
  })));

  bar.stop();

  const allProducts = [...productUrlSet];
  allProducts.sort();

  fs.writeFileSync(out, `product_url${EOL}`, "utf8");
  for (const u of allProducts) fs.appendFileSync(out, `${csvEscape(u)}${EOL}`, "utf8");

  console.log(`Done. Found ${allProducts.length} product URLs.`);
  console.log(`Wrote: ${out}`);
})();