#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// Config
const PUBLIC_ROOT = 'public/data/newstore/orders';
const SCRAPER_ROOT = 'orders_exports';
const OUT_ROOT = 'reports/validation';
const START_MONTH = process.env.START_MONTH || '2023-11'; // YYYY-MM
const END_MONTH = process.env.END_MONTH || '2025-07';     // YYYY-MM
// Optional: filter public rows by fulfillment or demand location to match store perspective
const PUBLIC_FILTER_FULFILLMENT = process.env.PUBLIC_FILTER_FULFILLMENT || '';
const PUBLIC_FILTER_DEMAND = process.env.PUBLIC_FILTER_DEMAND || '';
// Optional: attribution perspective (for deltas)
const SCRAPER_PERSPECTIVE_FULFILLMENT = process.env.SCRAPER_PERSPECTIVE_FULFILLMENT || '';
const SCRAPER_PERSPECTIVE_DEMAND = process.env.SCRAPER_PERSPECTIVE_DEMAND || '';

function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function log(msg){ const ts=new Date().toISOString(); console.log(`ℹ️ [${ts}] ${msg}`);} 

// Minimal CSV parser that handles quotes and commas
function parseCSV(text){
  const rows=[]; let i=0, field='', row=[], inQuotes=false;
  while(i<text.length){
    const c=text[i];
    if(inQuotes){
      if(c==='"'){
        if(text[i+1]==='"'){ field+='"'; i+=2; continue; }
        inQuotes=false; i++; continue;
      } else { field+=c; i++; continue; }
    } else {
      if(c==='"'){ inQuotes=true; i++; continue; }
      if(c===','){ row.push(field); field=''; i++; continue; }
      if(c==='\n'){ row.push(field); rows.push(row); row=[]; field=''; i++; continue; }
      if(c==='\r'){ i++; continue; }
      field+=c; i++; continue;
    }
  }
  // push last field/row
  row.push(field); if(row.length>1 || row[0]!=='' ) rows.push(row);
  return rows;
}

function readCSVFile(file){
  const txt = fs.readFileSync(file,'utf8');
  const rows = parseCSV(txt);
  if(!rows.length) return { headers: [], rows: [] };
  const headers = rows[0].map(h => (h||'').trim());
  const body = rows.slice(1);
  return { headers, rows: body };
}

