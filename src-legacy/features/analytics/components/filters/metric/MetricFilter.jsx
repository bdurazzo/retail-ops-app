import React, { useCallback, useEffect, useMemo, useState } from "react";
import MetricPanel from "../../panels/MetricPanel.jsx";

// Acts like ProductFilter: container that registers Apply and bridges commands/state
export default function MetricFilter({ onRegister, resetNonce, query, panelCommand, onPanelStateChange, panelState }) {
  // Metric draft (accumulates selections from subpanels)
  const [draft, setDraft] = useState(() => {
    try {
      const saved = sessionStorage.getItem('metricDraft');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      selectedMetrics: [],
      metricSettings: {},
    };
  });

  // Local command bridge so Overview can request section changes
  const [localCmd, setLocalCmd] = useState(null);
  const mergedCommand = useMemo(() => localCmd || panelCommand, [localCmd, panelCommand]);

  // Ensure one-shot local commands don't block future toolbar commands
  useEffect(() => {
    if (!localCmd) return;
    const t = setTimeout(() => setLocalCmd(null), 0);
    return () => clearTimeout(t);
  }, [localCmd]);

  // Register Apply: commit selected metrics
  useEffect(() => {
    if (!onRegister) return;
    onRegister(() => ({
      type: 'metric',
      config: {
        metric: draft.selectedMetrics
      },
      isValid: draft.selectedMetrics.length > 0
    }));
  }, [onRegister, draft]);

  // Persist draft so UI doesn't reset when panel remounts
  useEffect(() => {
    try { sessionStorage.setItem('metricDraft', JSON.stringify(draft)); } catch {}
  }, [draft]);

  const handlePanelState = useCallback((state) => {
    console.debug('[MetricFilter] handlePanelState:', state);
    setDraft((prev) => {
      const next = { ...prev };
      
      // Handle metric selection changes
      if (state?.selectedMetrics !== undefined) {
        next.selectedMetrics = Array.isArray(state.selectedMetrics) ? state.selectedMetrics : [];
      }

      // Handle individual metric toggle
      if (state?.toggleMetric) {
        const { metricId, isSelected } = state.toggleMetric;
        if (isSelected && !next.selectedMetrics.includes(metricId)) {
          next.selectedMetrics = [...next.selectedMetrics, metricId];
        } else if (!isSelected) {
          next.selectedMetrics = next.selectedMetrics.filter(id => id !== metricId);
        }
      }

      // Handle metric settings
      if (state?.metricSettings) {
        next.metricSettings = { ...next.metricSettings, ...state.metricSettings };
      }

      return next;
    });

    onPanelStateChange?.(state);
    if (state?.switchSection) {
      console.debug('[MetricFilter] switching section to:', state.switchSection);
      setLocalCmd({ type: 'showSection', section: state.switchSection, __ts: Date.now() });
    }
  }, [onPanelStateChange]);

  const handleEdit = (section) => {
    setLocalCmd({ type: 'showSection', section, __ts: Date.now() });
  };

  // Sync with external query changes (like from reset)
  useEffect(() => {
    if (query?.metric) {
      setDraft(prev => ({ ...prev, selectedMetrics: query.metric }));
    }
  }, [query?.metric, resetNonce]);

  return (
    <MetricPanel
      resetNonce={resetNonce}
      query={query}
      panelCommand={mergedCommand}
      onPanelStateChange={handlePanelState}
      initialSection={panelState?.metricActiveSection}
      draft={draft}
      onEdit={handleEdit}
      onCommand={(cmd) => setLocalCmd({ ...cmd, __ts: Date.now() })}
    />
  );
}