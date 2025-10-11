// scripts/crawlers/step1-collections-map.mjs
// STEP 1: Discover all collection URLs, then extract clean titles from each.
// Output: scripts/crawlers/imports/collections_map.csv
// Strategy (fail-soft):
//   A) Try robots/sitemap traversal
//   B) If zero found, try public Shopify JSON endpoint /collections.json (paged)
//   C) If still zero, brute-scan a few likely hub pages for <a href*="/collections/...">
//
// Notes:
// - No "level" inference here — just URL + best-effort titles.
// - Titles pulled from: <h1>, <meta og:title>, <h2> fallbacks, <title>, and canonical URL.
// - Adds a real UA + accepts gzip, handles redirects, normalizes URLs (strip query/hash/trailing slash).
// - Emits progress and a final summary so you can see it "doing something".

import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';

// ---------------------------- Config -----------------------------------
const ORIGIN = 'https://www.filson.com';
const OUT_DIR = 'scripts/crawlers/imports';
const OUT_FILE = path.join(OUT_DIR, 'collections_map.csv');

// ---------------------------- XML Parser --------------------------------
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
});

// ---------------------------- Tiny Utils --------------------------------
function log(msg = '') { console.log(msg); }

function decodeEntities(str = '') {
  return str
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)));
}

function stripBrandSuffix(s = '') {
  return s.replace(/\s*[|–-]\s*Filson\s*$/i, '').trim();
}

