#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Inputs/Outputs
const SCRAPER_ROOT = process.env.SCRAPER_ROOT || 'orders_exports';
const OUT_ROOT = process.env.OUT_ROOT || 'public/data/retail/orders';

function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function normStr(s){ return (s==null? '' : String(s)).trim(); }
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
function readCSV(file){
  const text=fs.readFileSync(file,'utf8');
  const rows=parseCSV(text);
  if(!rows.length) return { headers: [], rows: [] };
  const headers = rows[0].map(h=>normStr(h));
  return { headers, rows: rows.slice(1) };
}
function toCSV(headers, rows){
  const esc = v => { const s=v==null?'' : String(v); return /[",\r\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; };
  const out=[headers.join(',')];
  for(const r of rows){ out.push(headers.map(h=>esc(r[h])).join(',')); }
  return out.join('\n');
}
function sha256(text){ return crypto.createHash('sha256').update(text).digest('hex'); }
function moneyToNumber(s){ if (s==null) return 0; const v=String(s).replace(/[^0-9.\-]/g,''); const n=Number(v); return Number.isFinite(n)? n : 0; }

function listMonths(root){
  if (!fs.existsSync(root)) return [];
  const years = fs.readdirSync(root).filter(d=>/^[0-9]{4}$/.test(d));
  const out=[];
  for(const y of years){
    const ydir=path.join(root,y);
    const months = fs.readdirSync(ydir).filter(d=>/^[0-9]{4}-[0-9]{2}$/.test(d));
    for(const m of months){ out.push({ year: y, month: m }); }
  }
  out.sort((a,b)=> a.month.localeCompare(b.month));
  return out;
}

function unionHeaders(files){
  const set=new Set();
  for(const f of files){ const { headers } = readCSV(f); headers.forEach(h=>set.add(h)); }
  return Array.from(set);
}

function writeMonthlyOrders(scrMonthDir, outMonthDir){
  const orderFiles = fs.readdirSync(scrMonthDir).filter(f=>/_orders\.csv$/.test(f)).map(f=>path.join(scrMonthDir,f));
  if (!orderFiles.length) return null;
  const headers = unionHeaders(orderFiles);
  const rows=[];
  const seenOrderIds=new Set();
  let fulfillIdx=-1, demandIdx=-1, idIdx=-1;
  for(const f of orderFiles){
    const { headers: h, rows: r } = readCSV(f);
    const hmap = Object.fromEntries(h.map((x,i)=>[x,i]));
    for(const rr of r){
      const row={};
      for(const col of headers){
        const i = hmap[col];
        row[col] = i==null? '' : rr[i];
      }
      rows.push(row);
      if (idIdx===-1 && hmap['order_id']!=null) idIdx=hmap['order_id'];
      if (fulfillIdx===-1 && hmap['fulfillment_location']!=null) fulfillIdx=hmap['fulfillment_location'];
      if (demandIdx===-1 && hmap['demand_location']!=null) demandIdx=hmap['demand_location'];
      if (idIdx!=null){ const oid=normStr(rr[idIdx]); if(oid) seenOrderIds.add(oid); }
    }
  }
  const csv=toCSV(headers, rows);
  ensureDir(outMonthDir);
  const outFile = path.join(outMonthDir, 'orders.csv');
  fs.writeFileSync(outFile, csv);
  return { file: outFile, headers, rowsCount: rows.length, ordersCount: seenOrderIds.size, sha256: sha256(csv) };
}

function writeMonthlyLineItems(scrMonthDir, outMonthDir){
  const itemFiles = fs.readdirSync(scrMonthDir).filter(f=>/_line-items\.csv$/.test(f)).map(f=>path.join(scrMonthDir,f));
  if (!itemFiles.length) return null;
  const headers = unionHeaders(itemFiles);
  const rows=[];
  let qtyIdx=-1, discIdx=-1, unitIdx=-1, discAmtIdx=-1;
  for(const f of itemFiles){
    const { headers: h, rows: r } = readCSV(f);
    const hmap = Object.fromEntries(h.map((x,i)=>[x,i]));
    if (qtyIdx===-1 && hmap['quantity']!=null) qtyIdx=hmap['quantity'];
    if (discIdx===-1 && hmap['discounted_price']!=null) discIdx=hmap['discounted_price'];
    if (unitIdx===-1 && hmap['unit_price']!=null) unitIdx=hmap['unit_price'];
    if (discAmtIdx===-1 && hmap['line_discount']!=null) discAmtIdx=hmap['line_discount'];
    for(const rr of r){
      const row={};
      for(const col of headers){
        const i = hmap[col];
        row[col] = i==null? '' : rr[i];
      }
      rows.push(row);
    }
  }
  const csv=toCSV(headers, rows);
  ensureDir(outMonthDir);
  const outFile = path.join(outMonthDir, 'line_items.csv');
  fs.writeFileSync(outFile, csv);
  // Compute metrics
  let itemRows=0, itemQty=0, gross=0;
  for(const r of rows){
    itemRows++;
    const q = qtyIdx===-1? 1 : Number(String(r['quantity']).replace(/[^0-9.\-]/g,'')) || 1;
    itemQty += q;
    let v = 0;
    if (discIdx!==-1){ v = moneyToNumber(r['discounted_price']); }
    else if (unitIdx!==-1){ v = moneyToNumber(r['unit_price']) - moneyToNumber(r['line_discount']); }
    gross += v;
  }
  return { file: outFile, headers, rowsCount: itemRows, itemsQuantity: itemQty, grossRevenue: Number(gross.toFixed(2)), sha256: sha256(csv) };
}

async function main(){
  const months = listMonths(SCRAPER_ROOT);
  if (!months.length){ console.error(`No months found in ${SCRAPER_ROOT}`); process.exit(1); }
  const index = { months: [], last_updated: new Date().toISOString(), source: 'scraper' };
  for(const {year, month} of months){
    const scrMonthDir = path.join(SCRAPER_ROOT, year, month);
    const outMonthDir = path.join(OUT_ROOT, year, month);
    const ordersMeta = writeMonthlyOrders(scrMonthDir, outMonthDir);
    const itemsMeta = writeMonthlyLineItems(scrMonthDir, outMonthDir);
    if (!ordersMeta && !itemsMeta) continue;
    const record = {
      month,
      path: `${year}/${month}`,
      files: {
        orders: ordersMeta? 'orders.csv' : '',
        line_items: itemsMeta? 'line_items.csv' : ''
      },
      counts: {
        orders: ordersMeta? ordersMeta.ordersCount : 0,
        item_rows: itemsMeta? itemsMeta.rowsCount : 0,
        item_quantity: itemsMeta? itemsMeta.itemsQuantity : 0
      },
      revenue: {
        gross: itemsMeta? itemsMeta.grossRevenue : 0
      },
      checksum: {
        orders_csv_sha256: ordersMeta? ordersMeta.sha256 : '',
        line_items_csv_sha256: itemsMeta? itemsMeta.sha256 : ''
      },
      last_updated: new Date().toISOString()
    };
    index.months.push(record);
  }
  // Sort months ascending by month key
  index.months.sort((a,b)=> a.month.localeCompare(b.month));
  ensureDir(OUT_ROOT);
  fs.writeFileSync(path.join(OUT_ROOT, 'index.json'), JSON.stringify(index, null, 2));
  // Write root manifest pointer
  const manifestRoot = path.join('public/data/retail/manifests');
  ensureDir(manifestRoot);
  const rootManifestPath = path.join(manifestRoot, 'root.json');
  let root = {};
  if (fs.existsSync(rootManifestPath)){
    try { root = JSON.parse(fs.readFileSync(rootManifestPath,'utf8')||'{}'); } catch {}
  }
  root.orders = path.relative(manifestRoot, path.join('..','orders','index.json')).replace(/\\/g,'/');
  root.last_updated = new Date().toISOString();
  fs.writeFileSync(rootManifestPath, JSON.stringify(root, null, 2));
  console.log(`Wrote: ${path.join(OUT_ROOT, 'index.json')}`);
  console.log(`Wrote: ${rootManifestPath}`);
}

main().catch(e=>{ console.error('❌ orders_rollup failed:', e); process.exit(1); });

