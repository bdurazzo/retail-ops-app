// Lightweight search lens registry for the Product panel SearchBar.
// A lens encapsulates where and how we fetch suggestions, and how we map results
// into a common suggestion shape: { title, sku?, product_id? }.

import { OrdersRepository } from "../../../repositories/OrdersRepository.js";
import { CatalogRepository } from "../../../repositories/CatalogRepository.js";
import { OrdersKeywordIndex } from "../../../services/OrdersKeywordIndex.js";

function ymKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

async function ordersByProductName({ text, query }) {
  const q = (text || '').trim();
  if (q.length < 3) return { items: [], error: null };
  let time = query?.time;
  // Fallback: if no time range set, search the last 3 months
  if (!time?.startYYYYMM || !time?.endYYYYMM) {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
    time = { startYYYYMM: ymKey(start), endYYYYMM: ymKey(end) };
  }
  try {
    const { rows } = await OrdersRepository.findByMonthRange({ startYYYYMM: time.startYYYYMM, endYYYYMM: time.endYYYYMM });
    const low = q.toLowerCase();
    const seen = new Set();
    const items = [];
    for (const r of rows) {
      const name = String(r["Product Name"] || '').trim();
      if (!name || !name.toLowerCase().includes(low)) continue;
      const sku = r.sku || null;
      const key = sku ? `${name}::${sku}` : name;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ title: name, sku });
      if (items.length >= 25) break;
    }
    return { items, error: null };
  } catch (e) {
    return { items: [], error: e?.message || 'Orders search failed' };
  }
}

async function catalogKeyword({ text }) {
  const q = (text || '').trim();
  if (q.length < 2) return { items: [], error: null };
  try {
    const products = await CatalogRepository.searchProducts(q, {});
    const items = (products || []).slice(0, 25).map(p => ({
      title: p.title,
      product_id: p.product_id,
      sku: p.sku || p.default_sku || null,
    }));
    return { items, error: null };
  } catch (e) {
    return { items: [], error: e?.message || 'Catalog search failed' };
  }
}

export const SEARCH_LENSES = {
  ordersProductName: {
    id: 'ordersProductName',
    label: 'Orders • Product Name',
    run: ordersByProductName,
  },
  ordersKeyword: {
    id: 'ordersKeyword',
    label: 'Orders • Keyword (Retail)',
    async run({ text, dims, query }) {
      try {
        const time = query?.time;
        const { items } = await OrdersKeywordIndex.search({ text, dims, time, limit: 50 });
        // Map to common suggestion shape
        const suggestions = (items || []).slice(0, 25).map((it) => ({
          title: it.title || '',
          sku: it.sku || null,
        }));
        return { items: suggestions, error: null };
      } catch (e) {
        return { items: [], error: e?.message || 'Orders keyword search failed' };
      }
    }
  },
  catalogKeyword: {
    id: 'catalogKeyword',
    label: 'Catalog • Keyword',
    run: catalogKeyword,
  },
};