function csvEscape(val) {
  if (val == null) return '';
  const s = String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCSVHeader(stream, headers) {
  stream.write(headers.map(csvEscape).join(',') + '\n');
}

function writeCSVRow(stream, rowObj, headers) {
  const row = headers.map(h => csvEscape(rowObj[h] ?? ''));
  stream.write(row.join(',') + '\n');
}

function normalizeURL(href = '') {
  if (!href) return '';
  try {
    const u = new URL(href, ORIGIN);
    if (!/^https?:/i.test(u.protocol)) return '';
    // only collections
    if (!/\/collections\//i.test(u.pathname)) return '';
    // strip query/hash and trailing slash
    u.hash = '';
    u.search = '';
    let s = u.toString();
    s = s.replace(/\/+$/,'');
    return s;
  } catch {
    return '';
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const FETCH_OPTS = {
  redirect: 'follow',
  headers: {
    // friendly UA prevents some CDNs from blocking
    'user-agent': 'retail-ops-app/1.0 (+crawler step1 collections-map; mailto:ops@example.com)',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9, */*;q=0.8',
    'accept-encoding': 'gzip, br',
    'accept-language': 'en-US,en;q=0.9',
  },
};

async function getText(url) {
  const res = await fetch(url, FETCH_OPTS);
  if (!res.ok) throw new Error(`Fetch ${url} -> ${res.status}`);
  return await res.text();
}

async function getJSON(url) {
  const res = await fetch(url, FETCH_OPTS);
  if (!res.ok) throw new Error(`Fetch ${url} -> ${res.status}`);
  return await res.json();
}

// ----------------------- A) robots/sitemap traversal --------------------
async function getRobotsSitemaps() {
  const robotsUrl = `${ORIGIN}/robots.txt`;
  let maps = [];
  try {
    const txt = await getText(robotsUrl);
    const lines = txt.split(/\r?\n/);
    maps = lines
      .map(l => l.trim())
      .filter(l => /^sitemap:/i.test(l))
      .map(l => l.split(/:\s*/i).slice(1).join(':').trim());
  } catch {}
  if (!maps.length) maps = [`${ORIGIN}/sitemap.xml`];

  const candidates = [
    `${ORIGIN}/sitemap-collections.xml`,
    `${ORIGIN}/sitemap_collections.xml`,
    `${ORIGIN}/sitemap-collections1.xml`,
    `${ORIGIN}/sitemap-collections-1.xml`,
    `${ORIGIN}/sitemap_collections_1.xml`,
  ];
  const verified = [];
  for (const url of candidates) {
    try {
      const r = await fetch(url, { ...FETCH_OPTS, method: 'HEAD' });
      if (r.ok) verified.push(url);
    } catch {}
  }
  return Array.from(new Set([...maps, ...verified]));
}

async function collectAllSitemapURLs(entryUrl, seen = new Set()) {
  const urls = [];
  const stack = [entryUrl];
  while (stack.length) {
    const url = stack.pop();
    if (seen.has(url)) continue;
    seen.add(url);
    let xml; try { xml = await getText(url); } catch { continue; }
    let doc; try { doc = parser.parse(xml); } catch {}

    const idx = doc?.sitemapindex?.sitemap;
    const set = doc?.urlset?.url;
    if (Array.isArray(idx)) {
      for (const sm of idx) { const loc = sm?.loc?.trim(); if (loc) stack.push(loc); }
    } else if (Array.isArray(set)) {
      for (const u of set) { const loc = u?.loc?.trim(); if (loc) urls.push(loc); }
    } else {
      const locs = xml.match(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)?.map(m => m.replace(/<\/?loc>/gi, '').trim()) || [];
      urls.push(...locs);
    }
  }
  return urls;
}

// -------------------- B) public JSON collections API --------------------
async function probeCollectionsJSON() {
  const results = new Map(); // handle -> {url,title}
  for (let page = 1; page <= 30; page++) {
    const url = `${ORIGIN}/collections.json?limit=250&page=${page}`;
    try {
      const data = await getJSON(url);
      const list = data?.collections || data?.smart_collections || data?.custom_collections || [];
      if (!Array.isArray(list) || !list.length) break;
      for (const c of list) {
        const handle = c?.handle || c?.id || '';
        if (!handle) continue;
        const title = stripBrandSuffix((c?.title || '').trim());
        const abs = normalizeURL(`${ORIGIN}/collections/${handle}`);
        if (abs) results.set(String(handle), { url: abs, title });
      }
      await sleep(100); // be polite
    } catch {
      break; // endpoint not available
    }
  }
  return Array.from(results.values());
}

// --------- C) fallback: scan a few hub pages for collection links -------
async function scrapeLikelyHubs() {
  const hubs = [
    `${ORIGIN}/`,
    `${ORIGIN}/collections`,
    `${ORIGIN}/collections/all`,
    `${ORIGIN}/collections/mens`,
    `${ORIGIN}/collections/womens`,
  ];
  const set = new Set();
  for (const h of hubs) {
    try {
      const html = await getText(h);
      // Any anchor/button/link that points at /collections/...
      const rx = /<(?:a|button)\b[^>]+(?:href|data-href)\s*=\s*(["'])((?:https?:\/\/[^"'#]+)?\/collections\/[^"'#?\s]+)\1/gi;
      let m; while ((m = rx.exec(html))) {
        const abs = normalizeURL(m[2]);
        if (!abs) continue;
        if (/\/collections\/(tags|vendors|types)\b/i.test(abs)) continue;
        set.add(abs);
      }
    } catch {}
  }
  return Array.from(set);
}

// --------------------- collection page field extract --------------------
function extractPageFields(html, url) {
  const pickText = (regex) => {
    const m = html.match(regex);
    if (!m) return '';
    const inner = m[1] || '';
    return stripBrandSuffix(decodeEntities(inner.replace(/<[^>]+>/g, '').trim()));
  };

  // Strict H1
  const h1 = pickText(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);

  // og:title
  let ogTitle = '';
  const ogMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]*>/i);
  if (ogMatch) {
    const c = ogMatch[0].match(/\bcontent=(["'])([\s\S]*?)\1/i);
    if (c) ogTitle = stripBrandSuffix(decodeEntities(c[2].trim()));
  }

  // Optional H2 fallbacks (some collection layouts use H2)
  const h2Collection = pickText(/<h2\b[^>]*class=["'][^"']*collection[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i)
                     || pickText(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);

  // <title>
  const metaTitle = pickText(/<title[^>]*>([\s\S]*?)<\/title>/i);

  // Canonical
  let canonical = '';
  const canonMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (canonMatch) {
    const href = canonMatch[0].match(/\bhref=(["'])([\s\S]*?)\1/i)?.[2]?.trim();
    if (href) canonical = normalizeURL(href);
  }

  // Choose title preference: h1 > og:title > h2 fallback > <title>
  const title = h1 || ogTitle || h2Collection || metaTitle || '';

  // Handle
  const handle = (() => {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex(p => p.toLowerCase() === 'collections');
      return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : '';
    } catch { return ''; }
  })();

  return { title, h1, h2: h2Collection, og_title: ogTitle, meta_title: metaTitle, canonical, handle };
}

// -------------------------------- main ----------------------------------
(async () => {
  try {
    log('STEP 1: Discover collection URLs…');

    const discovered = {
      sitemap: new Set(),
      json: new Set(),
      hubs: new Set(),
    };

    // A) robots/sitemaps
    try {
      const roots = await getRobotsSitemaps();
      const seen = new Set();
      for (const root of roots) {
        const urls = await collectAllSitemapURLs(root, seen);
        for (const raw of urls) {
          const abs = normalizeURL(raw);
          if (abs && !/\/(tags|vendors|types)\b/i.test(abs)) discovered.sitemap.add(abs);
        }
      }
    } catch {}

    // B) collections.json
    try {
      const viaJson = await probeCollectionsJSON();
      for (const c of viaJson) discovered.json.add(c.url);
      if (viaJson.length) log(`Found via /collections.json: ${viaJson.length}`);
    } catch {}

    // C) hub-page scrape
    try {
      const viaHubs = await scrapeLikelyHubs();
      for (const u of viaHubs) discovered.hubs.add(u);
      if (viaHubs.length) log(`Found via hub pages: ${viaHubs.length}`);
    } catch {}

    // Merge and sort
    const collectionURLs = Array.from(new Set([
      ...discovered.sitemap,
      ...discovered.json,
      ...discovered.hubs,
    ])).sort((a, b) => a.localeCompare(b));

    if (!collectionURLs.length) {
      log('No collections discovered. Exiting.');
      process.exit(0);
    }

    log(`Total unique collections: ${collectionURLs.length}`);
    log('Fetching pages and extracting titles…');

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const headers = ['collection_url', 'handle', 'title', 'h1', 'h2', 'og_title', 'meta_title', 'canonical', 'source_hint'];
    const out = fs.createWriteStream(OUT_FILE, 'utf8');
    writeCSVHeader(out, headers);

    let done = 0; const total = collectionURLs.length;
    const bar = () => {
      const pct = Math.floor((done / total) * 100);
      process.stdout.write(`\rProcessing: ${done}/${total} (${pct}%)`);
    };

    // Map for quick source hint
    const sourceByURL = new Map();
    for (const u of discovered.sitemap) sourceByURL.set(u, 'sitemap');
    for (const u of discovered.json) if (!sourceByURL.has(u)) sourceByURL.set(u, 'json');
    for (const u of discovered.hubs) if (!sourceByURL.has(u)) sourceByURL.set(u, 'hub');

    for (const url of collectionURLs) {
      let html = '';
      try {
        html = await getText(url);
      } catch {
        done++; bar();
        writeCSVRow(out, { collection_url: url, source_hint: sourceByURL.get(url) || '' }, headers);
        continue;
      }
      const fields = extractPageFields(html, url);
      writeCSVRow(out, { collection_url: url, ...fields, source_hint: sourceByURL.get(url) || '' }, headers);
      done++; bar();
      await sleep(50); // keep it polite
    }

    out.end();
    process.stdout.write('\n');
    log(`Done. Wrote ${collectionURLs.length} rows -> ${OUT_FILE}`);

    // Summary
    log('--- Summary ---');
    log(`Sitemap: ${discovered.sitemap.size}`);
    log(`JSON   : ${discovered.json.size}`);
    log(`Hubs   : ${discovered.hubs.size}`);
    log(`Output : ${OUT_FILE}`);
  } catch (err) {
    console.error('Fatal:', err?.message || err);
    process.exit(1);
  }
})();