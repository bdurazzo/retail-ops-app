#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const PUBLIC_ROOT = 'public/data/newstore/orders';
const OUT_ROOT = 'reports/validation';
const START_MONTH = process.env.START_MONTH || '2023-11';
const END_MONTH = process.env.END_MONTH || '2025-07';

function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
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

// Minimal CSV reader (quotes aware)
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
  headers.forEach((h,i)=>{ idx[(h||'').toLowerCase().replace(/\s+/g,' ').trim()] = i; });
  const find = (...names) => {
    for (const n of names){ const j = idx[n.toLowerCase().replace(/\s+/g,' ').trim()]; if (j != null) return j; }
    for (const k of Object.keys(idx)){
      for (const n of names){ if (k.includes(n.toLowerCase().replace(/\s+/g,' ').trim())) return idx[k]; }
    }
    return -1;
  };
  return { find };
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
  const itemsRows=[]; // tall format: month, demand_location, fulfillment_location, item_rows
  const ordersRows=[]; // tall format: month, demand_location, fulfillment_location, orders
  for(const mon of months){
    const [y,m]=mon.split('-');
    const file = path.join(PUBLIC_ROOT, y, `${y}-${m}`, `${y}-${m}_orders_in_store.csv`);
    if(!fs.existsSync(file)) continue;
    const { headers, rows } = readCSVFile(file);
    const { find } = headerPick(headers);
    const iId = find('order id','order_id');
    const iDem = find('demand location','demand');
    const iFul = find('fulfillment location','fulfilment');
    if (iId === -1 || iDem === -1 || iFul === -1) continue;
    // item_rows aggregation
    const itemAgg = new Map();
    // orders aggregation (unique order per pair)
    const pairOrders = new Map(); // key: pair, value: Set(order_id)
    for(const r of rows){
      const oid = normStr(r[iId]); if(!oid) continue;
      const dem = normStr(r[iDem]);
      const ful = normStr(r[iFul]);
      const key = `${dem}|||${ful}`;
      itemAgg.set(key, (itemAgg.get(key)||0)+1);
      const s = pairOrders.get(key) || new Set();
      s.add(oid);
      pairOrders.set(key, s);
    }
    for(const [k,cnt] of itemAgg.entries()){
      const [dem, ful] = k.split('|||');
      itemsRows.push({ month: mon, demand_location: dem, fulfillment_location: ful, item_rows: cnt });
    }
    for(const [k,set] of pairOrders.entries()){
      const [dem, ful] = k.split('|||');
      ordersRows.push({ month: mon, demand_location: dem, fulfillment_location: ful, orders: set.size });
    }
  }
  itemsRows.sort((a,b)=> a.month.localeCompare(b.month) || a.demand_location.localeCompare(b.demand_location) || a.fulfillment_location.localeCompare(b.fulfillment_location));
  ordersRows.sort((a,b)=> a.month.localeCompare(b.month) || a.demand_location.localeCompare(b.demand_location) || a.fulfillment_location.localeCompare(b.fulfillment_location));
  const outItems = path.join(OUT_ROOT, 'public_flow_matrix_items.csv');
  const outOrders = path.join(OUT_ROOT, 'public_flow_matrix_orders.csv');
  fs.writeFileSync(outItems, toCSV(itemsRows));
  fs.writeFileSync(outOrders, toCSV(ordersRows));
  console.log(`Wrote: ${outItems}`);
  console.log(`Wrote: ${outOrders}`);
}

main().catch(e=>{ console.error('❌ public_flow_matrix failed:', e); process.exit(1); });

