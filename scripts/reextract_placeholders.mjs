#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const START_MONTH = process.env.START_MONTH || '2024-12';
const END_MONTH = process.env.END_MONTH || START_MONTH;
const OUT_ROOT = 'reports/reextract';
const SCRAPER_ROOT = 'orders_exports';
const DAILY_REPORTS = 'reports/validation/daily';
const STORAGE_STATE_PATH = 'storageState.json';
const HEADLESS = process.env.HEADLESS === 'false' ? false : true;
const SLOWMO = Number(process.env.SLOWMO || 0);

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

function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

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

function headerIdx(headers, nameCandidates){
  const norm = s => s.toLowerCase().trim();
  const idxMap = Object.fromEntries(headers.map((h,i)=>[norm(h), i]));
  for (const n of nameCandidates){
    const i = idxMap[norm(n)];
    if (i != null) return i;
  }
  // fuzzy contains
  for (const [h,i] of Object.entries(idxMap)){
    for (const n of nameCandidates){ if (h.includes(norm(n))) return i; }
  }
  return -1;
}

function arrayToCSV(rows){
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = v => { const s = v==null? '' : String(v); return /[",\r\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; };
  const out=[headers.join(',')];
  for(const r of rows){ out.push(headers.map(h=>esc(r[h])).join(',')); }
  return out.join('\n');
}

async function extractItemsFromPage(page){
  function moneyToPlain(s){ if (!s || s==='N/A') return '0'; const v=String(s).replace(/[^0-9.\-]/g,''); return v===''?'0':v; }
  const items = await page.evaluate(() => {
    const norm=(s)=> (s||'').replace(/\s+/g,' ').trim();
    const keyify=(s)=> (s||'').trim().toUpperCase().replace(/\s+/g,'_').replace(/[^A-Z0-9_]/g,'');
    function parseKV(group){ const kv={}; const its=group.querySelectorAll('.ant-descriptions-item'); if(its.length){ its.forEach(it=>{ const l=(it.querySelector('.ant-descriptions-item-label')?.textContent||'').trim(); const v=(it.querySelector('.ant-descriptions-item-content')?.textContent||'').trim(); if(l) kv[keyify(l)]=v; }); } return kv; }
    function headerPositions(){ const defs=[{name:'Price',re:/^(price)$/i},{name:'Discount',re:/^(discount)$/i},{name:'Disc. Price',re:/^(disc\.?\s*price)$/i},{name:'Taxes',re:/^(taxes)$/i}]; const pos={}; const els=Array.from(document.querySelectorAll('body *')); for(const {name,re} of defs){ let best=null,bestY=Infinity; for(const el of els){ const t=(el.textContent||'').trim(); if(!t||t.length>30) continue; if(!re.test(t)) continue; const r=el.getBoundingClientRect(); if(r.width>0&&r.height>0&&r.top<bestY){bestY=r.top; best=r;} } if(best) pos[name]=best.left+best.width/2; } return pos; }
    function mapAmounts(row, group){ const headers=headerPositions(); const out={'Price':'','Discount':'','Disc. Price':'','Taxes':''}; const rr=row.getBoundingClientRect(); const w=document.createTreeWalker(row,NodeFilter.SHOW_ELEMENT,null); let n=w.currentNode; const cands=[]; while(n){ if(group.contains(n)){ n=w.nextSibling(); continue;} const t=(n.textContent||'').trim(); const m=t.match(/\$[0-9][\d,]*\.?\d*/); if(m){ const r=n.getBoundingClientRect(); if(r.width>0&&r.height>0&&r.bottom>=rr.top-4&&r.top<=rr.bottom+4){ let red=false; try{ const cs=window.getComputedStyle(n); const col=cs.color||''; const mm=col.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/); if(mm){ const R=+mm[1],G=+mm[2],B=+mm[3]; if(R>=170&&G<=90&&B<=90) red=true; } }catch{} cands.push({price:m[0], x:r.left+r.width/2, red}); } } n=w.nextNode(); }
      const pick=(name, filter)=>{ const hx=headers[name]; if(hx==null) return ''; let best=null,bestDx=Infinity; for(const c of cands){ if(filter&&!filter(c)) continue; const dx=Math.abs(c.x-hx); if(dx<bestDx){ bestDx=dx; best=c; } } return best?best.price:''; };
      const res=[]; const groups=Array.from(document.querySelectorAll('.ant-descriptions'));
      function findNameInGroup(grp){
        try { const container = grp.closest('.sc-RefOD') || grp.parentElement || grp; const a = container.querySelector('a[href*="/catalog/products/"]'); const t=(a?.textContent||'').trim(); if(t) return t; } catch {}
        return '';
      }
      for(const g of groups){
        const kv=parseKV(g);
        const has=kv['SKU']||kv['UPC']||kv['AX_ITEM_NUMBER']||kv['JASPER_PRODUCT_ID']||kv['VARIANT_GROUP_ID'];
        if(!has) continue;
        const row=g; // pricing aligned within group subtree
        const name=findNameInGroup(g) || 'Item';
        const mapped=mapAmounts(row,g);
        res.push({ name, kv, mapped });
      }
      return res;
  });
  // Format rows similar to scraper
  const rows = [];
  items.forEach((it, idx) => {
    rows.push({
      line_number: idx+1,
      product_name: it.name || 'Item',
      sku: it.kv.SKU || '',
      upc: it.kv.UPC || '',
      color: it.kv.COLOR || '',
      size: it.kv.SIZE || '',
      quantity: '1',
      ax_item_number: it.kv.AX_ITEM_NUMBER || '',
      jasper_product_id: it.kv.JASPER_PRODUCT_ID || '',
      magento_sku: it.kv.MAGENTO_SKU || '',
      variant_group_id: it.kv.VARIANT_GROUP_ID || '',
      tax_class_id: it.kv.TAX_CLASS_ID || '',
      product_id: it.kv.PRODUCT_ID || '',
      unit_price: moneyToPlain(it.mapped['Price']),
      line_discount: moneyToPlain(it.mapped['Discount']),
      discounted_price: moneyToPlain(it.mapped['Disc. Price'] || it.mapped['Price']),
      taxes: moneyToPlain(it.mapped['Taxes'])
    });
  });
  return rows;
}

async function main(){
  const months = monthIter(START_MONTH, END_MONTH);
  ensureDir(OUT_ROOT);
  const browser = await chromium.launch({ headless: HEADLESS, slowMo: SLOWMO });
  const context = fs.existsSync(STORAGE_STATE_PATH)
    ? await browser.newContext({ storageState: STORAGE_STATE_PATH })
    : await browser.newContext();
  const page = await context.newPage();
  const summaryRows=[];

  for (const mon of months){
    const [y,m]=mon.split('-');
    const dailyPath = path.join(DAILY_REPORTS, `${mon}_item_mismatches.csv`);
    if(!fs.existsSync(dailyPath)) continue;
    const { headers, rows } = readCSVFile(dailyPath);
    const iOrder = headerIdx(headers, ['order_id','Order ID']);
    const iKey = headerIdx(headers, ['key']);
    if (iOrder === -1 || iKey === -1) continue;
    const targetOrders = new Set();
    for (const r of rows){
      const oid = r[iOrder];
      const key = r[iKey] || '';
      if ((key + '').startsWith('Error - Store Purchase|')) targetOrders.add(oid);
    }
    if (!targetOrders.size) continue;

    // map order_id -> href from monthly orders exports
    const monthDir = path.join(SCRAPER_ROOT, y, `${y}-${m}`);
    const orderFiles = fs.existsSync(monthDir) ? fs.readdirSync(monthDir).filter(f=>/_orders\.csv$/.test(f)) : [];
    const hrefMap = new Map();
    for (const f of orderFiles){
      const fpath = path.join(monthDir, f);
      const { headers, rows } = readCSVFile(fpath);
      const iId = headerIdx(headers, ['order_id','Order ID']);
      const iHref = headerIdx(headers, ['href','link']);
      if (iId === -1 || iHref === -1) continue;
      for (const r of rows){ const oid = (r[iId]||'').trim(); const href=(r[iHref]||'').trim(); if(oid && href) hrefMap.set(oid, href); }
    }

    const outDir = path.join(OUT_ROOT, `${y}-${m}`); ensureDir(outDir);
    let success=0, failed=0;
    for (const oid of targetOrders){
      const href = hrefMap.get(oid);
      if (!href){ failed++; continue; }
      try {
        await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForSelector('.ant-descriptions, .sc-gisBJw a[href*="/catalog/products/"]', { timeout: 10000 }).catch(()=>{});
        const items = await extractItemsFromPage(page);
        const rows = items.map((it, idx) => ({ order_id: oid, ...it, line_number: idx+1 }));
        const csv = arrayToCSV(rows);
        fs.writeFileSync(path.join(outDir, `${oid}_line-items.csv`), csv);
        success++;
      } catch(e){ failed++; }
    }
    summaryRows.push({ month: mon, orders_targeted: targetOrders.size, reextract_success: success, reextract_failed: failed, out_dir: path.join(outDir) });
  }

  ensureDir(OUT_ROOT);
  if (summaryRows.length) fs.writeFileSync(path.join(OUT_ROOT, 'summary.csv'), arrayToCSV(summaryRows));
  await context.storageState({ path: STORAGE_STATE_PATH }).catch(()=>{});
  await browser.close();
}

main().catch(e=>{ console.error('❌ Re-extract failed:', e); process.exit(1); });

