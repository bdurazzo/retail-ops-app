import React from 'react';
import ProductSearchCard from '../../products/ProductSearchCard.jsx';

export default function ProductFilterOverview({ draft = {}, query, onPanelStateChange }) {
  return (
    <div className="bg-white p-3 space-y-2">
      {Array.isArray(draft.selectedProducts) && draft.selectedProducts.length > 0 ? (
        draft.selectedProducts.map((p) => (
          <div key={`wrap-${p.title || p.sku || 'untitled'}`} className="space-y-1">
            <div className="flex justify-end">
              <button
                className="text-[11px] text-gray-600 hover:text-gray-800"
                onClick={() => onPanelStateChange?.({ removeCandidate: p.product_id || p.sku || p.title })}
                title="Remove this product"
              >Remove</button>
            </div>
            <ProductSearchCard
              key={`psc-${p.title || p.sku || 'untitled'}`}
              title={p.title}
              time={query?.time}
              onApply={({ title, skus, colors, sizes }) => {
                onPanelStateChange?.({ addFacets: { title, skus, colors, sizes } });
              }}
            />
          </div>
        ))
      ) : (
        <div className="text-xs text-gray-500">No products selected yet. Go to Styles, search, select, and confirm to see cards here.</div>
      )}
    </div>
  );
}
