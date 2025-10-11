import { useState } from 'react';

/**
 * useProductSearch - Reusable product search logic
 * Extracted from ProductSearch.jsx for use across components
 */
export function useProductSearch(rawData = []) {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [candidates, setCandidates] = useState([]);

  const searchProducts = async (query) => {
    if (!query || query.trim().length < 2) {
      setCandidates([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        setCandidates([]);
        setLoading(false);
        return;
      }

      const norm = (s) => String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
      const queryNorm = norm(query);

      // Extract product names from CSV line items and search them
      const productMap = new Map(); // productName -> {count, score, items}

      rawData.forEach(row => {
        const fullProductName = row["Product Name"] || row.product_name || '';
        if (!fullProductName) return;

        // Extract base product name (remove variant suffix like " - Color - Size")
        const productBase = fullProductName.split(' - ')[0] || fullProductName;
        const productNorm = norm(productBase);

        let score = 0;

        // Exact match gets highest score
        if (productNorm === queryNorm) {
          score = 1000;
        }
        // Starts with query gets high score
        else if (productNorm.startsWith(queryNorm)) {
          score = 500;
        }
        // Contains all words but not exact/starts-with gets lower score
        else {
          const words = queryNorm.split(' ').filter(Boolean);
          let wordMatches = 0;
          for (const w of words) if (productNorm.includes(w)) wordMatches++;
          // Only include if ALL words match, but prioritize shorter titles (more specific)
          if (wordMatches === words.length) {
            score = 100 - productNorm.length; // Shorter titles score higher
          }
        }

        if (score > 0) {
          const existing = productMap.get(productBase) || { count: 0, score: -Infinity, items: [] };
          productMap.set(productBase, {
            count: existing.count + 1,
            score: Math.max(existing.score, score),
            items: [...existing.items, row]
          });
        }
      });

      // Convert to array and sort by score/count
      const items = Array.from(productMap.entries())
        .map(([title, meta]) => ({
          title,
          count: meta.count,
          score: meta.score,
          items: meta.items // Keep reference to original line items
        }))
        .sort((a,b)=> (b.score !== a.score) ? (b.score - a.score) : (b.count - a.count))
        .slice(0, 100);

      setCandidates(items);
    } catch (e) {
      setError(e?.message || 'Failed to search products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchText(value);
    if (value.trim().length >= 2) {
      searchProducts(value);
    } else if (value === '') {
      setCandidates([]);
      setError(null);
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setCandidates([]);
    setError(null);
    setLoading(false);
  };

  return {
    searchText,
    setSearchText: handleSearchChange,
    clearSearch,
    candidates,
    loading,
    error
  };
}
