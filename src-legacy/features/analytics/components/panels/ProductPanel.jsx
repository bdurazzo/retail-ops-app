import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import Overview from "../filters/product/Overview.jsx";
import ProductSearch from "../filters/product/ProductSearch.jsx";
import SearchBar from "../../../../components/SearchBar.jsx";
// Future sections
// import Categories from "../filters/product/Categories.jsx";
// import Attributes from "../filters/product/Attributes.jsx";

// ProductPanel: container that switches between product sub-panels with animation.
// Receives panelCommand from toolbar ProductControls and relays to active subpanel.
export default function ProductPanel({ panelCommand, onPanelStateChange, resetNonce, query, draft, onEdit, onCommand, initialSection, suggestions = [], loading = false, error = null }) {
  // Track if we hydrated from storage so we can ignore a stale initial command without __ts
  const initFromStorage = React.useRef(false);
  const [activeSection, setActiveSection] = useState(() => {
    // 1) explicit initialSection from parent (last known)
    if (initialSection) return initialSection;
    try {
      const saved = sessionStorage.getItem('productPanelActiveSection');
      if (saved) { initFromStorage.current = true; return saved; }
    } catch {}
    if (panelCommand?.type === 'showSection' && panelCommand?.section) return panelCommand.section;
    return 'overview';
  });
  const [lastCmdTs, setLastCmdTs] = useState(0);
  const [lastCmdKey, setLastCmdKey] = useState('');

  // Intentionally no automatic reset on tab switches; preserve last open section
  useEffect(() => { /* noop on resetNonce to preserve section */ }, [resetNonce]);

  useEffect(() => {
    if (!panelCommand || !panelCommand.type) return;
    const ts = panelCommand.__ts ? Number(panelCommand.__ts) : 0;
    const key = `${panelCommand.type}:${panelCommand.section || ''}:${panelCommand.menu || ''}`;
    // If we restored from storage and this command lacks a timestamp, skip it once
    if (!ts && initFromStorage.current) { initFromStorage.current = false; return; }
    // Ignore only truly stale duplicates; allow same-timestamp if the command differs
    if (ts && ts < lastCmdTs) return;
    if (ts && ts === lastCmdTs && key === lastCmdKey) return;
    if (panelCommand.type === 'showSection') {
      const target = panelCommand.section || 'overview';
      if (target !== activeSection) {
        console.debug('[ProductPanel] showSection ->', target);
        setActiveSection(target);
      }
      if (ts) { setLastCmdTs(ts); setLastCmdKey(key); }
    } else if (panelCommand.type === 'toggleSection') {
      const desired = panelCommand.section || 'overview';
      const next = (activeSection === desired) ? 'overview' : desired;
      if (next !== activeSection) setActiveSection(next);
      if (ts) { setLastCmdTs(ts); setLastCmdKey(key); }
    }
    initFromStorage.current = false;
  }, [panelCommand, activeSection, lastCmdTs, lastCmdKey]);

  // Forward state upward and handle local section switches immediately
  const handleChildState = (state) => {
    if (state?.switchSection) {
      const target = state.switchSection || 'overview';
      if (target !== activeSection) setActiveSection(target);
    }
    onPanelStateChange?.({ activeSection, ...state });
  };

  // Announce section changes namespaced so other panels don't stomp it
  useEffect(() => {
    onPanelStateChange?.({ productActiveSection: activeSection });
    try { sessionStorage.setItem('productPanelActiveSection', activeSection); } catch {}
  }, [activeSection]);

  return (
    <div className="w-full">
      {activeSection === 'overview' && (
        <div>
          <Overview
            draft={draft}
            query={query}
            onPanelStateChange={handleChildState}
            onEdit={(section) => { if (section && section !== activeSection) setActiveSection(section); onEdit?.(section); }}
            panelCommand={panelCommand}
          />
        </div>
      )}

      {activeSection === 'styles' && (
        <div>
          <div className="bg-white px-4 p-3">
            <SearchBar
              value={draft?.text || ''}
              onChange={(v) => onCommand?.({ type: 'searchInput', value: v, __ts: Date.now() })}
              onSubmit={(v) => { setActiveSection('styles'); onCommand?.({ type: 'searchSubmit', value: v, __ts: Date.now() }); }}
              onClear={() => onCommand?.({ type: 'searchInput', value: '', __ts: Date.now() })}
              autoFocus={true}
              suggestions={[]}
              loading={false}
              error={null}
              placeholder={'Search product name…'}
            />
          </div>
          <ProductSearch
            onPanelStateChange={handleChildState}
            selected={(draft?.selectedProducts) || []}
            onRemove={(key) => onPanelStateChange?.({ removeCandidate: key })}
            query={query}
            panelCommand={panelCommand}
          />
        </div>
      )}
    </div>
  );
}
