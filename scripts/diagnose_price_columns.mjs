import { chromium } from 'playwright';

// Usage: node scripts/diagnose_price_columns.mjs <order_url>
const URL = process.argv[2];
if (!URL) { console.error('Usage: node scripts/diagnose_price_columns.mjs <order_url>'); process.exit(1); }

const STORAGE_STATE_PATH = 'storageState.json';

function fmt(obj){ return JSON.stringify(obj, null, 2); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});

  const info = await page.evaluate(() => {
    const norm = (s) => (s||'').replace(/\s+/g,' ').trim();
    const HEADERS = [
      { name: 'Price',      re: /^(price)$/i },
      { name: 'Discount',   re: /^(discount)$/i },
      { name: 'Disc. Price',re: /^(disc\.?\s*price)$/i },
      { name: 'Taxes',      re: /^(taxes)$/i },
    ];

    function clusterByY(els){
      const rows = [];
      for (const el of els){
        const r = el.getBoundingClientRect();
        if (r.width<=0 || r.height<=0) continue;
        const y = Math.round(r.top);
        let bucket = rows.find(b => Math.abs(b.y - y) <= 6);
        if (!bucket) rows.push(bucket = { y, els: [] });
        bucket.els.push({ el, rect: r, text: norm(el.textContent||'') });
      }
      rows.sort((a,b)=>a.y-b.y);
      return rows;
    }

    // 1) find candidate header labels across page
    const all = Array.from(document.querySelectorAll('body *'))
      .filter(el => {
        const t = (el.textContent||'').trim();
        if (!t || t.length>25) return false;
        return HEADERS.some(h => h.re.test(t));
      });
    const clusters = clusterByY(all);
    // choose the cluster with max distinct header matches
    function distinctCount(cluster){
      const found = new Set();
      for (const {text} of cluster.els){
        for (const h of HEADERS){ if (h.re.test(text)) found.add(h.name); }
      }
      return found.size;
    }
    const cluster = clusters.sort((a,b)=> distinctCount(b)-distinctCount(a) || a.y-b.y)[0];
    const headerMap = {};
    if (cluster){
      for (const {el,rect,text} of cluster.els){
        const h = HEADERS.find(h=>h.re.test(text));
        if (h && !headerMap[h.name]) headerMap[h.name] = rect.left + rect.width/2;
      }
    }

    // 2) find rows by locating product description groups
    function parseKV(group){
      const kv={};
      const items = group.querySelectorAll('.ant-descriptions-item');
      if (items.length){
        items.forEach(it=>{
          const label=(it.querySelector('.ant-descriptions-item-label')?.textContent||'').trim().toUpperCase();
          const val=(it.querySelector('.ant-descriptions-item-content')?.textContent||'').trim();
          if (label) kv[label]=val;
        });
      }
      return kv;
    }
    function closestRow(el){
      let cur=el;
      while(cur && cur!==document.body){
        if (cur.querySelector('a') && /\$[0-9]/.test(cur.textContent||'')) return cur;
        cur=cur.parentElement;
      }
      return el;
    }
    function collectPrices(row, exclude){
      const rr = row.getBoundingClientRect();
      const res=[];
      const walker=document.createTreeWalker(row, NodeFilter.SHOW_ELEMENT, null);
      let n=walker.currentNode;
      while(n){
        if (exclude && exclude.contains(n)) { n = walker.nextSibling(); continue; }
        const t=(n.textContent||'').trim();
        const m=t.match(/\$[0-9][\d,]*\.?\d*/);
        if (m){
          const r=n.getBoundingClientRect();
          if (r.width>0 && r.height>0 && r.bottom>=rr.top-4 && r.top<=rr.bottom+4){
            let red=false; try { const cs=window.getComputedStyle(n); const col=cs.color||''; const mm=col.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/); if(mm){ const R=+mm[1],G=+mm[2],B=+mm[3]; if(R>=170&&G<=90&&B<=90) red=true; } } catch{}
            res.push({text:m[0], x:r.left + r.width/2, y:r.top + r.height/2, red});
          }
        }
        n=walker.nextNode();
      }
      return res;
    }

    const groups = Array.from(document.querySelectorAll('.ant-descriptions'));
    const rows = [];
    for (const g of groups){
      const kv = parseKV(g);
      const hasLineKeys = kv['SKU'] || kv['UPC'] || kv['AX_ITEM_NUMBER'] || kv['JASPER_PRODUCT_ID'] || kv['VARIANT_GROUP_ID'];
      if (!hasLineKeys) continue;
      const link = g.closest('*')?.querySelector('a');
      const name = norm(link?.textContent || '');
      // find best ancestor row by climbing and maximizing number of $ amounts found
      let bestRow = null; let bestCount = -1; let cur = g.parentElement; let steps=0;
      while (cur && steps < 8) {
        const prices = collectPrices(cur, g);
        if (prices.length > bestCount) { bestCount = prices.length; bestRow = cur; }
        cur = cur.parentElement; steps++;
      }
      const row = bestRow || closestRow(g);
      const prices = collectPrices(row, g);
      rows.push({ product_name: name, prices });
    }

    return { headerMap, rows };
  });

  console.log('Header positions:', fmt(info.headerMap));
  info.rows.forEach((r, idx) => {
    console.log(`\nRow ${idx+1}: ${r.product_name}`);
    r.prices.forEach(p => console.log(`  price=${p.text} x=${Math.round(p.x)} red=${p.red}`));
  });

  await browser.close();
})();
