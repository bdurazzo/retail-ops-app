// Summarize product facets (skus, colors, sizes) from orders by product-name text
import { OrdersRepository } from "../repositories/OrdersRepository.js";

function ymKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function defaultTimeRange() {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
  return { startYYYYMM: ymKey(start), endYYYYMM: ymKey(end) };
}

export const OrdersProductFacets = {
  async summarizeByProductName({ text, time, limit = 100000 }) {
    const q = (text || '').trim();
    if (!q) return { total: 0, title: '', skus: [], colors: [], sizes: [] };
    const low = q.toLowerCase();
    const tr = time && time.startYYYYMM && time.endYYYYMM ? time : defaultTimeRange();
    const { rows } = await OrdersRepository.findByMonthRange(tr);
    if (!Array.isArray(rows) || rows.length === 0) return { total: 0, title: q, skus: [], colors: [], sizes: [] };

    const nameCounts = new Map();
    const skuCounts = new Map();
    const colorCounts = new Map();
    const sizeCounts = new Map();

    let scanned = 0;
    for (const r of rows) {
      const name = String(r["Product Name"] || '').trim();
      if (!name || !name.toLowerCase().includes(low)) continue;
      scanned++;
      if (scanned > limit) break;
      nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
      const sku = r.sku || null; if (sku) skuCounts.set(sku, (skuCounts.get(sku) || 0) + 1);
      const color = r.Color || null; if (color) colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      const size = r.Size || null; if (size) sizeCounts.set(size, (sizeCounts.get(size) || 0) + 1);
    }

    const top = (m) => Array.from(m.entries()).sort((a,b)=> b[1]-a[1]).map(([value,count])=>({ value, count }));
    const topNames = top(nameCounts);
    const titleGuess = topNames.length ? topNames[0].value : q;
    return {
      total: scanned,
      title: titleGuess,
      skus: top(skuCounts).slice(0, 50),
      colors: top(colorCounts).slice(0, 50),
      sizes: top(sizeCounts).slice(0, 50),
    };
  }
  ,
  async suggestProductNames({ text, time, max = 50 }) {
    const q = (text || '').trim();
    if (!q) return [];
    const low = q.toLowerCase();
    const tr = time && time.startYYYYMM && time.endYYYYMM ? time : defaultTimeRange();
    const { rows } = await OrdersRepository.findByMonthRange(tr);
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const map = new Map();
    for (const r of rows) {
      const name = String(r["Product Name"] || '').trim();
      if (!name || !name.toLowerCase().includes(low)) continue;
      map.set(name, (map.get(name) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a,b)=> b[1]-a[1])
      .slice(0, max)
      .map(([title,count])=>({ title, count }));
  }
};
