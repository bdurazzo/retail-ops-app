import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Reusable Dropdown container that encapsulates the mechanics from
 * src/features/analytics/components/menus/FilterDropdown.jsx
 *
 * Key features:
 * - Animated open/close with auto-height measurement via ResizeObserver
 * - Outside-click close with configurable ignore selectors
 * - Sticky footer with default Reset/Apply handling
 * - Child content can register an async apply() handler via onRegister
 * - Supports remounting content via contentKey (e.g., active tab)
 * - Forwards panelCommand and onPanelStateChange to children
 */
export default function Dropdown({
  // Visibility
  isOpen,
  onClose,

  // Positioning and classes
  dropFromTop = false,
  containerClassName,
  panelClassName,
  contentClassName = "h-[275px] overflow-y-auto",

  // Header/Footer customization
  header = null,
  footer = null,
  showDefaultFooter = true,

  // Actions
  onApply,
  onReset,

  // Content render control
  contentKey,
  renderContent, // function({ onRegister, resetNonce, panelCommand, onPanelStateChange }) => ReactNode
  children,      // alternative to renderContent; gets same helper props via function-as-child

  // Panel integration helpers (pass-through to content)
  onPanelStateChange,
  panelCommand,

  // Outside click behavior
  ignoreOutsideSelectors,

  // Layout feedback
  onHeightChange,
}) {
  // Stable handler to forward panel state changes
  const handlePanelStateChange = useCallback((panelState) => {
    if (onPanelStateChange) onPanelStateChange(panelState);
  }, [onPanelStateChange]);

  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const applyFnRef = useRef(null);
  const [resetNonce, setResetNonce] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const openTimeRef = useRef(null);

  const handleRegister = useCallback((fn) => {
    applyFnRef.current = typeof fn === "function" ? fn : null;
  }, []);

  // Track when menu opens (for animation easing on first open)
  useEffect(() => {
    if (isOpen && !openTimeRef.current) {
      openTimeRef.current = Date.now();
    } else if (!isOpen) {
      openTimeRef.current = null;
    }
  }, [isOpen]);

  const isOpening = openTimeRef.current && (Date.now() - openTimeRef.current < 300);

  // Measure content height
  useEffect(() => {
    if (!contentRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentHeight(entry.contentRect.height);
      }
    });
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [isOpen, contentKey]);

  // Report height to parent so layout can reserve space under toolbar
  useEffect(() => {
    if (typeof onHeightChange === 'function') {
      onHeightChange(isOpen ? contentHeight : 0);
    }
  }, [isOpen, contentHeight, onHeightChange]);

  // Outside click close with configurable ignores
  const defaultIgnore = useMemo(() => ([
    '[data-ignore-outside="true"]',
    '.relative > div:first-child', // Toolbar husk area
    '[class*="toolbar"], [class*="Toolbar"]',
  ]), []);

  const ignoreSelectors = ignoreOutsideSelectors?.length ? ignoreOutsideSelectors : defaultIgnore;

  useEffect(() => {
    function handleClickOutside(e) {
      // Skip ignored regions
      for (const sel of ignoreSelectors) {
        if (e.target?.closest?.(sel)) return;
      }
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.();
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, ignoreSelectors]);

  // Derived classes
  const containerClasses = useMemo(() => (
    containerClassName ?? (dropFromTop ? "absolute top-12 left-0 w-[330px]" : "ml-10 w-[310px]")
  ), [containerClassName, dropFromTop]);

  const panelClasses = useMemo(() => (
    panelClassName ?? `absolute left-0 ${dropFromTop ? "top-0" : "top-full"} w-full rounded-b-md bg-gradient-to-t from-gray-50 via-white to-gray-100 shadow-xl z-[99]`
  ), [panelClassName, dropFromTop]);

  // Footer renderer
  const renderFooter = () => {
    if (footer !== null) return footer; // explicit override (can be null to hide)
    if (!showDefaultFooter && !onApply && !onReset) return null;
    return (
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
            try {
              let result = null;
              if (applyFnRef.current) result = await applyFnRef.current();
              onApply?.(result);
            } finally {
              onClose?.();
            }
          }}
        >
          Apply
        </button>
      </div>
    );
  };

  // Content renderer helpers provided to children
  const contentHelpers = useMemo(() => ({
    onRegister: handleRegister,
    resetNonce,
    panelCommand,
    onPanelStateChange: handlePanelStateChange,
  }), [handleRegister, resetNonce, panelCommand, handlePanelStateChange]);

  const renderBody = () => {
    const body = typeof renderContent === "function"
      ? renderContent(contentHelpers)
      : typeof children === "function"
        ? children(contentHelpers)
        : children;

    return (
      <div ref={contentRef}>
        {header}
        <div className={contentClassName}>
          {body ?? (
            <div className="text-sm text-gray-500">No content</div>
          )}
        </div>
        {renderFooter()}
      </div>
    );
  };

  return (
    <div className={`relative ${containerClasses}`}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            ref={panelRef}
            key="dropdown-panel"
            className={panelClasses}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: contentHeight > 0 ? contentHeight : "full" }}
            exit={{ opacity: 1, height: 0, transitionEnd: { display: "none" } }}
            transition={{
              // Keep container opacity essentially instant; inner content handles fades
              opacity: { duration: 0.01, ease: "easeInOut" },
              // Coordinate with inner panel: animate height only when first opening,
              // then snap height changes so inner fades own the animation.
              height: { duration: isOpening ? 0.2 : 0.01, ease: "easeInOut" },
            }}
            style={{ overflow: "hidden" }}
          >
            {/* content wrapper for measurement */}
            {contentKey != null ? (
              <div key={contentKey}>
                {renderBody()}
              </div>
            ) : renderBody()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
