#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const PUBLIC_ROOT = 'public/data/newstore/orders';
const SCRAPER_ROOT = 'orders_exports';
const OUT_ROOT = 'reports/validation';
const START_MONTH = process.env.START_MONTH || '2023-11';
const END_MONTH = process.env.END_MONTH || '2025-07';
const TOP_N = Number(process.env.TOP_N || 100);
const INCLUDE_PLACEHOLDERS = String(process.env.INCLUDE_PLACEHOLDERS||'false').toLowerCase()==='true';

function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

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

// Minimal CSV reader (supports quotes)
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

function headerPick(headers){
  const idx={};
  headers.forEach((h,i)=>{ idx[h.toLowerCase().trim()] = i; });
  const find = (...names) => {
    for (const n of names){ const j = idx[n.toLowerCase().trim()]; if (j != null) return j; }
    // fuzzy contains
    for (const [k,i] of Object.entries(idx)){
      for (const n of names){ if (k.includes(n.toLowerCase().trim())) return i; }
    }
    return -1;
  };
  return { find };
}

function normStr(s){ return (s==null? '': String(s)).replace(/\s+/g,' ').trim(); }
function normalizeToken(s){
  return normStr(s)
    .toLowerCase()
    .replace(/^filson'?s?\s+/,'') // drop leading brand prefix
    .replace(/\b(no\s*color|no\s*colour|n\/a|na|none)\b/g,'nocolor')
    .replace(/[^a-z0-9]+/g,'') // collapse punctuation/spaces/hyphens
    .trim();
}

function addCount(map, key, by=1){ map.set(key, (map.get(key)||0)+by); }

function readPublicMonth(month, agg, aggNorm, aliasNorm){
  const [y,m]=month.split('-');
  const file = path.join(PUBLIC_ROOT, y, `${y}-${m}`, `${y}-${m}_orders_in_store.csv`);
  if(!fs.existsSync(file)) return;
  const { headers, rows } = readCSVFile(file);
  const { find } = headerPick(headers);
  const ip = find('product_name','product','title','name');
  const ic = find('color');
  const isz = find('size');
  for(const r of rows){
    const prodRaw = ip===-1? '' : normStr(r[ip]);
    if (!INCLUDE_PLACEHOLDERS && /^error\s*-\s*store\s*purchase/i.test(prodRaw)) continue;
    const prod = prodRaw;
    const color = ic===-1? '' : normStr(r[ic]);
    const size = isz===-1? '' : normStr(r[isz]);
    const key = `${prod}|${color}|${size}`;
    addCount(agg.public, key, 1);
    const nkey = `${normalizeToken(prod)}|${normalizeToken(color)}|${normalizeToken(size)}`;
    addCount(aggNorm.public, nkey, 1);
    // Capture alias for representative raw triple
    if (aliasNorm){
      const amap = aliasNorm.public.get(nkey) || new Map();
      const raw = `${prod}|${color}|${size}`;
      addCount(amap, raw, 1);
      aliasNorm.public.set(nkey, amap);
    }
  }
}

function readScraperMonth(month, agg, aggNorm, aliasNorm){
  const [y,m]=month.split('-');
  const dir = path.join(SCRAPER_ROOT, y, `${y}-${m}`);
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f=>/_line-items\.csv$/.test(f));
  for(const f of files){
    const { headers, rows } = readCSVFile(path.join(dir,f));
    const { find } = headerPick(headers);
    const ip = find('product_name','product','title','name');
    const ic = find('color');
    const isz = find('size');
    const iq = find('quantity','qty','count');
    for(const r of rows){
      const prodRaw = ip===-1? '' : normStr(r[ip]);
      if (!INCLUDE_PLACEHOLDERS && /^error\s*-\s*store\s*purchase/i.test(prodRaw)) continue;
      const prod = prodRaw;
      const color = ic===-1? '' : normStr(r[ic]);
      const size = isz===-1? '' : normStr(r[isz]);
      const qty = iq===-1 ? 1 : Number(String(r[iq]).replace(/[^0-9.-]/g,'')) || 1;
      const key = `${prod}|${color}|${size}`;
      addCount(agg.scraper, key, qty);
      const nkey = `${normalizeToken(prod)}|${normalizeToken(color)}|${normalizeToken(size)}`;
      addCount(aggNorm.scraper, nkey, qty);
      if (aliasNorm){
        const amap = aliasNorm.scraper.get(nkey) || new Map();
        const raw = `${prod}|${color}|${size}`;
        addCount(amap, raw, qty);
        aliasNorm.scraper.set(nkey, amap);
      }
    }
  }
}

