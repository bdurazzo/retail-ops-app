// step2-collections-title-validate.mjs (Playwright version)
// PURPOSE: Validate collection URLs and capture canonical title using a real browser.
// I/O:
//   --in  scripts/crawlers/imports/collections_map.csv
//   --out scripts/crawlers/exports/collections_titles.csv
// Notes: slow but reliable. Default low concurrency + jitter.

import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { EOL } from "node:os";
import ProgressBar from "cli-progress";
import pQueue from "p-queue";
import { chromium } from "playwright";

const {
  values: {
    in: inPath = "scripts/crawlers/imports/collections_map.csv",
    out: outPath = "scripts/crawlers/exports/collections_titles.csv",
    urlCol: urlColName = "",
    concurrency = "2",
    timeout = "45000",
    ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    headless = "true"
  }
} = parseArgs({
  options: {
    in: { type: "string" },
    out: { type: "string" },
    urlCol: { type: "string" },
    concurrency: { type: "string" },
    timeout: { type: "string" },
    ua: { type: "string" },
    headless: { type: "string" }
  }
});

const CONCURRENCY = Number(concurrency);
const TIMEOUT_MS = Number(timeout);
const HEADLESS = headless !== "false";

const ensureDir = (file) => fs.mkdirSync(path.dirname(file), { recursive: true });
const csvEscape = (s = "") => {
  const str = String(s);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};
const trim1 = (s) => (s || "").replace(/\s+/g, " ").trim();

function isProbablyHeaderCell(s) {
  const lc = (s || "").toLowerCase();
  return ["collection_url", "url", "href"].includes(lc);
}
function splitCsv(line) {
  const out = [];
  let cur = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}
function dedupe(arr) {
  const seen = new Set(), out = [];
  for (const x of arr) if (x && !seen.has(x)) { seen.add(x); out.push(x); }
  return out;
}
function readUrlsFromFile(file, explicitCol = "") {
  if (!fs.existsSync(file)) throw new Error(`Input file not found: ${file}`);
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  const lines = text.split("\n");
  if (!text.includes(",")) {
    const maybeHeader = isProbablyHeaderCell(lines[0]);
    const start = maybeHeader ? 1 : 0;
    return dedupe(lines.slice(start).map(l => trim1(l)));
  }
  const headerCells = splitCsv(lines[0]).map(c => trim1(c.replace(/^"|"$/g, "")));
  let colIdx = -1;
  if (explicitCol) {
    colIdx = headerCells.findIndex(h => h.toLowerCase() === explicitCol.toLowerCase());
  } else {
    const candidates = ["collection_url", "url", "href"];
    for (const key of candidates) {
      const idx = headerCells.findIndex(h => h.toLowerCase() === key);
      if (idx !== -1) { colIdx = idx; break; }
    }
    if (colIdx === -1 && headerCells.length === 1) colIdx = 0;
  }
  const startRow = (colIdx !== -1) ? 1 : 0;
  const urls = [];
  for (let i = startRow; i < lines.length; i++) {
    const cols = splitCsv(lines[i]).map(c => c.replace(/^"|"$/g, ""));
    const u = (colIdx !== -1 ? cols[colIdx] : cols[0]) || "";
    const clean = trim1(u);
    if (clean) urls.push(clean);
  }
  return dedupe(urls);
}

async function extractTitleFromPage(page) {
  // Try main > h1, then any h1, then main > h2, then any h2, then <title>, then og:title
  const h1m = await page.locator("main h1").first();
  if (await h1m.count()) {
    const t = trim1(await h1m.textContent() || "");
    if (t) return { hTag: "H1(main)", titleText: t };
  }
  const h1 = await page.locator("h1").first();
  if (await h1.count()) {
    const t = trim1(await h1.textContent() || "");
    if (t) return { hTag: "H1", titleText: t };
  }
  const h2m = await page.locator("main h2").first();
  if (await h2m.count()) {
    const t = trim1(await h2m.textContent() || "");
    if (t) return { hTag: "H2(main)", titleText: t };
  }
  const h2 = await page.locator("h2").first();
  if (await h2.count()) {
    const t = trim1(await h2.textContent() || "");
    if (t) return { hTag: "H2", titleText: t };
  }
  const titleFallback = trim1(await page.title() || "");
  const ogTitle = trim1(await page.locator('meta[property="og:title"]').first().getAttribute("content") || "");
  return { hTag: "NONE", titleText: "", titleFallback, ogTitle };
}

