import React, { useEffect, useState } from 'react';

import MetricOverview from "../filters/metric/MetricOverview.jsx";
import MetricSelection from "../filters/metric/MetricSelection.jsx";

// MetricPanel: container that switches between metric sub-panels with animation.
// Receives panelCommand from toolbar and relays to active subpanel.
export default function MetricPanel({ panelCommand, onPanelStateChange, resetNonce, query, draft, onEdit, onCommand, initialSection }) {
  // Track if we hydrated from storage so we can ignore a stale initial command without __ts
  const initFromStorage = React.useRef(false);
  const [activeSection, setActiveSection] = useState(() => {
    // 1) explicit initialSection from parent (last known)
    if (initialSection) return initialSection;
    try {
      const saved = sessionStorage.getItem('metricPanelActiveSection');
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
        console.debug('[MetricPanel] showSection ->', target);
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
    onPanelStateChange?.({ metricActiveSection: activeSection });
    try { sessionStorage.setItem('metricPanelActiveSection', activeSection); } catch {}
  }, [activeSection]);

  return (
    <div className="w-full">
      {activeSection === 'overview' && (
        <div>
          <MetricOverview
            draft={draft}
            query={query}
            onPanelStateChange={handleChildState}
            onEdit={(section) => { if (section && section !== activeSection) setActiveSection(section); onEdit?.(section); }}
            panelCommand={panelCommand}
          />
        </div>
      )}

      {activeSection === 'selection' && (
        <div>
          <MetricSelection
            draft={draft}
            query={query}
            onPanelStateChange={handleChildState}
            panelCommand={panelCommand}
          />
        </div>
      )}
    </div>
  );
}