function toCSV(rows){
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = v => { const s = v==null? '' : String(v); return /[",\r\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; };
  const out=[headers.join(',')];
  for(const r of rows){ out.push(headers.map(h=>esc(r[h])).join(',')); }
  return out.join('\n');
}

function buildReport(agg, aliasNorm){
  const keys = new Set([...agg.public.keys(), ...agg.scraper.keys()]);
  const rows=[];
  for(const k of keys){
    const [product_name, color, size] = k.split('|');
    const public_qty = agg.public.get(k)||0;
    const scraper_qty = agg.scraper.get(k)||0;
    const total = Math.max(public_qty, scraper_qty);
    const row = { product_name, color, size, public_qty, scraper_qty, delta: scraper_qty - public_qty, total };
    // For normalized aggregations, surface a representative raw title/color/size
    if (aliasNorm){
      const pmap = aliasNorm.public.get(k);
      const smap = aliasNorm.scraper.get(k);
      const pickTop = (m)=>{
        if (!m) return '';
        let bestK='', bestV=-1;
        for(const [rk,rv] of m.entries()) if (rv>bestV){ bestV=rv; bestK=rk; }
        return bestK;
      };
      const pRaw = pickTop(pmap);
      const sRaw = pickTop(smap);
      if (pRaw||sRaw){
        const rep = (public_qty>=scraper_qty ? pRaw : sRaw) || pRaw || sRaw || '';
        const [rep_name='', rep_color='', rep_size=''] = rep.split('|');
        row.representative_name = rep_name;
        row.representative_color = rep_color;
        row.representative_size = rep_size;
      }
    }
    rows.push(row);
  }
  rows.sort((a,b)=> b.total - a.total || b.scraper_qty - a.scraper_qty);
  return rows.slice(0, TOP_N).map(({total, ...rest})=> rest);
}

async function main(){
  ensureDir(OUT_ROOT);
  const months = monthIter(START_MONTH, END_MONTH);
  const agg = { public: new Map(), scraper: new Map() };
  const aggNorm = { public: new Map(), scraper: new Map() };
  // Track representative raw triples per normalized key for friendlier output
  const aliasNorm = { public: new Map(), scraper: new Map() };
  for(const mon of months){
    readPublicMonth(mon, agg, aggNorm, aliasNorm);
    readScraperMonth(mon, agg, aggNorm, aliasNorm);
  }
  const top = buildReport(agg);
  const topNorm = buildReport(aggNorm, aliasNorm);
  fs.writeFileSync(path.join(OUT_ROOT, 'top_items_compare.csv'), toCSV(top));
  fs.writeFileSync(path.join(OUT_ROOT, 'top_items_compare_normalized.csv'), toCSV(topNorm));
  // Discrepancies only (delta != 0), sorted by absolute delta desc
  const withAbs = rows => rows.map(r=>({ ...r, abs_delta: Math.abs(Number(r.delta)||0) }));
  const sortAbs = rows => rows.sort((a,b)=> b.abs_delta - a.abs_delta || (Number(b.scraper_qty||0) - Number(a.scraper_qty||0)));
  const discRaw = sortAbs(withAbs(top.filter(r => Number(r.delta||0) !== 0)));
  const discNorm = sortAbs(withAbs(topNorm.filter(r => Number(r.delta||0) !== 0)));
  fs.writeFileSync(path.join(OUT_ROOT, 'top_items_discrepancies_raw.csv'), toCSV(discRaw));
  fs.writeFileSync(path.join(OUT_ROOT, 'top_items_discrepancies_normalized.csv'), toCSV(discNorm));
  console.log(`Wrote: ${path.join(OUT_ROOT, 'top_items_discrepancies_raw.csv')}`);
  console.log(`Wrote: ${path.join(OUT_ROOT, 'top_items_discrepancies_normalized.csv')}`);
  console.log(`Wrote: ${path.join(OUT_ROOT, 'top_items_compare.csv')}`);
  console.log(`Wrote: ${path.join(OUT_ROOT, 'top_items_compare_normalized.csv')}`);
}

main().catch(e=>{ console.error('❌ top_items_compare failed:', e); process.exit(1); });