(async () => {
  console.log("STEP 2 (Playwright): Validate collection titles via browser…");
  console.log(`Input: ${inPath}`);
  console.log(`Output: ${outPath}`);
  console.log(`URL column (optional): ${urlColName || "(auto)"}`);
  console.log(`Concurrency: ${CONCURRENCY}, Timeout: ${TIMEOUT_MS}ms, Headless: ${HEADLESS}`);

  ensureDir(outPath);

  const urls = readUrlsFromFile(inPath, urlColName);
  if (urls.length === 0) {
    console.error(`No URLs found in ${inPath}.`);
    process.exit(1);
  }

  const header = [
    "collection_url","http_status","h_tag","title_text","title_fallback","og_title","status","error"
  ].join(",") + EOL;
  fs.writeFileSync(outPath, header, "utf8");

  const bar = new ProgressBar.SingleBar({
    format: "Validate [{bar}] {percentage}% | {value}/{total} | {eta_formatted} | {currentUrl}",
    hideCursor: true
  }, ProgressBar.Presets.shades_classic);
  bar.start(urls.length, 0, { currentUrl: "" });

  const browser = await chromium.launch({ headless: HEADLESS });
  const ctx = await browser.newContext({
    userAgent: ua,
    locale: "en-US",
    viewport: { width: 1366, height: 900 },
  });

  // Soften bot heuristics
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const queue = new pQueue({ concurrency: CONCURRENCY });
  let ok = 0, warn = 0, fail = 0;

  const jitter = () => new Promise(r => setTimeout(r, 500 + Math.random()*800));

  await Promise.all(urls.map((url) => queue.add(async () => {
    bar.increment(1, { currentUrl: url });
    const row = {
      collection_url: url,
      http_status: "",
      h_tag: "",
      title_text: "",
      title_fallback: "",
      og_title: "",
      status: "",
      error: ""
    };

    const page = await ctx.newPage();
    try {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
      row.http_status = resp ? resp.status() : "";
      // Some pages lazy-render headings. Give them a beat, then wait for any h1/h2 to appear if possible.
      await page.waitForTimeout(400);
      await page.waitForSelector("h1, h2", { timeout: 3000 }).catch(() => {});
      const { hTag, titleText, titleFallback, ogTitle } = await extractTitleFromPage(page);
      row.h_tag = hTag;
      row.title_text = titleText;
      row.title_fallback = titleFallback;
      row.og_title = ogTitle;

      if (titleText) { row.status = "OK"; ok++; }
      else if (row.http_status && row.http_status >= 400) { row.status = "HTTP_ERROR"; row.error = `status=${row.http_status}`; fail++; }
      else { row.status = "NO_TITLE"; warn++; }
    } catch (err) {
      row.status = "FETCH_ERROR";
      row.error = (err && err.message) ? err.message : String(err);
      fail++;
    } finally {
      const line = [
        csvEscape(row.collection_url),
        csvEscape(row.http_status),
        csvEscape(row.h_tag),
        csvEscape(row.title_text),
        csvEscape(row.title_fallback),
        csvEscape(row.og_title),
        csvEscape(row.status),
        csvEscape(row.error)
      ].join(",") + EOL;
      fs.appendFileSync(outPath, line, "utf8");
      await page.close();
      await jitter(); // small delay to avoid hammering
    }
  })));

  bar.stop();
  await ctx.close();
  await browser.close();
  console.log(`Done. OK: ${ok}, NO_TITLE: ${warn}, FAIL: ${fail}`);
  console.log(`Wrote: ${outPath}`);
})();