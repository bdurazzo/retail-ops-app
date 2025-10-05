import React, { useState, useRef, useEffect } from "react";

// Real data loading
import { useAnalyticsQueryWithVerification } from "../hooks/useAnalyticsData.js";

// Simple implementations for components not yet connected
const defaultQuery = { scope: 'line_items' };
console.log('Analytics defaultQuery:', defaultQuery);
const mergeQueries = (prev, config) => ({ ...prev, ...config });
const ProductVerificationPopup = () => null;

// Visual components for dual view mode system
import Chart from "../features/analytics/components/charts/Chart.jsx";
import DataToolbar from "../core/components/visualization/DataToolbar.jsx";
import DataView from "../core/components/visualization/DataView.jsx";
import ViewMode from "../features/analytics/components/panels/ViewMode.jsx";
import ProductGroup from "../core/components/visualization/ProductGroup.jsx";
import OrderGroup from "../core/components/visualization/OrderGroup.jsx";
import DataTable from "../core/components/visualization/DataTable.jsx";
import ControlPanelDropdown from "../features/analytics/components/displays/ControlPanelDropdown.jsx";


export default function Analytics() {
  // --- Tabs + panel shell state (UI-only) ---
  const [activeTab, setActiveTab] = useState(null);
  const [isTabsOpen, setIsTabsOpen] = useState(false);
  // const [isTabsOpen, setIsTabsOpen] = useState(false);
  const reopenTimer = useRef(null);

  // View toggle state
  const [currentView, setCurrentView] = useState('orders'); // Default to orders view

  // Panel state for verification context
  const [panelState, setPanelState] = useState({});
  
  // Track selected products for shared checkbox state
  const [selectedProducts, setSelectedProducts] = useState([]);
  

  // --- localStorage-based query persistence ---
  const [query, setQuery] = useState(() => {
    try {
      const saved = localStorage.getItem('analytics-query');
      console.log('Analytics: Loading from localStorage:', saved);
      const parsedQuery = saved ? JSON.parse(saved) : defaultQuery;
      console.log('Analytics: Initial query state:', parsedQuery);
      return parsedQuery;
    } catch (e) {
      console.warn('Failed to parse saved query, using default');
      return defaultQuery;
    }
  });

  // Update localStorage when query changes
  useEffect(() => {
    console.log('Analytics query changed, saving to localStorage:', query);
    localStorage.setItem('analytics-query', JSON.stringify(query));
  }, [query]);

  // Listen for time filter events and Discovery product selection changes
  useEffect(() => {
    const handleTimeFilterUpdate = () => {
      console.log('Analytics: Time filter updated, reloading query');
      try {
        const saved = localStorage.getItem('analytics-query');
        const updatedQuery = saved ? JSON.parse(saved) : defaultQuery;
        console.log('Analytics: New query from localStorage:', updatedQuery);
        setQuery(updatedQuery);
        
        // Update selectedProducts if there's a product filter
        if (updatedQuery.product?.ids) {
          const products = updatedQuery.product.ids.map(title => ({ title }));
          setSelectedProducts(products);
          console.log('Analytics: Updated selectedProducts from query:', products);
        }
      } catch (error) {
        console.error('Analytics: Failed to reload after time filter update:', error);
      }
    };

    const handleTimeFilterClear = () => {
      console.log('Analytics: Time filter cleared, reloading query');
      try {
        const saved = localStorage.getItem('analytics-query');
        const updatedQuery = saved ? JSON.parse(saved) : defaultQuery;
        console.log('Analytics: Query after clear:', updatedQuery);
        setQuery(updatedQuery);
      } catch (error) {
        console.error('Analytics: Failed to reload after time filter clear:', error);
      }
    };

    // Handle product selection updates from Discovery page
    const handleStorageChange = (event) => {
      if (event.key === 'analytics-query') {
        console.log('Analytics: Query updated by another page, reloading');
        try {
          const updatedQuery = event.newValue ? JSON.parse(event.newValue) : defaultQuery;
          console.log('Analytics: Updated query from storage event:', updatedQuery);
          setQuery(updatedQuery);
          
          // Update selectedProducts if there's a product filter
          if (updatedQuery.product?.ids) {
            const products = updatedQuery.product.ids.map(title => ({ title }));
            setSelectedProducts(products);
            console.log('Analytics: Updated selectedProducts from storage event:', products);
          } else {
            setSelectedProducts([]);
            console.log('Analytics: Cleared selectedProducts from storage event');
          }
        } catch (error) {
          console.error('Analytics: Failed to reload from storage event:', error);
        }
      }
    };

    window.addEventListener('time-filter-updated', handleTimeFilterUpdate);
    window.addEventListener('time-filter-cleared', handleTimeFilterClear);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('time-filter-updated', handleTimeFilterUpdate);
      window.removeEventListener('time-filter-cleared', handleTimeFilterClear);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  // Use verification-enabled hook instead of basic hook
  const { 
    table, 
    rawData,
    needsVerification, 
    discoveredProducts, 
    processVerification, 
    cancelVerification 
  } = useAnalyticsQueryWithVerification(query, panelState, currentView);

  console.log('Analytics component query state:', query);
  console.log('Analytics component panelState:', panelState);
  console.log('Analytics verification state:', { needsVerification, discoveredProducts: discoveredProducts?.length });

  // Bridge panel state/commands between dropdown panel and control strip
  const [panelCommand, setPanelCommand] = useState(null);
  const sendPanelCommand = (cmd) => setPanelCommand({ ...cmd, __ts: Date.now() });
  const dropdownApiRef = useRef(null);
  const [dropdownHeight, setDropdownHeight] = useState(0);

  // Dynamic component mapping
  const VIEW_COMPONENTS = {
    orders: OrderGroup,
    line_items: DataTable,
    grouped: ProductGroup,
    chart: Chart
  };

  // NEW: View toggle handler
  const handleViewToggle = (view) => {
    console.log('Analytics: Switching to view:', view);
    setCurrentView(view);
  };

  // Handle product checkbox toggle from ProductGroup
  const handleProductToggle = (productName) => {
    console.log('Analytics: Product toggle for:', productName);
    
    // Individual product toggle
    const isSelected = selectedProducts.some(p => 
      (p.title || p.product_id || p.sku) === productName
    );
    
    let newSelectedProducts;
    if (isSelected) {
      // Remove product
      newSelectedProducts = selectedProducts.filter(p => 
        (p.title || p.product_id || p.sku) !== productName
      );
    } else {
      // Add product (create a simple product object)
      newSelectedProducts = [...selectedProducts, { title: productName }];
    }
    
    setSelectedProducts(newSelectedProducts);
    
    // Apply filter immediately
    const titleFallbacks = newSelectedProducts.map(p => p.title || p.product_id || p.sku).filter(Boolean);
    const filterConfig = {
      product: { 
        ids: titleFallbacks.length > 0 ? titleFallbacks : null
      }
    };
    
    console.log('Analytics: Auto-applying filter from ProductGroup toggle:', filterConfig);
    setQuery((prev) => mergeQueries(prev, filterConfig));
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
  
  // --- Static table scaffold (no data) ---
  // Show only the first column label; placeholderCols keeps the grid visible.
  const columnKeys = ["Product Name"];
  
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
          <ViewMode
            activeTab={activeTab}
            panelState={panelState}
            onPanelCommand={sendPanelCommand}
            onPanelStateChange={(update)=> setPanelState(prev=> ({...prev, ...update}))}
            isOpen={isTabsOpen}
            onToggleMenu={() => setIsTabsOpen((v) => !v)}
            onToolbarApply={() => dropdownApiRef.current?.apply?.()}
            onToolbarReset={() => dropdownApiRef.current?.reset?.()}
            setActiveTab={handleSetActiveTab}
          />
        </div>

        {/* ControlPanelDropdown handles everything - filter content AND panel view */}
        <div className="flex-none px-4" data-ignore-outside="true">
          <ControlPanelDropdown
            isOpen={isTabsOpen}
            onClose={() => setIsTabsOpen(false)}
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            panelProps={{ query, rawData }}
            panelState={panelState}
            onPanelStateChange={(update) => {
              setPanelState((prev) => ({ ...prev, ...update }));
              
              // Track selected products for shared checkbox state
              if (Array.isArray(update?.addCandidates)) {
                setSelectedProducts(update.addCandidates);
              }
              
              // Handle automatic filter application from ProductSearch checkboxes
              if (update?.autoApplyFilter) {
                console.log('Analytics: Auto-applying filter from checkboxes:', update.autoApplyFilter);
                setQuery((prev) => mergeQueries(prev, update.autoApplyFilter.config));
              }
            }}
            panelCommand={panelCommand}
            onApply={handleApply}
            onReset={handleReset}
            expose={(api) => { dropdownApiRef.current = api; }}
            onHeightChange={setDropdownHeight}
            onToolbarAction={(action) => console.log('Analytics toolbar action:', action)}
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
            productFilter={query?.product}
            selectedProducts={selectedProducts}
            onProductToggle={handleProductToggle}
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
