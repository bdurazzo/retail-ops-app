import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTabLabel } from "../panels/FilterPanel.jsx";

export default function FilterDropdown({
  isOpen,
  onClose,
  activeTab,
  PanelComponent,
  panelProps = {},
  onApply,
  onReset,
  dropFromTop = false,
  onPanelStateChange,
  panelCommand,
}) {
  const handlePanelStateChange = (panelState) => {
    if (onPanelStateChange) {
      onPanelStateChange(panelState);
    }
  }
  const panelRef = useRef();
  const contentRef = useRef();
  const applyFnRef = useRef(null);
  const [resetNonce, setResetNonce] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const openTimeRef = useRef(null);

  const handleRegister = (fn) => {
    applyFnRef.current = typeof fn === "function" ? fn : null;
  };

  // Track when menu opens
  useEffect(() => {
    if (isOpen && !openTimeRef.current) {
      openTimeRef.current = Date.now();
    } else if (!isOpen) {
      openTimeRef.current = null;
    }
  }, [isOpen]);

  // Check if we're still in opening animation (first 300ms)
  const isOpening = openTimeRef.current && (Date.now() - openTimeRef.current < 300);

  // Measure content height whenever it might change
  useEffect(() => {
    if (!contentRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        setContentHeight(height);
      }
    });

    resizeObserver.observe(contentRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen, activeTab]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      // Ignore clicks on elements with data-ignore-outside attribute
      if (e.target?.closest?.('[data-ignore-outside="true"]')) return;
      
      // Ignore clicks within the TabToolbar area (where TimeToolbarPanel buttons are)
      if (e.target?.closest?.('.relative > div:first-child')) return; // TabToolbar's ToolbarHusk
      
      // Ignore clicks on any element with toolbar-related classes
      if (e.target?.closest?.('[class*="toolbar"], [class*="Toolbar"]')) return;
      
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.();
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className={`relative ${dropFromTop ? 'absolute top-12 left-0 w-[330px]' : 'ml-7 w-[330px]'}`}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            ref={panelRef}
            key="dropdown-panel"
            className={`absolute left-0 ${dropFromTop ? 'top-0' : 'top-full'} w-full rounded-b-md bg-gradient-to-t from-gray-50 via-white to-gray-100 shadow-xl z-[99]`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: 1, 
              height: contentHeight > 0 ? contentHeight : "full"
            }}
            exit={{ opacity: 1, height: 0, transitionEnd: { display: "none" } }}
            transition={{
              opacity: { duration: 0.01, ease: "easeInOut" },
              height: { 
                duration: isOpening ? 0.2 : 0.01, 
                ease: "easeInOut" 
              },
            }}
            style={{ overflow: "hidden" }}
          > 
            {/* Content wrapper for measurement*/}
            
            <div ref={contentRef}>
              {/* Sticky Header*/}
              
              {/*
              <div className="border-b border-gray-200 px-4 py-2 bg-white sticky top-0 z-10">
                <div className="text-sm font-semibold text-gray-800">
                    {activeTab ? `${getTabLabel(activeTab)}` : "Panel"}
                </div>
              </div>
              */}

              {/* Scrollable Content */}
              <div className="h-[280px] overflow-y-auto">
                {PanelComponent ? (
                  <PanelComponent
                    key={activeTab}
                    resetNonce={resetNonce}
                    onRegister={handleRegister}
                    onPanelStateChange={handlePanelStateChange}
                    panelCommand={panelCommand}
                    {...panelProps}
                  />
                ) : (
                  <div className="text-sm text-gray-500">No panel configured for this tab yet.</div>
                )}
              </div>

              {/* Sticky footer */}
              <div className="border-t border-gray-200 px-4 py-2 flex justify-end bg-gradient-b from-white to-gray-50 sticky bottom-0 gap-3">
                <button
                  className="text-sm text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setResetNonce((n) => n + 1);
                    onReset?.();
                  }}
                >
                  Reset
                </button>
                <button
                  className="bg-gray-900 text-white px-3 py-1 text-sm rounded-md hover:bg-gray-800"
                  onClick={async () => {
                    console.log('Menu Apply button clicked!');
                    console.log('applyFnRef.current:', applyFnRef.current);
                    console.log('onApply function:', onApply);
                    try {
                      let applied = null;
                      if (applyFnRef.current) {
                        applied = await applyFnRef.current();
                        console.log('Menu got data from panel:', applied);
                      }
                      console.log('Menu calling onApply with:', applied);
                      onApply?.(applied);
                      console.log('Menu onApply called successfully');
                    } finally {
                      console.log('Menu closing panel');
                      onClose?.();
                    }
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
