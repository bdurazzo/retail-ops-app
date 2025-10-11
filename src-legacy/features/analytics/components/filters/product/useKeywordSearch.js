import { useEffect, useMemo, useRef, useState } from 'react';
import { CatalogRepository } from '../../../repositories/CatalogRepository.js';

function useDebouncedCallback(fn, ms = 250) {
  const ref = useRef();
  useEffect(() => () => clearTimeout(ref.current), []);
  return useMemo(() => {
    return (...args) => {
      clearTimeout(ref.current);
      ref.current = setTimeout(() => fn(...args), ms);
    };
  }, [fn, ms]);
}

export function useKeywordSearch({ text, debounceMs = 250, limit = 50 } = {}) {
  const [state, setState] = useState({ loading: false, error: null, results: [] });
  const debounced = useDebouncedCallback(async (t) => {
    if (!t || String(t).trim().length < 2) {
      setState({ loading: false, error: null, results: [] });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const products = await CatalogRepository.searchProducts(String(t), {});
      const items = (products || []).slice(0, limit).map((p) => ({ title: p.title, sku: p.sku || null }));
      setState({ loading: false, error: null, results: items });
    } catch (e) {
      setState({ loading: false, error: e?.message || 'Keyword search failed', results: [] });
    }
  }, debounceMs);

  useEffect(() => {
    debounced(text);
  }, [text]);

  return state; // { loading, error, results }
}
