#!/usr/bin/env node
// STEP 4: Batch-scrape product specifications + Color + Size
// Keeps the previous working pace: one fetch per URL, default concurrency=8.
// Outputs clean JSON arrays for colors/sizes. Strips "Variant sold out..." and
// never includes the literal "Color" label as a value.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { load as cheerioLoad } from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---- CLI args
const args = process.argv.slice(2);
function getFlag(name, def = undefined) {
  const i = args.findIndex(a => a === `--${name}`);
  if (i >= 0 && i < args.length - 1) return args[i + 1];
  const kv = args.find(a => a.startsWith(`--${name}=`));
  if (kv) return kv.split("=").slice(1).join("=");
  return def;
}

const INPUT  = resolve(getFlag("in",  resolve(__dirname, "imports/products_map.csv")));
const OUTPUT = resolve(getFlag("out", resolve(__dirname, "exports/products_specs.csv")));
const URLCOL = getFlag("urlCol", ""); // auto if blank
const CONCURRENCY = Number(getFlag("concurrency", "2"));
const TIMEOUT_MS  = Number(getFlag("timeout", "20000")); // keep prior behavior
const THROTTLE_MS = Number(getFlag("throttle", "600")); // base delay between requests
const JITTER_MS   = Number(getFlag("jitter",   "400")); // add 0..JITTER_MS extra ms

