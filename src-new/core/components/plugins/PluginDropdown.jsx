import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPluginTabLabel } from "./PluginPanel.jsx";

export default function PluginDropdown({
  isOpen,
  onClose,
  activeTab,
  PanelComponent,
  panelProps = {},
  dropFromTop = false,
  onPanelStateChange,
  panelCommand,
  expose,
}) {
  const handlePanelStateChange = (panelState) => {
    if (onPanelStateChange) {
      onPanelStateChange(panelState);
    }
  }
  const panelRef = useRef();
  const contentRef = useRef();
  const [contentHeight, setContentHeight] = useState(0);
  const openTimeRef = useRef(null);

  // Expose imperative controls to parent (if needed for plugin actions)
  const closeFromOutside = () => {
    onClose?.();
  };

  useEffect(() => {
    if (typeof expose === 'function') {
      expose({ close: closeFromOutside });
    }
  }, [expose]);

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

      // Ignore clicks within the TabToolbar area
      if (e.target?.closest?.('.relative > div:first-child')) return;

      // Ignore clicks on any element with toolbar-related classes
      if (e.target?.closest?.('[class*="toolbar"], [class*="Toolbar"]')) return;

      if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.();
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className={`relative ${dropFromTop ? 'absolute top-12 left-0 w-[330px]' : 'ml-[50px] w-[300px]'}`}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            ref={panelRef}
            key="dropdown-panel"
            className={`absolute left-0 ${dropFromTop ? 'top-0' : 'top-full'} w-full rounded-b-md bg-gradient-to-t from-gray-50 via-white to-gray-100 shadow-xl z-[99]`}
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: contentHeight > 0 ? contentHeight : "auto"
            }}
            exit={{ opacity: 1, height: 0, transitionEnd: { display: "none" } }}
            transition={{
              opacity: { duration: 0.01, ease: "easeInOut" },
              height: {
                duration: isOpening ? 0.1 : 0.01,
                ease: "easeInOut"
              },
            }}
            style={{ overflow: "hidden" }}
          >
            {/* Content wrapper for measurement*/}

            <div ref={contentRef}>
              {/* Scrollable Content */}
              <div className=" h-min-[260px] overflow-y-auto">
                {PanelComponent ? (
                  <PanelComponent
                    key={activeTab}
                    onPanelStateChange={handlePanelStateChange}
                    panelCommand={panelCommand}
                    {...panelProps}
                  />
                ) : (
                  <div className="text-sm text-gray-500">No panel configured for this tab yet.</div>
                )}
              </div>

              {/* No Apply/Reset footer for plugins - drag and drop only */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
