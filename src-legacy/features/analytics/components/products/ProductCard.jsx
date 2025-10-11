import React, { useEffect, useMemo, useState } from 'react';
import { CatalogRepository } from '../../repositories/CatalogRepository.js';

function chooseMainImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const main = images.find(img => Array.isArray(img.tags) && img.tags.some(t => String(t).includes('newstore:main')));
  return (main?.url) || images[0]?.url || null;
}

async function loadGroup({ title, sku }) {
  let { products } = await CatalogRepository.loadCurrentCatalog();
  if (!products || products.length === 0) {
    // Fallback to test dataset in dev
    ({ products } = await CatalogRepository.loadCurrentCatalog(true));
  }
  const low = (title || '').toLowerCase();
  // Filter candidates by title substring match or sku exact
  let candidates = products;
  if (sku) candidates = candidates.filter(p => p.sku && p.sku === sku);
  if (low) candidates = candidates.filter(p => p.title && p.title.toLowerCase().includes(low));
  if (!candidates.length) return null;
  // Group by variant_group_id or title
  const primary = candidates[0];
  const groupId = primary.variant_group_id || primary.title;
  const group = products.filter(p => (p.variant_group_id || p.title) === groupId);
  const colors = Array.from(new Set(group.map(p => p.color).filter(Boolean)));
  const sizes = Array.from(new Set(group.map(p => p.size).filter(Boolean)));
  const variants = group.map(p => ({ sku: p.sku || p.product_id, color: p.color, size: p.size, images: p.images, title: p.title }));
  const imageUrl = chooseMainImage(primary.images) || chooseMainImage(group.find(p => chooseMainImage(p.images))?.images);
  const primarySku = primary.sku || primary.product_id;
  return { title: primary.title, imageUrl, primarySku, colors, sizes, variants };
}

export default function ProductCard({ title, sku }) {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setState({ loading: true, error: null, data: null });
        const data = await loadGroup({ title, sku });
        if (!abort) setState({ loading: false, error: null, data });
      } catch (e) {
        if (!abort) setState({ loading: false, error: e?.message || 'Failed to load product', data: null });
      }
    })();
    return () => { abort = true; };
  }, [title, sku]);

  if (state.loading) return <div className="text-xs text-gray-500">Loading product…</div>;
  if (state.error) return <div className="text-xs text-red-600">{state.error}</div>;
  if (!state.data) return <div className="text-xs text-gray-500">No product found.</div>;

  const { imageUrl, title: name, primarySku, colors, sizes } = state.data;

  return (
    <div className="flex gap-3 p-3 border border-gray-200 rounded bg-white">
      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="object-cover w-full h-full" />
        ) : (
          <div className="text-[10px] text-gray-400">No image</div>
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{name}</div>
        <div className="text-[11px] text-gray-600">SKU: {primarySku || '—'}</div>
        <div className="mt-2 flex gap-6">
          <div>
            <div className="text-[11px] text-gray-500 mb-1">Colors</div>
            <div className="flex flex-wrap gap-1 max-w-[320px]">
              {colors.length ? colors.map((c,i) => (
                <span key={`c-${i}`} className="text-[10px] bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded border border-gray-200">{c}</span>
              )) : <span className="text-[11px] text-gray-400">—</span>}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500 mb-1">Sizes</div>
            <div className="flex flex-wrap gap-1 max-w-[320px]">
              {sizes.length ? sizes.map((s,i) => (
                <span key={`s-${i}`} className="text-[10px] bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded border border-gray-200">{s}</span>
              )) : <span className="text-[11px] text-gray-400">—</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
