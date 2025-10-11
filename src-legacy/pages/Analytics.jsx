import React, { useState, useRef, useEffect } from "react";

import { useAnalyticsQueryWithVerification } from "../features/analytics/hooks/useAnalyticsQueryWithVerification";
import ProductVerificationPopup from "../features/analytics/components/ProductVerificationPopup";
import { defaultQuery, mergeQueries } from "../features/analytics/dtos/QueryDTO";

// Visual shell components (UI only)
import FilterPanel from "../features/analytics/components/panels/FilterPanel";
import Chart from "../features/analytics/components/charts/Chart";
import Table from "../features/analytics/components/tables/Table";
import TabDisplay from "../features/analytics/components/displays/TabDisplay";
import { PANEL_BY_TAB } from "../features/analytics/components/filters/index.js";

// NEW: Visualization components
import DataToolbar from "../features/analytics/components/visualization/DataToolbar";
import DataView from "../features/analytics/components/visualization/DataView";
import ControlPanel from "../features/analytics/components/panels/ControlPanel";
import VariantGroup from "../features/analytics/components/visualization/VariantGroup";
import DataTable from "../features/analytics/components/visualization/DataTable";
// Phasing out FilterDropdown; use ControlPanelDropdown for both tabs and content
import ControlPanelDropdown from "../features/analytics/components/displays/ControlPanelDropdown.jsx";


