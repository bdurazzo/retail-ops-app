#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// Config
const PUBLIC_ROOT = 'public/data/newstore/orders';
const SCRAPER_ROOT = 'orders_exports';
const OUT_ROOT = 'reports/validation';
const START_MONTH = process.env.START_MONTH || '2023-11'; // YYYY-MM
const END_MONTH = process.env.END_MONTH || '2025-07';     // YYYY-MM

function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function normStr(s){ return (s==null? '': String(s)).replace(/\s+/g,' ').trim(); }
function normalizeToken(s){ return normStr(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
function normalizeKey(key){
  const [prod='', color='', size=''] = String(key).split('|');
  return `${normalizeToken(prod)}|${normalizeToken(color)}|${normalizeToken(size)}`;
}

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

// Minimal CSV parser that handles quotes
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

function headerMap(headers){
  const idx={};
  const norm = s => s.toLowerCase().replace(/\s+/g,' ').trim();
  headers.forEach((h,i)=>{ idx[norm(h)] = i; });
  const pick = (...names) => {
    for(const n of names){
      const key = norm(n);
      if (idx[key] != null) return idx[key];
    }
    for(const k of Object.keys(idx)){
      for(const n of names){ if (k.includes(norm(n))) return idx[k]; }
    }
    return -1;
  };
  return { idx, pick };
}

function readPublicMonth(month){
  const [y,m]=month.split('-');
  const file = path.join(PUBLIC_ROOT, y, `${y}-${m}`, `${y}-${m}_orders_in_store.csv`);
  if(!fs.existsSync(file)) return { orders: new Set(), itemsByOrder: new Map(), missing: true };
  const { headers, rows } = readCSVFile(file);
  const { pick } = headerMap(headers);
  const iId = pick('order_id','order id','id','Order ID');
  const iProd = pick('product_name','product','title','name');
  const iColor = pick('color');
  const iSize = pick('size');
  if (iId === -1) return { orders: new Set(), itemsByOrder: new Map(), missing: true };
  const orders=new Set();
  const map=new Map();
  for(const r of rows){
    const oid = normStr(r[iId]); if(!oid) continue; orders.add(oid);
    const prod = iProd===-1? '': normStr(r[iProd]);
    const color = iColor===-1? '': normStr(r[iColor]);
    const size = iSize===-1? '': normStr(r[iSize]);
    const key = `${prod}|${color}|${size}`;
    const mm = map.get(oid) || new Map();
    mm.set(key, (mm.get(key)||0)+1);
    map.set(oid, mm);
  }
  return { orders, itemsByOrder: map, missing: false };
}

function readScraperMonth(month){
  const [y,m]=month.split('-');
  const monthDir = path.join(SCRAPER_ROOT, y, `${y}-${m}`);
  const entries = fs.existsSync(monthDir) ? fs.readdirSync(monthDir) : [];
  const orderFiles = entries.filter(f => /_orders\.csv$/.test(f)).map(f=>path.join(monthDir,f));
  const itemFiles = entries.filter(f => /_line-items\.csv$/.test(f)).map(f=>path.join(monthDir,f));
  const orders=new Set();
  const itemsByOrder=new Map();
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
    if (iId === -1) continue;
    for(const r of rows){
      const oid = normStr(r[iId]); if(!oid) continue;
      const prod = iProd===-1? '': normStr(r[iProd]);
      const color = iColor===-1? '': normStr(r[iColor]);
      const size = iSize===-1? '': normStr(r[iSize]);
      const key = `${prod}|${color}|${size}`;
      const mm = itemsByOrder.get(oid) || new Map();
      mm.set(key, (mm.get(key)||0)+1);
      itemsByOrder.set(oid, mm);
    }
  }
  return { orders, itemsByOrder, missing: (!orderFiles.length && !itemFiles.length) };
}

function diffCount(mapA, mapB){
  const keys = new Set([...mapA.keys(), ...mapB.keys()]);
  let count=0; let deltaSum=0; let totalA=0; let totalB=0;
  for(const k of keys){
    const a = mapA.get(k)||0; const b = mapB.get(k)||0;
    totalA += a; totalB += b;
    if (a !== b) { count++; deltaSum += (b-a); }
  }
  return { count, deltaSum, totalA, totalB };
}

function makeNormalizedMap(mm){
  const out=new Map();
  for(const [k,v] of mm.entries()){
    const nk = normalizeKey(k);
    out.set(nk, (out.get(nk)||0)+v);
  }
  return out;
}

function toCSV(rows){
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = v => { const s = v==null? '' : String(v); return /[",\r\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; };
  const out=[headers.join(',')];
  for(const r of rows){ out.push(headers.map(h=>esc(r[h])).join(',')); }
  return out.join('\n');
}

async function main(){
  ensureDir(OUT_ROOT);
  const months = monthIter(START_MONTH, END_MONTH);
  const rows=[]; const detailRows=[];
  for(const mon of months){
    const pub = readPublicMonth(mon);
    const scr = readScraperMonth(mon);
    const both = new Set([...pub.orders].filter(id => scr.orders.has(id)));
    for(const oid of both){
      const pRaw = pub.itemsByOrder.get(oid) || new Map();
      const sRaw = scr.itemsByOrder.get(oid) || new Map();
      const raw = diffCount(pRaw, sRaw);
      const pNorm = makeNormalizedMap(pRaw);
      const sNorm = makeNormalizedMap(sRaw);
      const norm = diffCount(pNorm, sNorm);
      if (raw.count>0 || norm.count>0){
        rows.push({
          month: mon,
          order_id: oid,
          public_items: raw.totalA,
          scraper_items: raw.totalB,
          items_delta: raw.deltaSum,
          mismatch_count_raw: raw.count,
          mismatch_count_normalized: norm.count
        });
        // add a few detail examples for context (up to 3)
        let added=0;
        for(const k of new Set([...pRaw.keys(), ...sRaw.keys()])){
          if (added>=3) break;
          const a=pRaw.get(k)||0, b=sRaw.get(k)||0;
          if (a!==b){ detailRows.push({ month: mon, order_id: oid, key: k, public_count: a, scraper_count: b, delta: b-a }); added++; }
        }
      }
    }
  }
  rows.sort((a,b)=> b.mismatch_count_normalized - a.mismatch_count_normalized || Math.abs(b.items_delta) - Math.abs(a.items_delta));
  const outMain = path.join(OUT_ROOT, 'overlap_item_discrepancies.csv');
  fs.writeFileSync(outMain, toCSV(rows));
  const outDetail = path.join(OUT_ROOT, 'overlap_item_discrepancies_details.csv');
  fs.writeFileSync(outDetail, toCSV(detailRows));
  console.log(`Wrote: ${outMain}`);
  console.log(`Wrote: ${outDetail}`);
}

main().catch(e=>{ console.error('❌ find_overlap_item_discrepancies failed:', e); process.exit(1); });
