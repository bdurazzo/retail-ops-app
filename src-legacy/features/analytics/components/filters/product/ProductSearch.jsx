import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX } from '@tabler/icons-react';
// ProductSearch panel: submit-only search using Catalog (confirm exact product names)
import { CatalogRepository } from '../../../repositories/CatalogRepository.js';
import Table from '../../tables/Table.jsx';

export default function ProductSearch({ selected = [], onRemove, onPanelStateChange, query, panelCommand }) {
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
        // Use repository search first; if empty, fall back to local title scan
        let products = await CatalogRepository.searchProducts(q, {});
        console.debug('[ProductSearch] repo search count:', Array.isArray(products) ? products.length : 'invalid');
        if (!products || products.length === 0) {
          const { products: all } = await CatalogRepository.loadCurrentCatalog();
          console.debug('[ProductSearch] fallback scan over catalog count:', all?.length ?? 0);
          const norm = (s) => String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
          const queryNorm = norm(q);
          
          // More precise matching: prefer exact matches, then starts-with, then contains
          products = all
            .map(p => {
              const titleNorm = norm(p.title);
              let score = 0;
              
              // Exact match gets highest score
              if (titleNorm === queryNorm) {
                score = 1000;
              }
              // Starts with query gets high score  
              else if (titleNorm.startsWith(queryNorm)) {
                score = 500;
              }
              // Contains all words but not exact/starts-with gets lower score
              else {
                const words = queryNorm.split(' ').filter(Boolean);
                let wordMatches = 0;
                for (const w of words) if (titleNorm.includes(w)) wordMatches++;
                // Only include if ALL words match, but prioritize shorter titles (more specific)
                if (wordMatches === words.length) {
                  score = 100 - titleNorm.length; // Shorter titles score higher
                }
              }
              
              return score > 0 ? { ...p, _score: score } : null;
            })
            .filter(Boolean)
            .sort((a, b) => b._score - a._score); // Sort by score descending
          
          console.debug('[ProductSearch] fallback matched count:', products.length);
          console.debug('[ProductSearch] top matches:', products.slice(0, 3).map(p => `${p.title} (${p._score})`));
        }
        // Group by exact catalog title and collect ax_item_numbers for ID bridging
        const m = new Map(); // title -> {count, score, ax_item_numbers}
        for (const p of products) {
          const t = (p.title || '').trim(); if (!t) continue;
          const s = Number(p._score || 0);
          const axNum = p.extended_attributes?.ax_item_number || null;
          const prev = m.get(t) || { count: 0, score: -Infinity, ax_item_numbers: new Set() };
          const next = { 
            count: prev.count + 1, 
            score: Math.max(prev.score, s),
            ax_item_numbers: new Set([...prev.ax_item_numbers, axNum].filter(Boolean))
          };
          m.set(t, next);
        }
        const items = Array.from(m.entries())
          .map(([title, meta]) => ({ 
            title, 
            count: meta.count, 
            score: meta.score,
            ax_item_numbers: Array.from(meta.ax_item_numbers)
          }))
          .sort((a,b)=> (b.score !== a.score) ? (b.score - a.score) : (b.count - a.count))
          .slice(0, 100);
        console.debug('[ProductSearch] grouped candidates:', items.length, 'first:', items[0]?.title);
        console.debug('[ProductSearch] aliveRef.current:', aliveRef.current);
        // Always set candidates even if component might unmount - better to show results
        setCandidates(items); 
        setChecks(new Set()); // Start with nothing selected
        console.debug('[ProductSearch] Set candidates successfully with', items.length, 'items');
      } catch (e) {
        console.error('[ProductSearch] Error during search:', e);
        if (aliveRef.current) {
          setError(e?.message || 'Failed to load catalog');
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
    } else if (panelCommand?.type === 'searchInput' && (panelCommand.value || '') === '') {
      // Only clear if this is an explicit user clear action (not just panel switches)
      const ts = Number(panelCommand.__ts || 0);
      if (ts && lastSubmitTsRef.current && ts < lastSubmitTsRef.current) {
        console.debug('[ProductSearch] ignoring stale empty searchInput after submit ts=', ts, 'lastSubmit=', lastSubmitTsRef.current);
        return;
      }
      // Only clear if timestamp is recent (within 1 second) to avoid clearing on panel switches
      const now = Date.now();
      if (!ts || (now - ts) > 1000) {
        console.debug('[ProductSearch] ignoring old empty searchInput - likely from panel switch');
        return;
      }
      // Clear results when user explicitly clears recently
      console.debug('[ProductSearch] clearing results due to explicit user clear ts=', ts, 'lastSubmit=', lastSubmitTsRef.current);
      setSearchText('');
      setCandidates([]);
      setChecks(new Set());
      setError(null);
      setLoading(false);
    }
    // Do not mark as aborted on re-renders; only guard on unmount via aliveRef
    return () => {};
  }, [panelCommand?.type, panelCommand?.value, panelCommand?.__ts, query?.time?.startYYYYMM, query?.time?.endYYYYMM]);

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
      return n; 
    });
  };
  const selectAll = () => {
    console.log('Select all called');
    setChecks(new Set(candidates.map(c=>c.title)));
  };
  const clearAll = () => {
    console.log('Clear all called');
    setChecks(new Set());
  };

  // Convert candidates data to Table.jsx format
  const tableData = useMemo(() => {
    if (!candidates?.length) {
      return {
        columnKeys: ["Product Name", "Count"],
        displayLabels: ["Product Name", "Count"],
        rows: [],
        totals: {},
        rowCount: 0,
        columnCount: 2
      };
    }

    const rows = candidates.map((c, i) => ({
      "#": i + 1,
      "Select": checks.has(c.title),
      "Product Name": c.title,
      "Count": c.count
    }));

    return {
      columnKeys: ["Select", "Product Name", "Count"],
      displayLabels: ["", "Product Name", "Count"],
      rows,
      totals: { "Count": candidates.reduce((sum, c) => sum + c.count, 0) },
      rowCount: rows.length,
      columnCount: 3
    };
  }, [candidates, checks]);

  const confirm = () => {
    const selectedCandidates = candidates.filter(c => checks.has(c.title));
    const arr = selectedCandidates.map(c => ({
      title: c.title,
      ax_item_numbers: c.ax_item_numbers || []
    }));
    console.log('🔍 ProductSearch CONFIRM:');
    console.log('  - Total candidates:', candidates.length);
    console.log('  - Current checks set:', Array.from(checks));
    console.log('  - Selected candidates:', selectedCandidates);
    console.log('  - Sending product objects with ax_item_numbers:', arr);
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
    <div className="w-full">
      {/* Remove height-collapsing animation to avoid state wipes; keep content always visible */}
      <div>
          <div className="bg-white px-4 py-1 space-y-3">
            {selected && selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((p, idx) => {
                  const key = p.product_id || p.sku || idx;
                  const label = p.title || p.product_id || p.sku;
                  return (
                    <span key={`chip-${key}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      <span className="max-w-[220px] truncate" title={label}>{label}</span>
                      <button
                        className="text-gray-500 hover:text-gray-700"
                        title="Remove"
                        onClick={() => onRemove?.(p.product_id || p.sku || p.title)}
                      >
                        <IconX size={14} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {/* Submit-only search results table (confirm here, then jump to Overview)
                Render if we have text, or candidates, or are loading (robust to stale clears) */}
            {(searchText || candidates.length > 0 || loading) && (
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
                        maxBodyHeight={140}
                        firstColWidth={45}
                        metricColWidth={100}
                        headerHeight={35}
                        rowHeight={55}
                        footerHeight={35}
                        containerBorder=""
                        containerShadow=""
                        containerRounded="rounded-lg"
                        containerClasses=""
                        disableSorting={true}
                        columnWidths={{
                          "Product Name": 163,
                          "Count": 70
                        }}
                        headerAlignment="center"
                        bodyAlignment="center"
                        footerAlignment="center"
                        columnAlignments={{
                          "Count": "center"
                        }}
                        customCellRenderer={{
                          "Select": (value, row) => (
                            <input 
                              type="checkbox" 
                              checked={!!value}
                              onChange={() => toggle(row["Product Name"])}
                              className="cursor-pointer"
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
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-2">
                        <button className="text-[11px] text-gray-700" onClick={backToOverview}>Back</button>
                        <button className="text-[11px] text-gray-700" onClick={clearSelected}>Clear Selected</button>
                      </div>
                      <button className="text-[11px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700" onClick={confirm}>Confirm</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