function moneyToNumber(s){
  if (s == null) return 0;
  const v = String(s).replace(/[^0-9.\-]/g, '');
  if (v === '' || v === '.' || v === '-') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function headerMap(headers){
  const idx={};
  const norm = s => s.toLowerCase().replace(/\s+/g,' ').trim();
  headers.forEach((h,i)=>{ idx[norm(h)] = i; });
  const pick = (...names) => {
    for(const n of names){
      const key = norm(n);
      if (idx[key] != null) return idx[key];
      // try contains
      for(const k of Object.keys(idx)) if (k === key) return idx[k];
    }
    // try fuzzy: header contains token
    for(const k of Object.keys(idx)){
      for(const n of names){
        const nk = norm(n);
        if (k.includes(nk)) return idx[k];
      }
    }
    return -1;
  };
  return { idx, pick };
}

function normStr(s){ return (s==null? '': String(s)).replace(/\s+/g,' ').trim(); }

function monthIter(start, end){
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  const out=[]; let y=sy, m=sm;
  while (y<ey || (y===ey && m<=em)){
    out.push(`${y}-${String(m).padStart(2,'0')}`);
    m++; if(m>12){ m=1; y++; }
  }
  return out;
}

function readPublicMonth(month){
  const [y,m]=month.split('-');
  const file = path.join(PUBLIC_ROOT, y, `${y}-${m}`, `${y}-${m}_orders_in_store.csv`);
  if(!fs.existsSync(file)) return { orders: new Set(), itemsByOrder: new Map(), missing: true };
  const { headers, rows } = readCSVFile(file);
  const { pick } = headerMap(headers);
  const iId = pick('order_id','order id','id');
  const iProd = pick('product_name','product','title','name');
  const iColor = pick('color');
  const iSize = pick('size');
  const iFulfill = pick('fulfillment location','fulfilment location','fulfillment');
  const iDemand = pick('demand location','demand');
  // Try to get a line-level revenue column (prefer discounted price)
  const iDisc = pick('disc. price','discounted_price','discounted price','disc price');
  const iPrice = pick('price');
  if (iId === -1) throw new Error(`Public CSV missing order_id column: ${file}`);
  const orders=new Set();
  const map=new Map();
  let revenue = 0;
  let processed = 0;
  // Same-store vs cross-store (public side)
  let sameStoreItems = 0, crossStoreItems = 0;
  const orderHasCross = new Map(); // oid -> boolean
  // Perspective attribution (counts how public aligns with a store's view)
  let itemsMatchFulfill = 0, itemsMatchDemand = 0;
  const ordersMatchFulfill = new Set();
  const ordersMatchDemand = new Set();
  for(const r of rows){
    // Optional public-side filters
    if (PUBLIC_FILTER_FULFILLMENT && iFulfill !== -1){
      const v = normStr(r[iFulfill]);
      if (v !== PUBLIC_FILTER_FULFILLMENT) continue;
    }
    if (PUBLIC_FILTER_DEMAND && iDemand !== -1){
      const v = normStr(r[iDemand]);
      if (v !== PUBLIC_FILTER_DEMAND) continue;
    }
    const oid = normStr(r[iId]); if(!oid) continue; orders.add(oid);
    const prod = iProd===-1? '': normStr(r[iProd]);
    const color = iColor===-1? '': normStr(r[iColor]);
    const size = iSize===-1? '': normStr(r[iSize]);
    const key = `${prod}|${color}|${size}`;
    const mm = map.get(oid) || new Map();
    mm.set(key, (mm.get(key)||0)+1);
    map.set(oid, mm);
    // Sum revenue: prefer discounted price, else price
    const val = iDisc !== -1 ? r[iDisc] : (iPrice !== -1 ? r[iPrice] : '0');
    revenue += moneyToNumber(val);
    processed++;
    // Same-store vs cross-store (item-level)
    if (iFulfill !== -1 && iDemand !== -1){
      const f = normStr(r[iFulfill]);
      const d = normStr(r[iDemand]);
      if (f && d){
        if (f === d) sameStoreItems++; else { crossStoreItems++; orderHasCross.set(oid, true); }
      }
    }
    // Attribution vs perspective
    if (SCRAPER_PERSPECTIVE_FULFILLMENT && iFulfill !== -1){
      const f = normStr(r[iFulfill]);
      if (f === SCRAPER_PERSPECTIVE_FULFILLMENT){ itemsMatchFulfill++; ordersMatchFulfill.add(oid); }
    }
    if (SCRAPER_PERSPECTIVE_DEMAND && iDemand !== -1){
      const d = normStr(r[iDemand]);
      if (d === SCRAPER_PERSPECTIVE_DEMAND){ itemsMatchDemand++; ordersMatchDemand.add(oid); }
    }
  }
  // Derive same/cross orders
  let crossStoreOrders = 0;
  for (const oid of orders){ if (orderHasCross.get(oid)) crossStoreOrders++; }
  const sameStoreOrders = Math.max(0, orders.size - crossStoreOrders);
  return {
    orders,
    itemsByOrder: map,
    missing: false,
    rowsCount: processed,
    revenue,
    sameStoreItems,
    crossStoreItems,
    sameStoreOrders,
    crossStoreOrders,
    // perspective attribution (public side only)
    itemsMatchFulfill,
    itemsMatchDemand,
    ordersMatchFulfillCount: ordersMatchFulfill.size,
    ordersMatchDemandCount: ordersMatchDemand.size
  };
}

function readScraperMonth(month){
  const [y,m]=month.split('-');
  const monthDir = path.join(SCRAPER_ROOT, y, `${y}-${m}`);
  const entries = fs.existsSync(monthDir) ? fs.readdirSync(monthDir) : [];
  const orderFiles = entries.filter(f => /_orders\.csv$/.test(f)).map(f=>path.join(monthDir,f));
  const itemFiles = entries.filter(f => /_line-items\.csv$/.test(f)).map(f=>path.join(monthDir,f));
  const orders=new Set();
  const itemsByOrder=new Map();
  let itemRows=0;
  let revenue = 0;
  // Orders
  for(const f of orderFiles){
    const { headers, rows } = readCSVFile(f);
    const { pick } = headerMap(headers);
    const iId = pick('order_id','order id','id');
    if (iId === -1) continue;
    for(const r of rows){ const oid=normStr(r[iId]); if(oid) orders.add(oid); }
  }
  // Items
  for(const f of itemFiles){
    const { headers, rows } = readCSVFile(f);
    const { pick } = headerMap(headers);
    const iId = pick('order_id','order id','id');
    const iProd = pick('product_name','product','title','name');
    const iColor = pick('color');
    const iSize = pick('size');
    const iDisc = pick('discounted_price','disc. price','discounted price','disc price');
    if (iId === -1) continue;
    for(const r of rows){
      const oid = normStr(r[iId]); if(!oid) continue;
      itemRows++;
      const prod = iProd===-1? '': normStr(r[iProd]);
      const color = iColor===-1? '': normStr(r[iColor]);
      const size = iSize===-1? '': normStr(r[iSize]);
      const key = `${prod}|${color}|${size}`;
      const mm = itemsByOrder.get(oid) || new Map();
      mm.set(key, (mm.get(key)||0)+1);
      itemsByOrder.set(oid, mm);
      if (iDisc !== -1) revenue += moneyToNumber(r[iDisc]);
    }
  }
  return { orders, itemsByOrder, rowsCount: itemRows, revenue, missing: (!orderFiles.length && !itemFiles.length) };
}

// ------ Enhanced analysis helpers ------
function prevMonth(mon){ let [y,m]=mon.split('-').map(Number); m--; if(m<1){ m=12; y--; } return `${y}-${String(m).padStart(2,'0')}`; }
function nextMonth(mon){ let [y,m]=mon.split('-').map(Number); m++; if(m>12){ m=1; y++; } return `${y}-${String(m).padStart(2,'0')}`; }

// Normalize a product/color/size token for fuzzy comparison
function normalizeToken(s){
  return (s==null? '' : String(s))
    .toLowerCase()
    .replace(/\s+/g,' ')
    .replace(/[^a-z0-9]+/g,' ') // drop punctuation/hyphens
    .trim();
}
function normalizeKey(key){
  const [prod='', color='', size=''] = String(key).split('|');
  return `${normalizeToken(prod)}|${normalizeToken(color)}|${normalizeToken(size)}`;
}

function makeNormalizedMap(map){
  const out=new Map();
  for(const [oid, mm] of map.entries()){
    const nm = new Map();
    for(const [k,c] of mm.entries()){
      const nk = normalizeKey(k);
      nm.set(nk, (nm.get(nk)||0)+c);
    }
    out.set(oid, nm);
  }
  return out;
}

function countPlaceholders(map){
  let total=0; const perOrder=new Map();
  for(const [oid, mm] of map.entries()){
    let c=0;
    for(const [k,v] of mm.entries()){
      const prod = String(k).split('|')[0] || '';
      if (/^error\s*-\s*store\s*purchase/i.test(prod)) c+=v;
    }
    if(c){ perOrder.set(oid, c); total+=c; }
  }
  return { total, perOrder };
}

function diffOrders(publicSet, scraperSet){
  const onlyPublic = []; const onlyScraper=[];
  for(const oid of publicSet) if(!scraperSet.has(oid)) onlyPublic.push(oid);
  for(const oid of scraperSet) if(!publicSet.has(oid)) onlyScraper.push(oid);
  return { onlyPublic, onlyScraper };
}

function diffItems(pubMap, scrMap){
  const perOrder = [];
  const allOids = new Set([...pubMap.keys(), ...scrMap.keys()]);
  for(const oid of allOids){
    const p = pubMap.get(oid) || new Map();
    const s = scrMap.get(oid) || new Map();
    const keys = new Set([...p.keys(), ...s.keys()]);
    const diffs=[];
    for(const k of keys){
      const pc = p.get(k)||0; const sc = s.get(k)||0;
      if (pc !== sc) diffs.push({ key: k, public: pc, scraper: sc });
    }
    if (diffs.length) perOrder.push({ order_id: oid, diffs });
  }
  return perOrder;
}

function toCSV(rows){
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = v => {
    const s = v==null? '' : String(v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  };
  const lines = [headers.join(',')];
  for(const r of rows){ lines.push(headers.map(h=>esc(r[h])).join(',')); }
  return lines.join('\n');
}

async function main(){
  ensureDir(OUT_ROOT);
  ensureDir(path.join(OUT_ROOT, 'daily'));
  const months = monthIter(START_MONTH, END_MONTH);
  const summary=[];
  // simple caches for adjacent month lookups
  const cachePublic = new Map();
  const cacheScraper = new Map();
  for(const mon of months){
    log(`Validating ${mon}…`);
    const pub = cachePublic.get(mon) || readPublicMonth(mon); cachePublic.set(mon, pub);
    const scr = cacheScraper.get(mon) || readScraperMonth(mon); cacheScraper.set(mon, scr);
    const pubOrders = pub.orders.size;
    const scrOrders = scr.orders.size;
    const pubItems = pub.rowsCount || 0;
    const scrItems = scr.rowsCount || 0;
    const pubRevenue = pub.revenue || 0;
    const scrRevenue = scr.revenue || 0;
    const { onlyPublic, onlyScraper } = diffOrders(pub.orders, scr.orders);
    const itemDiffs = diffItems(pub.itemsByOrder, scr.itemsByOrder);
    // Normalized comparison (detects title/format differences)
    const nItemDiffs = diffItems(makeNormalizedMap(pub.itemsByOrder), makeNormalizedMap(scr.itemsByOrder));
    // Placeholder analysis on scraper items
    const ph = countPlaceholders(scr.itemsByOrder);

    const status = (pubOrders===scrOrders && pubItems===scrItems && onlyPublic.length===0 && onlyScraper.length===0 && itemDiffs.length===0) ? 'OK' : 'FAIL';
    summary.push({
      month: mon,
      public_orders: pubOrders,
      scraper_orders: scrOrders,
      orders_delta: scrOrders - pubOrders,
      public_items: pubItems,
      scraper_items: scrItems,
      items_delta: scrItems - pubItems,
      public_revenue: pubRevenue.toFixed(2),
      scraper_revenue: scrRevenue.toFixed(2),
      revenue_delta: (scrRevenue - pubRevenue).toFixed(2),
      // Same vs cross-store totals on public side
      public_same_store_orders: pub.sameStoreOrders || 0,
      public_cross_store_orders: pub.crossStoreOrders || 0,
      public_same_store_items: pub.sameStoreItems || 0,
      public_cross_store_items: pub.crossStoreItems || 0,
      // Perspective attribution (if env provided)
      public_orders_match_fulfillment: pub.ordersMatchFulfillCount || 0,
      public_items_match_fulfillment: pub.itemsMatchFulfill || 0,
      public_orders_match_demand: pub.ordersMatchDemandCount || 0,
      public_items_match_demand: pub.itemsMatchDemand || 0,
      public_only_orders: onlyPublic.length,
      scraper_only_orders: onlyScraper.length,
      item_mismatch_orders: itemDiffs.length,
      item_mismatch_orders_normalized: nItemDiffs.length,
      placeholder_items_total: ph.total,
      status
    });
    const detailDir = path.join(OUT_ROOT, 'daily'); ensureDir(detailDir);
    const base = mon.replace('-','-');
    const orderDiffPath = path.join(detailDir, `${mon}_order_mismatches.csv`);
    const orderRows = [
      ...onlyPublic.map(id=>({ month: mon, side: 'public_only', order_id: id })),
      ...onlyScraper.map(id=>({ month: mon, side: 'scraper_only', order_id: id })),
    ];
    if (orderRows.length) fs.writeFileSync(orderDiffPath, toCSV(orderRows));

    if (itemDiffs.length){
      const itemRows=[];
      for(const o of itemDiffs){
        for(const d of o.diffs){ itemRows.push({ month: mon, order_id: o.order_id, key: d.key, public_count: d.public, scraper_count: d.scraper }); }
      }
      const itemDiffPath = path.join(detailDir, `${mon}_item_mismatches.csv`);
      fs.writeFileSync(itemDiffPath, toCSV(itemRows));
    }

    // Normalized diff file for context
    if (nItemDiffs.length){
      const nRows=[];
      for(const o of nItemDiffs){
        for(const d of o.diffs){ nRows.push({ month: mon, order_id: o.order_id, norm_key: d.key, public_count: d.public, scraper_count: d.scraper }); }
      }
      const nPath = path.join(detailDir, `${mon}_item_mismatches_normalized.csv`);
      fs.writeFileSync(nPath, toCSV(nRows));
    }

    // Presence analysis against adjacent months (detect boundary shifts)
    const prev = prevMonth(mon), next = nextMonth(mon);
    const scrPrev = cacheScraper.get(prev) || readScraperMonth(prev); cacheScraper.set(prev, scrPrev);
    const scrNext = cacheScraper.get(next) || readScraperMonth(next); cacheScraper.set(next, scrNext);
    const pubPrev = cachePublic.get(prev) || readPublicMonth(prev); cachePublic.set(prev, pubPrev);
    const pubNext = cachePublic.get(next) || readPublicMonth(next); cachePublic.set(next, pubNext);
    const presenceRows=[];
    for(const id of onlyPublic){ presenceRows.push({ month: mon, side: 'public_only', order_id: id, in_scr_prev: scrPrev.orders.has(id)?'yes':'', in_scr_next: scrNext.orders.has(id)?'yes':'' }); }
    for(const id of onlyScraper){ presenceRows.push({ month: mon, side: 'scraper_only', order_id: id, in_pub_prev: pubPrev.orders.has(id)?'yes':'', in_pub_next: pubNext.orders.has(id)?'yes':'' }); }
    if (presenceRows.length){ fs.writeFileSync(path.join(detailDir, `${mon}_presence_analysis.csv`), toCSV(presenceRows)); }

    // Month analysis summary (single row)
    const analysisRow = [{
      month: mon,
      public_only_orders: onlyPublic.length,
      scraper_only_orders: onlyScraper.length,
      item_mismatch_orders: itemDiffs.length,
      item_mismatch_orders_normalized: nItemDiffs.length,
      placeholder_items_total: ph.total
    }];
    fs.writeFileSync(path.join(detailDir, `${mon}_analysis.csv`), toCSV(analysisRow));
  }
  const summaryPath = path.join(OUT_ROOT, 'orders_vs_public.csv');
  fs.writeFileSync(summaryPath, toCSV(summary));
  log(`Wrote summary: ${summaryPath}`);
}

main().catch(e=>{ console.error('❌ Validation failed:', e); process.exit(1); });
