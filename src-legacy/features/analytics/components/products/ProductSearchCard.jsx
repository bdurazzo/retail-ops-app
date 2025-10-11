import React, { useEffect, useMemo, useState } from 'react';
import { CatalogRepository } from '../../repositories/CatalogRepository.js';

export default function ProductSearchCard({ title, time }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ skus: [], colors: [], sizes: [] });
  const [sel, setSel] = useState({ colors: new Set(), sizes: new Set() });

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        // Load catalog (cached) and build variants strictly for the confirmed product name
        const { products } = await CatalogRepository.loadCurrentCatalog();
        const rawTitle = String(title || '').trim();
        const titleKey = rawTitle.toUpperCase();

        // 1) Prefer exact title matches (no guessing). This prevents leaking variants from similarly named products.
        const exactMatches = products.filter(p => String(p.title || '').trim().toUpperCase() === titleKey);
        if (exactMatches.length === 0) {
          // Fallback: try a narrowed style+category grouping seeded from the text
          const low = titleKey.toLowerCase();
          const candidates = products.filter(p => (p.title && p.title.toLowerCase().includes(low)) || (p.style && String(p.style).toLowerCase().includes(low)));
          if (candidates.length === 0) {
            if (!abort) {
              setError('No matching product found in catalog. Ensure production catalog CSV is available.');
              setData({ skus: [], colors: [], sizes: [] });
            }
            return;
          }
          // Choose dominant style and category among candidates to avoid cross-category pollution (e.g., footwear sizes in jackets)
          const styleCounts = new Map();
          const styleCatCounts = new Map(); // key: style::category
          for (const p of candidates) {
            const s = (p.style || '').trim();
            const c = (p.category || '').trim();
            if (s) styleCounts.set(s, (styleCounts.get(s) || 0) + 1);
            if (s && c) {
              const k = `${s}::${c}`;
              styleCatCounts.set(k, (styleCatCounts.get(k) || 0) + 1);
            }
          }
          let group = [];
          if (styleCatCounts.size > 0) {
            const topSC = Array.from(styleCatCounts.entries()).sort((a,b)=> b[1]-a[1])[0][0];
            const [topStyle, topCat] = topSC.split('::');
            group = products.filter(p => (p.style || '').trim() === topStyle && (p.category || '').trim() === topCat);
          } else if (styleCounts.size > 0) {
            const topStyle = Array.from(styleCounts.entries()).sort((a,b)=> b[1]-a[1])[0][0];
            // If we lack category signal, at least constrain by style
            group = products.filter(p => (p.style || '').trim() === topStyle);
          } else {
            group = candidates;
          }
          const skus = Array.from(new Set(group.map(g => g.sku).filter(Boolean))).map(v => ({ value: v }));
          const colors = Array.from(new Set(group.map(g => g.color).filter(Boolean))).map(v => ({ value: v }));
          const sizes = Array.from(new Set(group.map(g => g.size).filter(Boolean))).map(v => ({ value: v }));
          if (!abort) setData({ skus, colors, sizes });
          return;
        }
        // 2) Exact title path: restrict strictly to exact title, and keep a single category to avoid leaks
        // Pick dominant category among exact matches
        const catCounts = new Map();
        for (const p of exactMatches) {
          const c = (p.category || '').trim();
          catCounts.set(c, (catCounts.get(c) || 0) + 1);
        }
        const topCategory = Array.from(catCounts.entries()).sort((a,b)=> b[1]-a[1])[0][0];
        const group = exactMatches.filter(p => (p.category || '').trim() === topCategory);
        if (group.length === 0) {
          if (!abort) {
            setError('No matching product found in catalog. Ensure production catalog CSV is available.');
            setData({ skus: [], colors: [], sizes: [] });
          }
          return;
        }
        const skus = Array.from(new Set(group.map(g => g.sku).filter(Boolean))).map(v => ({ value: v }));
        const colors = Array.from(new Set(group.map(g => g.color).filter(Boolean))).map(v => ({ value: v }));
        const sizes = Array.from(new Set(group.map(g => g.size).filter(Boolean))).map(v => ({ value: v }));
        if (!abort) setData({ skus, colors, sizes });
      } catch (e) {
        if (!abort) setError(e?.message || 'Failed to load');
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [title]);

  // Derive a style-level SKU by collapsing variant-specific suffixes.
  // Heuristic: take the common prefix of the first two dash-separated segments
  // across all matching SKUs (e.g., F1420266330-1 from F1420266330-1-ForGrn-M-USA).
  const styleSku = useMemo(() => {
    const list = (data?.skus || []).map(x => x.value).filter(Boolean);
    if (!list.length) return '—';
    const segs = list.map(s => String(s).split('-'));
    let base = segs[0].slice(0, 2);
    for (let i = 1; i < segs.length && base.length > 0; i++) {
      for (let j = 0; j < base.length; j++) {
        if (segs[i][j] !== base[j]) { base = base.slice(0, j); break; }
      }
    }
    if (base.length >= 2) return base.join('-');
    if (base.length === 1) return base[0];
    const first = segs[0];
    return first && first.length ? first[0] : '—';
  }, [data]);
  const colors = useMemo(() => (data?.colors || []).map(x => x.value).filter(Boolean), [data]);
  const sizes = useMemo(() => (data?.sizes || []).map(x => x.value).filter(Boolean), [data]);

  // Size sorting helpers: XS < S < M < L < XL < XXL < XXXL, numeric ascending, others alpha
  const alphaOrder = ['XXXS','XXS','XS','S','M','L','XL','XXL','XXXL','XXXXL','One Size','OS','OSFA'];
  const sizeRank = (s) => {
    const v = String(s || '').toUpperCase();
    // numeric
    const num = parseInt(v, 10);
    if (!isNaN(num)) return [0, num];
    const ai = alphaOrder.indexOf(v);
    if (ai !== -1) return [1, ai];
    // Heuristic: handle like "M/L" etc.
    if (v.includes('/')) {
      const parts = v.split('/');
      const r = Math.min(...parts.map(p => sizeRank(p)[1] ?? 999));
      return [1, r];
    }
    return [2, v];
  };
  const sortedSizes = useMemo(() => sizes.slice().sort((a,b) => {
    const ra = sizeRank(a); const rb = sizeRank(b);
    if (ra[0] !== rb[0]) return ra[0] - rb[0];
    if (ra[1] < rb[1]) return -1; if (ra[1] > rb[1]) return 1; return String(a).localeCompare(String(b));
  }), [sizes]);

  // Separate modifier sizes (Long/Regular/Short/Tall/Super...) into a second row for readability
  const modifierKeywords = ['LONG','REGULAR','SHORT','TALL','SUPER'];
  const hasModifier = (s) => modifierKeywords.some(k => String(s).toUpperCase().includes(k));
  const baseSizes = useMemo(() => sortedSizes.filter(s => !hasModifier(s)), [sortedSizes]);
  const modSizes = useMemo(() => sortedSizes.filter(s => hasModifier(s)), [sortedSizes]);
  const modifiersList = useMemo(() => {
    const set = new Set();
    modSizes.forEach(s => modifierKeywords.forEach(k => { if (String(s).toUpperCase().includes(k)) set.add(k); }));
    return Array.from(set);
  }, [modSizes]);

  const toggle = (group, value) => setSel(prev => {
    const next = { ...prev, [group]: new Set(prev[group]) };
    if (next[group].has(value)) next[group].delete(value); else next[group].add(value);
    return next;
  });
  const selectAllGroup = (group, values) => setSel(prev => ({ ...prev, [group]: new Set(values) }));
  const isAllSelected = (group, values) => (sel[group]?.size ?? 0) === values.length && values.length > 0;

  // Apply functionality removed - state managed locally, applied via central button

  return (
    <div className="border border-gray-200 rounded bg-white">
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="text-sm font-medium text-gray-900">{title || '—'}</div>
        <div className="mt-1 text-[11px] text-gray-600">SKU: {loading ? '…' : (error ? '—' : styleSku)}</div>
      </div>
      <div className="p-3 space-y-3">
        {error && <div className="text-xs text-red-600">{error}</div>}
        {/* colors */}
        <div>
          <div className="text-[11px] text-gray-600 mb-1 flex items-center gap-2">
            <span>color:</span>
            <button
              className={`text-[11px] px-1.5 py-0.5 rounded border ${isAllSelected('colors', colors) ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
              onClick={() => selectAllGroup('colors', colors)}
              disabled={!colors.length}
              title="Select all colors"
            >
              ALL
            </button>
            <button
              className="text-[11px] px-1.5 py-0.5 rounded border bg-gray-50 border-gray-200 text-gray-800"
              onClick={() => selectAllGroup('colors', [])}
              disabled={!colors.length}
              title="Clear color selections"
            >
              NONE
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(loading ? [] : colors).map((c, i) => (
              <button
                key={`c-${i}`}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${sel.colors.has(c) ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                onClick={() => toggle('colors', c)}
                title={c}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        {/* sizes */}
        <div>
          <div className="text-[11px] text-gray-600 mb-1 flex items-center gap-2">
            <span>size:</span>
            <button
              className={`text-[11px] px-1.5 py-0.5 rounded border ${isAllSelected('sizes', sortedSizes) ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
              onClick={() => selectAllGroup('sizes', sortedSizes)}
              disabled={!sortedSizes.length}
              title="Select all sizes"
            >
              ALL
            </button>
            <button
              className="text-[11px] px-1.5 py-0.5 rounded border bg-gray-50 border-gray-200 text-gray-800"
              onClick={() => selectAllGroup('sizes', [])}
              disabled={!sortedSizes.length}
              title="Clear size selections"
            >
              NONE
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(loading ? [] : baseSizes).map((s, i) => (
              <button
                key={`s-${i}`}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${sel.sizes.has(s) ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                onClick={() => toggle('sizes', s)}
                title={s}
              >
                {s}
              </button>
            ))}
          </div>
          {modSizes.length > 0 && (
            <div className="mt-2">
              <div className="text-[11px] text-gray-600 mb-1">length:</div>
              <div className="flex flex-wrap gap-1">
                {modifiersList.map((m, i) => (
                  <span key={`m-${i}`} className="text-[10px] px-1.5 py-0.5 rounded border bg-gray-50 border-gray-200 text-gray-800">{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Apply button removed - use central Apply button in control panel */}
      </div>
    </div>
  );
}
