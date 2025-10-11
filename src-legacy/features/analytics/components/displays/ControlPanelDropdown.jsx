import React, { useEffect, useMemo, useRef, useState } from "react";
import Dropdown from "../../../../components/Dropdown.jsx";
import FilterPanel from "../panels/FilterPanel.jsx";
import { PANEL_BY_TAB } from "../filters/index.js";

/**
 * ControlPanelDropdown: A thin container that only wraps FilterPanel in the
 * reusable Dropdown. Meant to sit directly under the toolbar and be toggled
 * by the hamburger button in ControlPanel (parent owns isOpen).
 */
export default function ControlPanelDropdown({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  panelProps = {},
  panelState,
  panelCommand,
  onPanelStateChange,
  onApply,
  onReset,
  expose, // function({ apply, reset })
  onHeightChange,
}) {
  const PanelContent = useMemo(() => activeTab ? (PANEL_BY_TAB[activeTab] || null) : null, [activeTab]);
  const filterStateRefs = useRef({}); // Store all filter state functions
  const [resetNonce, setResetNonce] = useState(0);

  const handleRegister = (fn, filterType) => {
    if (typeof fn === 'function' && filterType) {
      filterStateRefs.current[filterType] = fn;
    }
  };

  const api = useMemo(() => ({
    apply: async () => {
      try {
        // Collect state from all registered filters
        const allFilters = {};
        for (const [filterType, getStateFn] of Object.entries(filterStateRefs.current)) {
          try {
            const filterResult = await getStateFn();
            if (filterResult && filterResult.config) {
              Object.assign(allFilters, filterResult.config);
            }
          } catch (error) {
            console.warn(`Error getting state from ${filterType} filter:`, error);
          }
        }
        
        const combinedResult = {
          type: 'combined',
          config: allFilters,
          isValid: Object.keys(allFilters).length > 0
        };
        
        console.log('ControlPanelDropdown applying combined filters:', combinedResult);
        onApply?.(combinedResult);
      } finally {
        onClose?.();
      }
    },
    reset: () => {
      setResetNonce((n) => n + 1);
      onReset?.();
    }
  }), [onApply, onClose, onReset]);

  useEffect(() => {
    if (typeof expose === 'function') expose(api);
  }, [api, expose]);

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={onClose}
      onHeightChange={onHeightChange}
      containerClassName="w-full"
      panelClassName="absolute left-0 top-full w-full rounded-b-md bg-gradient-to-t from-gray-50 via-white to-gray-100 shadow-xl z-[150]"
      contentClassName="py-2"
      contentKey={activeTab ?? 'none'}
      ignoreOutsideSelectors={['*']}
      renderContent={() => (
        <div className="p-2" data-ignore-outside="true">
          <div className="flex">
            {/* Left: vertical tabs */}
            <div className="flex-none px-2 w-12">
              <FilterPanel activeTab={activeTab} setActiveTab={setActiveTab} vertical={true} />
            </div>
            {/* Right: active panel content */}
            <div className="flex-1 ml-2 max-h-[290px] max-w-[310px] overflow-y-auto">
              {PanelContent ? (
                <PanelContent
                  key={activeTab}
                  resetNonce={resetNonce}
                  onRegister={(fn) => handleRegister(fn, activeTab)}
                  panelCommand={panelCommand}
                  onPanelStateChange={onPanelStateChange}
                  panelState={panelState}
                  {...panelProps}
                />
              ) : (
                <div className="text-sm text-gray-500">Select a filter tab to configure options.</div>
              )}
              
              {/* Hidden panels for state registration */}
              {Object.entries(PANEL_BY_TAB).map(([tabKey, PanelComponent]) => {
                if (tabKey === activeTab) return null; // Already rendered above
                return (
                  <div key={tabKey} style={{ display: 'none' }}>
                    <PanelComponent
                      resetNonce={resetNonce}
                      onRegister={(fn) => handleRegister(fn, tabKey)}
                      panelCommand={panelCommand}
                      onPanelStateChange={onPanelStateChange}
                      panelState={panelState}
                      {...panelProps}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      footer={null}
      showDefaultFooter={false}
    />
  );
}
