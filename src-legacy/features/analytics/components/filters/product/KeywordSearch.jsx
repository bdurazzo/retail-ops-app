import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSearch } from '@tabler/icons-react';
import { useKeywordSearch } from './useKeywordSearch.js';

// KeywordSearch panel: mirrors Time panel pattern (register/apply, panelCommand bridge, animated content)
export default function KeywordSearch({ onRegister, resetNonce, query, panelCommand, onPanelStateChange, dims }) {
  const [text, setText] = useState('');
  const { loading, error, results } = useKeywordSearch({ text, dims, time: query?.time, debounceMs: 200, limit: 50 });

  // Track active internal section (only 'search' for now)
  const [activeView, setActiveView] = useState('search');

  // simple local debounce for setText -> hook handles the search debounce
  const debounce = (fn, ms = 200) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };
  const debouncedSetText = useMemo(() => debounce(setText, 120), []);

  // React to external commands from ProductControls
  useEffect(() => {
    if (!panelCommand || !panelCommand.type) return;
    if (panelCommand.type === 'searchText') {
      const v = panelCommand.value ?? '';
      setText(v);
    } else if (panelCommand.type === 'showSection') {
      setActiveView(panelCommand.section || 'search');
    }
  }, [panelCommand]);

  // Emit panel state up (keep toolbar hints in sync)
  useEffect(() => {
    onPanelStateChange?.({ activeSection: 'search', query: text, suggestionsCount: results.length });
  }, [text, results.length]);

  // Register Apply handler (commit to global query)
  useEffect(() => {
    if (!onRegister) return;
    onRegister(() => ({
      type: 'product',
      config: { product: { text: text || null } },
      isValid: true,
    }));
  }, [onRegister, text]);

  // Reset when told
  useEffect(() => {
    setText('');
    // results/error managed by hook; just clear text here
  }, [resetNonce]);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        {activeView === 'search' && (
          <motion.div
            key="keyword-search"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ height: { duration: 0.2, ease: 'easeInOut' }, opacity: { duration: 0.15 } }}
            style={{ overflow: 'hidden' }}
          >
            <div className="bg-white p-3">
              {/* Input */}
              <div className="flex items-center gap-2 mb-3">
                <div className="shrink-0 text-gray-600">
                  <IconSearch size={18} />
                </div>
                <input
                  value={text}
                  onChange={(e) => {
                    const v = e.target.value;
                    debouncedSetText(v);
                  }}
                  placeholder="Search products, styles, materials..."
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              {/* Results */}
              <div className="border-t border-gray-100 pt-2">
                {loading && (
                  <div className="text-xs text-gray-500 py-2">Searching…</div>
                )}
                {error && (
                  <div className="text-xs text-red-600 py-2">{error}</div>
                )}
                {!loading && !error && results.length === 0 && text && text.length >= 2 && (
                  <div className="text-xs text-gray-500 py-2">No matches</div>
                )}
                <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {results.map((p, i) => (
                    <li key={`${p.sku || p.title || ''}-${i}`} className="text-xs text-gray-800 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded px-2 py-1">
                      <span className="truncate">{p.title} {p.color ? `• ${p.color}` : ''} {p.size ? `• ${p.size}` : ''}</span>
                      <button
                        className="text-[11px] text-blue-600 hover:text-blue-800"
                        onClick={() => onPanelStateChange?.({ addCandidate: { sku: p.sku, title: p.title } })}
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
