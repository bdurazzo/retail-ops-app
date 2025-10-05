import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX } from '@tabler/icons-react';
// ProductSearch panel: submit-only search using Catalog (confirm exact product names)
// import { CatalogRepository } from '../../../repositories/CatalogRepository.js';
const CatalogRepository = {
  searchProducts: async () => [],
  loadCurrentCatalog: async () => ({ products: [] })
};
import Table from '../../../../../components/Table.jsx';

export default function ProductSearch({ selected = [], onRemove, onPanelStateChange, query, panelCommand, rawData = [] }) {
  // Initialize state from sessionStorage to persist across panel switches
  const [searchText, setSearchText] = useState(() => {
    try {
      return sessionStorage.getItem('productSearchText') || '';
    } catch { return ''; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [candidates, setCandidates] = useState(() => {
    try {
      const saved = sessionStorage.getItem('productSearchCandidates');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [checks, setChecks] = useState(() => {
    try {
      const saved = sessionStorage.getItem('productSearchChecks');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // Sync checks state with selected prop to maintain checkbox state
  useEffect(() => {
    if (selected && Array.isArray(selected)) {
      const selectedTitles = selected.map(p => p.title || p.product_id || p.sku).filter(Boolean);
      setChecks(new Set(selectedTitles));
    } else {
      setChecks(new Set());
    }
  }, [selected]);
  const lastSubmitTsRef = React.useRef(0);
  // Keep an alive flag that only flips on unmount, so transient prop changes
  // (like command being cleared) don't abort in-flight updates.
  const aliveRef = React.useRef(true);

  useEffect(() => {
    return () => { aliveRef.current = false; };
  }, []);

  // Persist state to sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem('productSearchText', searchText); } catch {}
  }, [searchText]);

  useEffect(() => {
    try { sessionStorage.setItem('productSearchCandidates', JSON.stringify(candidates)); } catch {}
  }, [candidates]);

  useEffect(() => {
    try { sessionStorage.setItem('productSearchChecks', JSON.stringify(Array.from(checks))); } catch {}
  }, [checks]);

  useEffect(() => {
    const run = async (q) => {
      if (!q || q.trim().length < 2) { setCandidates([]); setLoading(false); setError(null); return; }
      try {
        setLoading(true); setError(null);
        
        // Search CSV line item data instead of catalog
        console.debug('[ProductSearch] Searching CSV line items data:', rawData?.length ?? 0, 'rows');
        
        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
          console.debug('[ProductSearch] No CSV data available for search');
          setCandidates([]);
          setLoading(false);
          return;
        }
        
        const norm = (s) => String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
        const queryNorm = norm(q);
        
        console.debug('[ProductSearch] Searching for:', queryNorm);
        
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
          
        console.debug('[ProductSearch] CSV search results:', items.length, 'products found');
        console.debug('[ProductSearch] Top matches:', items.slice(0, 3).map(p => `${p.title} (${p.score}, ${p.count} items)`));
        
        // Always set candidates even if component might unmount - better to show results
        setCandidates(items); 
        setChecks(new Set()); // Start with nothing selected
        console.debug('[ProductSearch] Set candidates successfully with', items.length, 'items');
      } catch (e) {
        console.error('[ProductSearch] Error during CSV search:', e);
        if (aliveRef.current) {
          setError(e?.message || 'Failed to search line items');
          setLoading(false);
        }
      } finally {
        // Always clear loading to prevent stuck spinner
        setLoading(false);
      }
    };
    if (panelCommand?.type === 'searchSubmit') {
      const ts = Number(panelCommand.__ts || 0);
      if (ts && ts === lastSubmitTsRef.current) {
        // ignore duplicate replays of the same submit without altering current in-flight state
        return;
      }
      if (ts) lastSubmitTsRef.current = ts;
      const v = panelCommand.value || '';
      console.debug('[ProductSearch] searchSubmit received:', v);
      setSearchText(v);
      setChecks(new Set());
      run(v);
    } else if (panelCommand?.type === 'searchInput') {
      // Real-time search on input changes
      const inputValue = panelCommand.value || '';
      console.debug('[ProductSearch] searchInput received:', inputValue);
      setSearchText(inputValue);
      
      if (inputValue === '') {
        // Clear results when user clears input
        console.debug('[ProductSearch] clearing results due to empty input');
        setCandidates([]);
        setChecks(new Set());
        setError(null);
        setLoading(false);
      } else if (inputValue.trim().length >= 2) {
        // Auto-search when minimum characters reached
        console.debug('[ProductSearch] auto-searching for:', inputValue);
        run(inputValue);
      }
    }
    // Do not mark as aborted on re-renders; only guard on unmount via aliveRef
    return () => {};
  }, [panelCommand?.type, panelCommand?.value, panelCommand?.__ts, query?.time?.startYYYYMM, query?.time?.endYYYYMM, rawData]);

  const toggle = (title) => {
    console.log('Toggle called for:', title);
    setChecks(prev => { 
      const n = new Set(prev); 
      const wasChecked = n.has(title);
      if (wasChecked) {
        n.delete(title);
        console.log('Unchecked:', title);
      } else {
        n.add(title);
        console.log('Checked:', title);
      }
      console.log('New checks set:', Array.from(n));
      
      // Apply filter immediately when checkboxes change
      const selectedCandidates = candidates.filter(c => n.has(c.title));
      const arr = selectedCandidates.map(c => ({
        title: c.title,
        count: c.count,
        items: c.items || []
      }));
      console.log('🔍 ProductSearch REAL-TIME APPLY:', arr);
      onPanelStateChange?.({ addCandidates: arr, applyFilters: true });
      
      return n; 
    });
  };
  const selectAll = () => {
    console.log('Select all called');
    const allTitles = candidates.map(c=>c.title);
    setChecks(new Set(allTitles));
    
    // Apply filter immediately when selecting all
    const arr = candidates.map(c => ({
      title: c.title,
      count: c.count,
      items: c.items || []
    }));
    console.log('🔍 ProductSearch SELECT ALL APPLY:', arr);
    onPanelStateChange?.({ addCandidates: arr, applyFilters: true });
  };
  const clearAll = () => {
    console.log('Clear all called');
    setChecks(new Set());
    
    // Clear filter immediately when clearing all
    console.log('🔍 ProductSearch CLEAR ALL APPLY');
    onPanelStateChange?.({ addCandidates: [], applyFilters: true });
  };

  // Convert candidates data to Table.jsx format
  const tableData = useMemo(() => {
    if (!candidates?.length) {
      return {
        columnKeys: ["Select", "Product Name", "Units"],
        displayLabels: ["", "Product Name", "Units"],
        rows: [],
        totals: {},
        rowCount: 0,
        columnCount: 3
      };
    }

    const rows = candidates.map((c, i) => ({
      "#": i + 1,
      "Select": checks.has(c.title),
      "Product Name": c.title,
      "Units": c.count
    }));

    return {
      columnKeys: ["Select", "Product Name", "Units"],
      displayLabels: ["", "Product Name", "Units"],
      rows,
      totals: { "Units": candidates.reduce((sum, c) => sum + c.count, 0) },
      rowCount: rows.length,
      columnCount: 3
    };
  }, [candidates, checks]);

  const confirm = () => {
    const selectedCandidates = candidates.filter(c => checks.has(c.title));
    const arr = selectedCandidates.map(c => ({
      title: c.title,
      count: c.count,
      items: c.items || [] // Include line item references for filtering
    }));
    console.log('🔍 ProductSearch CONFIRM:');
    console.log('  - Total candidates:', candidates.length);
    console.log('  - Current checks set:', Array.from(checks));
    console.log('  - Selected candidates:', selectedCandidates);
    console.log('  - Sending product objects for line item filtering:', arr);
    console.log('  - Sending to overview:', { addCandidates: arr, switchSection: 'overview' });
    onPanelStateChange?.({ addCandidates: arr, switchSection: 'overview' });
  };

  const clearResults = () => { 
    setCandidates([]); 
    setChecks(new Set()); 
    setSearchText(''); 
    setError(null); 
    // Clear persisted state as well
    try {
      sessionStorage.removeItem('productSearchText');
      sessionStorage.removeItem('productSearchCandidates');
      sessionStorage.removeItem('productSearchChecks');
    } catch {}
  };
  const backToOverview = () => onPanelStateChange?.({ switchSection: 'overview' });
  const clearSelected = () => onPanelStateChange?.({ clearSelectedProducts: true });

  // Debug: trace candidates mutations and incoming commands
  useEffect(() => {
    try {
      console.debug('[ProductSearch] effect run. cmd=', panelCommand?.type, 'val=', panelCommand?.value, 'ts=', panelCommand?.__ts);
    } catch {}
  }, [panelCommand?.type, panelCommand?.value, panelCommand?.__ts]);

  useEffect(() => {
    try { console.debug('[ProductSearch] candidates state now:', candidates.length); } catch {}
  }, [candidates]);

  return (
    <div className="w-full py-2">
      {/* Remove height-collapsing animation to avoid state wipes; keep content always visible */}
      <div>
          <div className="px-5 h-full space-y-3">
            {/* Submit-only search results table (confirm here, then jump to Overview) - ALWAYS SHOW TABLE */}
            <div>
              {loading && <div className="text-xs text-gray-500 animate-pulse">Searching…</div>}
              {error && <div className="text-xs text-red-600">{error}</div>}
              {!loading && !error && (
                <div>
                  <div className="w-full">
                    <Table
                      table={tableData}
                      placeholderRows={candidates.length ? 0 : 3}
                      placeholderCols={0}
                      height="auto"
                      maxBodyHeight={130}
                      firstColWidth={45}
                      metricColWidth={100}
                      headerHeight={35}
                      rowHeight={45}
                      footerHeight={35}
                      containerBorder="border-b"
                      containerShadow="shadow-lg"
                      containerRounded="rounded-xl"
                      containerClasses=""
                      disableSorting={true}
                      columnWidths={{
                        "Product Name": 187,
                        "Units": 70
                      }}
                      headerAlignment="center"
                      bodyAlignment="left"
                      footerAlignment="center"
                      columnAlignments={{
                        "Units": "center"
                      }}
                      customCellRenderer={{
                        "Select": (value, row) => (
                          <input 
                            type="checkbox" 
                            checked={!!value}
                            onChange={() => toggle(row["Product Name"])}
                            className="m-4 cursor-pointer"
                          />
                        )
                      }}
                      customHeaderRenderer={{
                        "Select": () => {
                          const allChecked = candidates.length > 0 && candidates.every(c => checks.has(c.title));
                          return (
                            <input 
                              type="checkbox" 
                              checked={allChecked}
                              onChange={() => {
                                if (allChecked) {
                                  clearAll();
                                } else {
                                  selectAll();
                                }
                              }}
                              className="cursor-pointer"
                              title={allChecked ? "Deselect All" : "Select All"}
                            />
                          );
                        }
                      }}
                    />
                  </div>

                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