function randJitter(max = JITTER_MS) {
  const m = Number(max) || 0;
  return m > 0 ? Math.floor(Math.random() * (m + 1)) : 0;
}
// ---- CSV helpers
function parseCSV(text) {
  const rows = [];
  let i = 0, field = "", row = [], inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    } else {
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ",") { row.push(field); field = ""; i++; continue; }
      if (c === "\r") { i++; continue; }
      if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
      field += c; i++; continue;
    }
  }
  row.push(field);
  rows.push(row);
  return rows.filter(r => !(r.length === 1 && r[0].trim() === ""));
}
function toCSV(rows) {
  return rows.map(r => r.map(v => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
}

// ---- IO helpers
async function ensureDirFor(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}
function pickUrlColumn(headers, preferred) {
  if (preferred && headers.includes(preferred)) return preferred;
  const candidates = ["product_url", "url", "href", "link"];
  for (const c of candidates) if (headers.includes(c)) return c;
  return headers[0];
}
async function readInputCsv(filePath) {
  if (!existsSync(filePath)) throw new Error(`Input CSV not found: ${filePath}`);
  const text = await readFile(filePath, "utf8");
  const rows = parseCSV(text);
  if (rows.length === 0) throw new Error("Input CSV is empty");
  const headers = rows[0].map(h => h.trim());
  const urlColName = pickUrlColumn(headers, URLCOL);
  const urlIdx = headers.indexOf(urlColName);
  const urls = rows.slice(1).map((r, idx) => ({ idx, url: (r[urlIdx] || '').trim() })).filter(x => x.url);
  return { headers, urlColName, urls };
}

// ---- HTTP fetch with timeout & retries
async function fetchWithTimeout(url, { timeout = TIMEOUT_MS } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "user-agent": "retail-ops-crawler/1.0"
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}
async function fetchRetry(url, tries = 3) {
  let lastErr;
  for (let t = 1; t <= tries; t++) {
    try {
      return await fetchWithTimeout(url, { timeout: TIMEOUT_MS });
    } catch (e) {
      lastErr = e;
      if (t < tries) await delay(250 * t);
    }
  }
  throw lastErr;
}

// ---- Utilities
const SOLD_OUT_RX = /\bvariant\s+sold\s+out\s+or\s+unavailable\b/i;
function cleanVariantText(s) {
  return (s || "")
    .replace(SOLD_OUT_RX, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-widths
    .replace(/\\+/g, "")                   // stray backslashes
    .replace(/^["'\s]+|["'\s]+$/g, "")     // trim quotes/space
    .replace(/\s+/g, " ")
    .trim();
}
function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const v of arr) {
    const k = v.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(v); }
  }
  return out;
}

// ---- Extraction
function extractSpecsAndOptions(html) {
  const $ = cheerioLoad(html);

  // ----- product specifications
  const map = { sku: "", material: "", manufacturing: "", care: "" };
  let spec_source = "NONE";
  const specContainers = [
    $(".product-specifications__list").first(),
    $("[class*='product-specifications'] .product-specifications__list").first(),
    $("section[class*='product-specifications'] .product-specifications__list").first()
  ].filter(c => c && c.length);

  if (specContainers.length) {
    spec_source = ".product-specifications__list";
    specContainers[0].find(".product-specifications__item").each((_, el) => {
      const name = $(el).find(".product-specifications__item-name").text().trim().toLowerCase();
      const val  = $(el).find(".product-specifications__item-value").text().trim();
      if (!name || !val) return;
      if (name.startsWith("sku"))           map.sku = val;
      else if (name.startsWith("material")) map.material = val;
      else if (name.startsWith("manufact")) map.manufacturing = val;
      else if (name.startsWith("care"))     map.care = val;
    });
  } else {
    $(".product-specifications__item").each((_, el) => {
      const name = $(el).find(".product-specifications__item-name").text().trim().toLowerCase();
      const val  = $(el).find(".product-specifications__item-value").text().trim();
      if (!name || !val) return;
      if (name.startsWith("sku"))           map.sku = val;
      else if (name.startsWith("material")) map.material = val;
      else if (name.startsWith("manufact")) map.manufacturing = val;
      else if (name.startsWith("care"))     map.care = val;
    });
    const any = map.sku || map.material || map.manufacturing || map.care;
    spec_source = any ? "loose:.product-specifications__item" : "NONE";
  }

  // ----- features list
  let features = [];
  $("div.product-specifications__title-and-features ul li").each((_, el) => {
    const t = cleanVariantText($(el).text());
    if (t) features.push(t);
  });

  // ----- product description (broadened: capture all <p> under product description section)
  // Look for any section whose id contains 'product_description'
  let description_text = "";
  const descParas = $("[id^='shopify-section-template--'][id*='product_description'] section div div p");
  if (descParas && descParas.length) {
    const parts = [];
    descParas.each((_, el) => {
      const t = cleanVariantText($(el).text());
      if (t) parts.push(t);
    });
    description_text = parts.join("\n\n");
  }

  // ----- breadcrumb trail (as a single comma-separated string)
  let breadcrumbs = [];
  $("div.breadcrumb ul li a").each((_, el) => {
    const t = cleanVariantText($(el).text());
    if (t && t.toLowerCase() !== "home") breadcrumbs.push(t);
  });
  const breadcrumb_path = breadcrumbs.join(", ");

    // ----- color options (values only; never the literal "Color")
    // Priority 1: selected color text shown near the label
    // Priority 2: swatch label <span> text
    // Fallback: the previous, generic extraction from inputs/labels
    let color_values = [];

    // Generalize the template id so we don't hardcode the numeric suffix
    const variantRoot = $("[id^='variant-selects-']").first();

    // 1) Selected color label text (your first selector), but generalized
    if (variantRoot && variantRoot.length) {
        const pLabel = variantRoot.find("> div > div > p.form__label").first();
        const selectedColor = cleanVariantText(pLabel.text()).replace(/^\s*color\s*:?\s*/i, "");
        if (selectedColor) color_values.push(selectedColor);
    }

    // 2) Swatch label <span> (your second selector), generalized
    if (color_values.length === 0 && variantRoot && variantRoot.length) {
        variantRoot
        .find("> div > fieldset.product-form__input--color.product-form__input--pill label span")
        .each((_, el) => {
            const t = cleanVariantText($(el).text()).replace(/^\s*color\s*:?\s*/i, "");
            if (t) color_values.push(t);
        });
    }

    // 3) Original generic fallback (kept as-is)
    if (color_values.length === 0) {
        const colorFs = $("fieldset.product-form__input--color, fieldset[class*='product-form__input--color']").first();
        if (colorFs && colorFs.length) {
        // Prefer input values
        colorFs.find('input[type="radio"],input[type="checkbox"]').each((_, el) => {
            const v = cleanVariantText($(el).attr("value"));
            if (v) color_values.push(v);
        });
        // Fallback to label text if inputs had no values
        if (color_values.length === 0) {
            colorFs.find("label").each((_, el) => {
            const t = cleanVariantText($(el).text());
            if (t && !/^\s*color\s*:?$/i.test(t)) color_values.push(t);
            });
        }
        } else {
        // Very loose fallback: any label that toggles color radios (rarely needed)
        $('fieldset [name*="Color" i]').each((_, el) => {
            const v = cleanVariantText($(el).attr("value"));
            if (v) color_values.push(v);
        });
        }
    }

    color_values = uniq(color_values).filter(v => v && !/^\s*color\s*:?$/i.test(v));
  
  // ----- size options (from radio/select values; exclude "variant sold out...")
  let sizes = [];
  const sizeFs = $("fieldset.product-form__input--size, fieldset[class*='product-form__input--size']").first();
  if (sizeFs && sizeFs.length) {
    sizeFs.find('input[type="radio"],input[type="checkbox"]').each((_, el) => {
      const v = cleanVariantText($(el).attr("value"));
      if (v) sizes.push(v);
    });
    if (sizes.length === 0) {
      // Sometimes only labels exist
      sizeFs.find("label").each((_, el) => {
        const t = cleanVariantText($(el).text());
        if (t) sizes.push(t);
      });
    }
  }
  sizes = uniq(sizes);

  return {
    ...map,
    spec_source,
    color_values_json: JSON.stringify(color_values),
    sizes_json: JSON.stringify(sizes),
    features_json: JSON.stringify(features),
    description_text,
    breadcrumb_path,
  };
}

// ---- Concurrency pool
async function runPool(items, worker, concurrency = 8) {
  const results = new Array(items.length);
  let i = 0, active = 0, done = 0;
  return await new Promise((resolve) => {
    const next = () => {
      while (active < concurrency && i < items.length) {
        const idx = i++;
        active++;
        worker(items[idx], idx)
          .then((res) => { results[idx] = { ok: true, value: res }; })
          .catch((err) => { results[idx] = { ok: false, error: err }; })
          .finally(() => {
            active--; done++;
            renderProgress(done, items.length);
            if (done === items.length) resolve(results);
            else next();
          });
      }
    };
    renderProgress(0, items.length);
    next();
  });
}
function renderProgress(done, total) {
  const width = 40;
  const filled = total ? Math.round((done / total) * width) : 0;
  const bar = "█".repeat(filled) + " ".repeat(Math.max(0, width - filled));
  process.stdout.write(`\rScrape [${bar}] ${total ? Math.floor((done/total)*100) : 0}% | ${done}/${total}`);
  if (done === total) process.stdout.write("\n");
}

// ---- Main
(async () => {
  console.log("STEP 4: Batch scrape product specs + color/size …");
  console.log(`Input: ${INPUT}`);
  console.log(`Output: ${OUTPUT}`);
  console.log(`Concurrency: ${CONCURRENCY}, Timeout: ${TIMEOUT_MS}ms`);

  const { urls } = await readInputCsv(INPUT);
  if (!urls.length) {
    console.log("No URLs found in input. Exiting.");
    return;
  }

  const rows = [[
    "row_index","product_url",
    "sku","material","manufacturing","care","spec_source",
    "color_values_json","sizes_json","features_json","description_text","breadcrumb_path",
    "status","error_message"
  ]];

  const results = await runPool(urls, async ({ url, idx }) => {
    try {
      await delay(THROTTLE_MS + randJitter(JITTER_MS));
      const html = await fetchRetry(url);
      const data = extractSpecsAndOptions(html);
      const { sku, material, manufacturing, care, spec_source, color_values_json, sizes_json, features_json, description_text, breadcrumb_path } = data;
      const hasAny =
        sku || material || manufacturing || care ||
        (JSON.parse(color_values_json).length > 0) ||
        (JSON.parse(sizes_json).length > 0) ||
        (JSON.parse(features_json).length > 0) ||
        !!description_text ||
        !!breadcrumb_path;

      return {
        idx, url,
        sku, material, manufacturing, care, spec_source,
        color_values_json, sizes_json, features_json, description_text, breadcrumb_path,
        status: hasAny ? "OK" : "NO_DATA",
        error_message: ""
      };
    } catch (e) {
      return {
        idx, url,
        sku: "", material: "", manufacturing: "", care: "", spec_source: "FETCH",
        color_values_json: "[]", sizes_json: "[]", features_json: "[]", description_text: "",
        breadcrumb_path: "",
        status: "FAIL",
        error_message: String(e?.message || e)
      };
    }
  }, CONCURRENCY);

  for (const r of results) {
    if (r && r.value) {
      const v = r.value;
      rows.push([
        v.idx, v.url,
        v.sku, v.material, v.manufacturing, v.care, v.spec_source,
        v.color_values_json, v.sizes_json, v.features_json, v.description_text, v.breadcrumb_path,
        v.status, v.error_message
      ]);
    } else if (r && r.ok === false) {
      rows.push(["", "", "", "", "", "", "WORKER", "[]", "[]", "[]", "", "", "FAIL", String(r.error)]);
    } else {
      rows.push(["", "", "", "", "", "", "UNKNOWN", "[]", "[]", "[]", "", "", "FAIL", "Unknown error"]);
    }
  }

  await ensureDirFor(OUTPUT);
  await writeFile(OUTPUT, toCSV(rows), "utf8");
  console.log(`Wrote: ${OUTPUT}`);
})();