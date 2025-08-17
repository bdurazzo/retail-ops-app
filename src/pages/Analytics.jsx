// ----------------------------------------------
// Analytics.jsx – Full dashboard UI shell layout
// ----------------------------------------------

import React, { useState, useEffect } from "react";
// Import React so we can write components and JSX

// Import all the visual shell components for the page
import ChartTabs from "../features/analytics/components/ChartTabs";
import TabDropPanel from "../features/analytics/components/TabDropPanel";
import AnalyticsChart from "../features/analytics/components/AnalyticsChart";
import GeneratedTable from "../features/analytics/components/GeneratedTable";
import { getTableForKPI } from "../features/analytics/registry/tableDataRegistry.js";

export default function Analytics() {
  // Functional React component — the core screen layout
  const [activeTab, setActiveTab] = useState("null");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [lastTab, setLastTab] = useState("TAB 1");
  const [table, setTable] = useState(null);
  const [err, setErr] = useState(null);
  const [sortKey, setSortKey] = useState("Net Revenue");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const t = await getTableForKPI("top_aov_prod", {
          period: "2025-07",
          limit: 200,
          sort: { key: sortKey, dir: sortDir },
        });
        if (alive) setTable(t);
      } catch (e) {
        if (alive) setErr(e?.message || String(e));
      }
    })();
    return () => { alive = false; };
  }, [sortKey, sortDir]);
  const handleSort = (key, dir) => {
    setSortKey(key);
    setSortDir(dir);
  };

  

  return (
    <div className="h-full flex flex-col px-4 py-6 relative">
      {/* 
        h-full        → fills vertical space of parent container
        flex flex-col → stacks all children vertically
        px-4 py-6     → padding inside the page (1rem left/right, 1.5rem top/bottom)
        relative      → anchors dropdowns or overlays that position absolutely inside
      */}

      {/* Page Title Header */}
      <h1 className="text-xl font-bold mb-4">Data Insights</h1>
      {/* 
        text-xl    → extra large text size (1.25rem)
        font-bold  → bold text weight
        mb-4       → margin below title (1rem)
      */}

      {/* Chart Tab Bar + Drop Panel */}
      <div className="relative z-60 mb-6">
        {/* 
          relative → anchors the dropdown panel under the tabs
          z-40     → ensures this sits on top of charts or other elements
          mb-6     → spacing below (1.5rem)
        */}

        {/* Static segmented tab bar */}
        <ChartTabs
          activeTab={activeTab}
          setActiveTab={(newTab) => {
            if (newTab === null) {
              // Case: reopen previously closed tab
              setActiveTab(lastTab);
              setIsPanelOpen(true);
            } else if (newTab === activeTab) {
              // Case: clicked same tab again → close
              setIsPanelOpen(false);
              setActiveTab(null);
            } else {
              // Always roll up, switch, then roll down — whether panel was open or not
              setActiveTab(newTab);
              setIsPanelOpen(false);
              setTimeout(() => {
                setLastTab(newTab);
                
                setIsPanelOpen(true);
              }, 150);
          }
        }}
        />

        {/* Drop panel shell (shows content passed as children) */}
        <TabDropPanel 
          isOpen={isPanelOpen} 
          onClose={() => setIsPanelOpen(false)}>
          <div className="space-y-2">
            {/* 
              space-y-2 → vertical spacing between the two <p> tags (0.5rem)
            */}
            <p className="text-sm text-gray-500">Filters go here (static for now).</p>
            <p className="text-sm text-gray-500">Panel can later change based on tab.</p>
          </div>
        </TabDropPanel>
      </div>

      {/* Analytics Chart Block */}
      <div className="mb-6">
        <AnalyticsChart />
        {/* 
          mb-6 → space below chart before table
        */}
      </div>

      {/* Table Block (scroll context managed by GeneratedTable) */}
      <div className="flex-1 relative">
        {/* Let GeneratedTable control its own internal scroll bounds. */}
        <div className="absolute inset-0">
          <GeneratedTable
            table={table || { columnKeys: [], rows: [], totals: {} }}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </div>
      </div>
    </div>
    
  );
}