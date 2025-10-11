import React, { useCallback, useEffect, useMemo, useState } from "react";
import ProductPanel from "../../panels/ProductPanel.jsx";
import { SEARCH_LENSES } from "./searchLenses.js";

// Acts like TimeFilter: container that registers Apply and bridges commands/state
export default function ProductFilter({ onRegister, resetNonce, query, panelCommand, onPanelStateChange, panelState }) {
  // Product draft (accumulates selections from subpanels)
  const [draft, setDraft] = useState(() => {
    try {
      const saved = sessionStorage.getItem('productDraft');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      text: '',
      categories: ['all'], styles: ['all'], materials: ['all'],
      colors: ['all'], sizes: ['all'], genders: ['all'],
      skus: [], productIds: [], variantGroups: [],
      availableOnly: false,
    };
  });

  // Local command bridge so Overview can request section changes
  const [localCmd, setLocalCmd] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mergedCommand = useMemo(() => localCmd || panelCommand, [localCmd, panelCommand]);

  // Ensure one-shot local commands don't block future toolbar commands
  useEffect(() => {
    if (!localCmd) return;
    const t = setTimeout(() => setLocalCmd(null), 0);
    return () => clearTimeout(t);
  }, [localCmd]);

  // Register Apply: commit draft + selectedProducts from ProductSearch
  useEffect(() => {
    if (!onRegister) return;
    onRegister(() => {
      // Extract ax_item_numbers for ID bridging between catalog and retail data
      const selectedProducts = panelState?.selectedProducts || [];
      const axItemNumbers = [];
      const titleFallbacks = [];
      
      for (const p of selectedProducts) {
        if (Array.isArray(p.ax_item_numbers) && p.ax_item_numbers.length > 0) {
          axItemNumbers.push(...p.ax_item_numbers);
        } else {
          // Fallback to title matching for products without ax_item_numbers
          const title = p.title || p.product_id || p.sku;
          if (title) titleFallbacks.push(title);
        }
      }
      
      return {
        type: 'product',
        config: {
          product: { 
            ...draft, 
            text: draft.text || null,
            // Use ax_item_numbers for ID bridging when available, fallback to titles
            ax_item_numbers: axItemNumbers.length > 0 ? axItemNumbers : null,
            ids: titleFallbacks.length > 0 ? titleFallbacks : null
          }
        },
        isValid: true
      };
    });
  }, [onRegister, draft, panelState?.selectedProducts]);

  // Persist draft so UI doesn't reset when panel remounts
  useEffect(() => {
    try { sessionStorage.setItem('productDraft', JSON.stringify(draft)); } catch {}
  }, [draft]);

  // Notify parent when selectedProducts change
  useEffect(() => {
    if (draft.selectedProducts && onPanelStateChange) {
      console.log('🔧 ProductFilter notifying parent about selectedProducts change:', draft.selectedProducts);
      onPanelStateChange({ selectedProducts: draft.selectedProducts });
    }
  }, [draft.selectedProducts, onPanelStateChange]);

  const handlePanelState = useCallback((state) => {
    console.debug('[ProductFilter] handlePanelState:', state);
    setDraft((prev) => {
      const next = { ...prev };
      if (state?.query !== undefined) next.text = state.query;

      // Bulk add candidates (support both old string format and new object format)
      if (Array.isArray(state?.addCandidates) && state.addCandidates.length) {
        next.selectedProducts = Array.isArray(next.selectedProducts) ? next.selectedProducts.slice() : [];
        for (const candidate of state.addCandidates) {
          // Handle both string format (legacy) and object format (new with ax_item_numbers)
          if (typeof candidate === 'string') {
            const key = candidate;
            if (key && !next.selectedProducts.some(p => (p.product_id || p.sku || p.title) === key)) {
              next.selectedProducts.push({ title: key });
            }
          } else if (candidate && typeof candidate === 'object' && candidate.title) {
            const key = candidate.title;
            if (key && !next.selectedProducts.some(p => (p.product_id || p.sku || p.title) === key)) {
              next.selectedProducts.push({ 
                title: candidate.title,
                ax_item_numbers: candidate.ax_item_numbers || []
              });
            }
          }
        }
      }

      if (state?.clearSelectedProducts) {
        next.selectedProducts = [];
        next.skus = [];
        next.colors = [];
        next.sizes = [];
      }

      // Single add candidate
      if (state?.addCandidate) {
        const { sku, product_id, title } = state.addCandidate;
        if (sku && !next.skus.includes(sku)) next.skus = [...next.skus, sku];
        if (product_id && !next.productIds.includes(product_id)) next.productIds = [...next.productIds, product_id];
        const key = product_id || sku || title;
        next.selectedProducts = Array.isArray(next.selectedProducts) ? next.selectedProducts : [];
        if (key && !next.selectedProducts.some(p => (p.product_id || p.sku || p.title) === key)) {
          next.selectedProducts = [...next.selectedProducts, { sku, product_id, title }];
        }
      }

      if (state?.addFacets) {
        const { title, skus = [], colors = [], sizes = [] } = state.addFacets;
        if (title) next.text = title;
        // Replace arrays instead of adding to them - this represents the user's current selection
        if (Array.isArray(skus)) {
          next.skus = skus.filter(Boolean);
        }
        if (Array.isArray(colors)) {
          next.colors = colors.filter(Boolean);
        }
        if (Array.isArray(sizes)) {
          next.sizes = sizes.filter(Boolean);
        }
      }

      if (state?.removeCandidate) {
        const key = state.removeCandidate;
        next.skus = next.skus.filter(s => s !== key);
        next.productIds = next.productIds.filter(id => id !== key);
        next.selectedProducts = (next.selectedProducts || []).filter(p => (p.product_id || p.sku || p.title) !== key);
      }
      return next;
    });

    onPanelStateChange?.(state);
    if (state?.switchSection) {
      console.debug('[ProductFilter] switching section to:', state.switchSection);
      setLocalCmd({ type: 'showSection', section: state.switchSection, __ts: Date.now() });
    }
  }, [onPanelStateChange]);

  const handleEdit = (section) => {
    setLocalCmd({ type: 'showSection', section, __ts: Date.now() });
  };

  // Keep controlled input value in sync (submit-only flow)
  useEffect(() => {
    if (!mergedCommand) return;
    if (mergedCommand.type === 'searchInput' || mergedCommand.type === 'searchSubmit') {
      setDraft((prev) => ({ ...prev, text: mergedCommand.value || '' }));
    }
  }, [mergedCommand]);

  // Disable live suggestions; we render a submit-driven table in Styles now
  useEffect(() => { setSuggestions([]); setLoading(false); setError(null); }, []);

  return (
    <ProductPanel
      resetNonce={resetNonce}
      query={query}
      panelCommand={mergedCommand}
      onPanelStateChange={handlePanelState}
      initialSection={panelState?.productActiveSection}
      draft={draft}
      onEdit={handleEdit}
      onCommand={(cmd) => setLocalCmd({ ...cmd, __ts: Date.now() })}
      suggestions={suggestions}
      loading={loading}
      error={error}
    />
  );
}
