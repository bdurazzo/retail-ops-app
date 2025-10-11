import Papa from "papaparse";
import { HttpStaticProvider } from "../../../core/io/HttpStaticProvider";
import { ManifestClient } from "../../../core/paths/ManifestClient";
import { PathResolver } from "../../../core/paths/PathResolver";
import { DATA_SOURCES } from "../../../core/config/dataSources";
import { normalizeOrdersRow } from "../../../core/utils/ordersNormalizer";

const provider = new HttpStaticProvider();
const ACTIVE = DATA_SOURCES.ordersActive === 'retail' ? 'ordersRetail' : 'ordersInStore';
const ACTIVE_CFG = DATA_SOURCES[ACTIVE];
const manifest = new ManifestClient(provider, ACTIVE_CFG.manifestUrl);
const resolver = new PathResolver(ACTIVE_CFG);

async function parseCSV(text) {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (r) => resolve(r.data),
      error: reject,
    });
  });
}

async function loadMonthPublic(yyyy, mm) {
  const urls = resolver.candidates(yyyy, mm);
  console.log(`🔍 Trying to load ${yyyy}-${mm}, candidate URLs:`, urls); // DEBUG LINE
  
  let lastErr;
  for (const url of urls) {
    try {
      console.log(`📁 Attempting to fetch: ${url}`); // DEBUG LINE
      const text = await provider.getText(url);
      const raw = await parseCSV(text);
      const rows = raw.map((r) =>
        normalizeOrdersRow(r, { sourceTz: "America/New_York", normalizeTo: "America/Los_Angeles" })
      );
      console.log(`✅ Successfully loaded ${yyyy}-${mm} from ${url}, got ${rows.length} rows`); // DEBUG LINE
      return { yyyy, mm, url, rows };
    } catch (e) {
      console.log(`❌ Failed to fetch ${url}:`, e.message); // DEBUG LINE
      lastErr = e;
    }
  }
  return { yyyy, mm, url: null, rows: null, error: lastErr };
}

function parseDateToYMDHMS(dateStr){
  if (!dateStr) return null;
  try {
    // Examples: "Dec 1, 2024, 4:54 PM PST"
    const m = dateStr.match(/([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4}),\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    const MONTHS = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
    if (m){
      const mon = String(MONTHS[m[1]]).padStart(2,'0');
      const day = String(+m[2]).padStart(2,'0');
      let hr = +m[4]; const min = m[5]; const ap=m[6].toUpperCase();
      if (ap==='PM' && hr<12) hr+=12; if (ap==='AM' && hr===12) hr=0;
      const hh = String(hr).padStart(2,'0');
      return `${m[3]}-${mon}-${day} ${hh}:${min}:00`;
    }
  } catch {}
  return null;
}

function toNumber(v){
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (v==null) return 0;
  const n = Number(String(v).replace(/[^0-9.\-]/g,''));
  return Number.isFinite(n)? n : 0;
}

async function loadMonthRetail(rec){
  const { yyyy, mm, path: rel } = rec;
  const base = ACTIVE_CFG.baseDir;
  const ordersUrl = `${base}/${rel}/orders.csv`;
  const itemsUrl = `${base}/${rel}/line_items.csv`;
  try{
    const [ordersText, itemsText] = await Promise.all([
      provider.getText(ordersUrl),
      provider.getText(itemsUrl)
    ]);
    const ordersRaw = await parseCSV(ordersText);
    const itemsRaw = await parseCSV(itemsText);
    // Map order_id -> normalized datetime + store/channel fields
    const orderMeta = new Map();
    for (const r of ordersRaw){
      const oid = r.order_id ?? r["order_id"]; if(!oid) continue;
      const dt = parseDateToYMDHMS(r.date_time ?? r["date_time"]);
      orderMeta.set(String(oid), {
        dt: dt || null,
        demand: r.demand_location ?? r["demand_location"] ?? '',
        fulfillment: r.fulfillment_location ?? r["fulfillment_location"] ?? '',
        channel: r.channel ?? r["channel"] ?? '',
        fulfillment_type: r.fulfillment_type ?? r["fulfillment_type"] ?? ''
      });
    }
    const rows = itemsRaw.map((li, index) => {
      // Debug first few rows to see what we're actually getting
      if (index < 3) {
        console.log(`🔍 CSV Row ${index}:`, {
          product_name: li.product_name,
          color: li.color,
          size: li.size,
          upc: li.upc,
          quantity: li.quantity,
          raw_keys: Object.keys(li)
        });
      }
      
      const oid = String(li.order_id ?? '');
      const meta = orderMeta.get(oid) || {};
      const net = (li.discounted_price!=null && li.discounted_price!=='') ? toNumber(li.discounted_price)
                : (toNumber(li.unit_price) - toNumber(li.line_discount));
      return {
        "Product Name": li.product_name ?? '',
        "UPC": li.upc ?? '',
        Color: li.color ?? '',
        Size: li.size ?? '',
        "Quantity Sold": toNumber(li.quantity ?? 1),
        "Product Net": net,
        "Unit Price": toNumber(li.unit_price ?? 0),
        "Line Discount": toNumber(li.line_discount ?? 0),
        "Taxes": toNumber(li.taxes ?? 0),
        order_datetime_normalized: meta.dt || null,
        // keep a few useful source fields
        order_id: oid,
        quantity: toNumber(li.quantity ?? 1),
        sku: li.sku ?? '',
        demand_store: meta.demand || '',
        fulfillment_store: meta.fulfillment || '',
        channel: meta.channel || '',
        fulfillment_type: meta.fulfillment_type || '',
      };
    });
    return { yyyy, mm, url: itemsUrl, rows };
  } catch (e){
    return { yyyy, mm, url: itemsUrl, rows: null, error: e };
  }
}

export const OrdersRepository = {
  async findByMonthRange({ startYYYYMM, endYYYYMM }) {
    const months = await manifest.listMonths();
    console.log(`📊 Available months from manifest:`, months); // DEBUG LINE

    const inRange = months.filter(({ yyyy, mm }) => {
      const k = `${yyyy}-${mm}`;
      return k >= startYYYYMM && k <= endYYYYMM;
    });
    console.log(`📅 Months in range ${startYYYYMM} to ${endYYYYMM}:`, inRange); // DEBUG LINE

    const results = await Promise.all(inRange.map((m) => {
      if (ACTIVE === 'ordersRetail' || (m.path && ACTIVE_CFG.baseDir.includes('/retail/'))){
        return loadMonthRetail(m);
      }
      return loadMonthPublic(m.yyyy, m.mm);
    }));
    const present = results.filter((r) => Array.isArray(r.rows));
    const missing = results.filter((r) => !Array.isArray(r.rows));
    
    console.log(`📈 Results - Present: ${present.length}, Missing: ${missing.length}`); // DEBUG LINE
    console.log(`📋 Missing details:`, missing); // DEBUG LINE
    
    const rows = present.flatMap((r) => r.rows.map((x) => ({ ...x, __yyyy: r.yyyy, __mm: r.mm })));

    return { rows, present, missing };
  },
};