export default function Analytics() {
  // --- Tabs + panel shell state (UI-only) ---
  const [activeTab, setActiveTab] = useState(null);
  const [isTabsOpen, setIsTabsOpen] = useState(false);
  // const [isTabsOpen, setIsTabsOpen] = useState(false);
  const reopenTimer = useRef(null);

  // NEW: View toggle state
  const [currentView, setCurrentView] = useState('table'); // 'table' or 'chart'

  // Panel state for verification context
  const [panelState, setPanelState] = useState({});
  

  // --- localStorage-based query persistence ---
  const [query, setQuery] = useState(() => {
    try {
      const saved = localStorage.getItem('analytics-query');
      return saved ? JSON.parse(saved) : defaultQuery;
    } catch (e) {
      console.warn('Failed to parse saved query, using default');
      return defaultQuery;
    }
  });

  // Update localStorage when query changes
  useEffect(() => {
    localStorage.setItem('analytics-query', JSON.stringify(query));
  }, [query]);

  // Use verification-enabled hook instead of basic hook
  const { 
    table, 
    rawData,
    loading, 
    error, 
    meta, 
    needsVerification, 
    discoveredProducts, 
    processVerification, 
    cancelVerification 
  } = useAnalyticsQueryWithVerification(query, panelState);

  console.log('Analytics component query state:', query);
  console.log('Analytics component panelState:', panelState);
  console.log('Analytics verification state:', { needsVerification, discoveredProducts: discoveredProducts?.length });

  // Bridge panel state/commands between dropdown panel and control strip
  const [panelCommand, setPanelCommand] = useState(null);
  const sendPanelCommand = (cmd) => setPanelCommand({ ...cmd, __ts: Date.now() });
  const dropdownApiRef = useRef(null);
  const [dropdownHeight, setDropdownHeight] = useState(0);

  // NEW: Dynamic component mapping
  const VIEW_COMPONENTS = {
    table: Table,
    data: DataTable,
    grouped: VariantGroup,
    chart: Chart
  };

  // NEW: View toggle handler
  const handleViewToggle = (view) => {
    console.log('Analytics: Switching to view:', view);
    setCurrentView(view);
  };

  // --- Click behavior for tabs (same UX, UI-only) ---
  const handleSetActiveTab = (newTab) => {
    // Do not roll the dropdown up/down; just toggle the active tab
    if (reopenTimer.current) {
      clearTimeout(reopenTimer.current);
      reopenTimer.current = null;
    }
    if (newTab == null) {
      setActiveTab(null);
      return;
    }
    if (newTab === activeTab) {
      setActiveTab(null);
      return;
    }
    setActiveTab(newTab);
  };

  // --- Panel actions (no-op commits; just close UI) ---
  const handleApply = async (applied) => {
    console.log('Analytics handleApply received:', applied);
    
    if (reopenTimer.current) {
      clearTimeout(reopenTimer.current);
      reopenTimer.current = null;
    }
    setIsTabsOpen(false);
    setActiveTab(null);

    if (applied) {
      console.log('Analytics updating query. Previous query:', query);
      console.log('Analytics applying config:', applied.config);
      setQuery((prev) => mergeQueries(prev, applied.config));
      console.log('Analytics setQuery called');
    }
  };
  
  const handleClose = () => {
    if (reopenTimer.current) {
      clearTimeout(reopenTimer.current);
      reopenTimer.current = null;
    }
    setIsTabsOpen(false);
    setActiveTab(null);
  };

  // --- Helper function to safely format missing months ---
  const formatMissingMonths = (missing) => {
    if (!missing || !Array.isArray(missing)) return "";
    
    return missing.map(m => {
      // Handle both object and composite formats
      if (typeof m === 'object' && m !== null) {
        // Convert any Date objects or complex objects to strings
        const yyyy = String(m.yyyy || '');
        const mm = String(m.mm || '').padStart(2, '0');
        return `${yyyy}-${mm}`;
      }
      return String(m); // Fallback for primitive values
    }).join(", ");
  };

  // --- Static table scaffold (no data) ---
  // Show only the first column label; placeholderCols keeps the grid visible.
  const columnKeys = ["Product Name"];

  const PanelContent = activeTab ? (PANEL_BY_TAB[activeTab] || null) : null;
  
  const handleReset = () => {
    // Clear all applied filters
    setQuery(defaultQuery);
    
    // Close the menu
    if (reopenTimer.current) {
      clearTimeout(reopenTimer.current);
      reopenTimer.current = null;
    }
    setIsTabsOpen(false);
    setActiveTab(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* HEADER AREA WITH TOOLBAR + DROPDOWN (DYNAMIC HEIGHT) */}
      <div className="relative w-full bg-white flex-none" style={{ height: 55 + dropdownHeight }}>
        {/* Control Panel toolbar with center strip */}
        <div className="flex-none">
          <ControlPanel
            activeTab={activeTab}
            panelState={panelState}
            onPanelCommand={sendPanelCommand}
            onPanelStateChange={(update)=> setPanelState(prev=> ({...prev, ...update}))}
            isOpen={isTabsOpen}
            onToggleMenu={() => setIsTabsOpen((v) => !v)}
            onToolbarApply={() => dropdownApiRef.current?.apply?.()}
            onToolbarReset={() => dropdownApiRef.current?.reset?.()}
          />
        </div>

        {/* Dropdown that contains FilterPanel (tabs) and active panel content */}
        <div className="flex-none" data-ignore-outside="true">
          <ControlPanelDropdown
            isOpen={isTabsOpen}
            onClose={() => setIsTabsOpen(false)}
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            panelProps={{ query }}
            panelState={panelState}
            onPanelStateChange={(update) => setPanelState((prev) => ({ ...prev, ...update }))}
            panelCommand={panelCommand}
            onApply={handleApply}
            onReset={handleReset}
            expose={(api) => { dropdownApiRef.current = api; }}
            onHeightChange={setDropdownHeight}
          />
        </div>
        {/* FilterDropdown removed */}
        {/* Left-side vertical FilterPanel removed; ControlPanelDropdown handles tabs */}
      </div>

      {/* CONTENT AREA FILLS REMAINING HEIGHT (BOTTOM FIXED) */}
      <div className="flex-1 min-h-0 px-4 flex flex-col">
        {/* Toolbar - keep your spacing */}
        <div className="flex-none mb-0">
          <DataToolbar 
            currentView={currentView}
            onViewChange={handleViewToggle}
          />
        </div>

        {/* Data view fills remaining height; table handles its own scroll */}
        <div className="flex-1 mb-2 min-h-0">
          <DataView
            currentView={currentView}
            components={VIEW_COMPONENTS}
            table={table ?? { columnKeys, rows: [], totals: {} }}
            rawData={rawData}
            placeholderRows={12}
            placeholderCols={4}
          />
        </div>
      </div>

      {/* Product Verification Popup */}
      <ProductVerificationPopup
        isOpen={needsVerification}
        discoveredProducts={discoveredProducts}
        onApprove={(userChoices, rememberChoices) => processVerification(userChoices, rememberChoices)}
        onCancel={cancelVerification}
      />
    </div>
  );
}
