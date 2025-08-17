// ------------------------------------------------------------------
// TabDropPanel.jsx – Visual drop-down panel layer with animation and outside click handling
// ------------------------------------------------------------------

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon,
  ChevronRightIcon
} from "@heroicons/react/20/solid";

// 🔧 Import centralized tag registry and logic registry
import { filterTagRegistry } from "./filters/filterTagRegistry";
import { filterLogicRegistry } from "./filters/filterLogicRegistry";

export default function TabDropPanel({ isOpen, onClose, activeTab }) {
  const panelRef = useRef();

  // --------------------------------------
  // State setup for all filter sections
  // --------------------------------------
  const [filterStates, setFilterStates] = useState(
    Object.keys(filterTagRegistry).reduce((acc, key) => {
      acc[key] = filterTagRegistry[key].map(tag => ({ ...tag, selected: false }));
      return acc;
    }, {})
  );

  const [sectionVisibility, setSectionVisibility] = useState(
    Object.keys(filterTagRegistry).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {})
  );

  const [resetFlag, setResetFlag] = useState(false);

  const handleToggleTag = (sectionKey, tagValue) => {
    const handler = filterLogicRegistry[sectionKey];
    const currentTags = filterStates[sectionKey];
    if (!handler) return;

    const updated = handler(tagValue, () => {}, currentTags);
    setFilterStates(prev => ({ ...prev, [sectionKey]: updated }));
  };

  const resetAllTags = () => {
    const resetState = Object.keys(filterTagRegistry).reduce((acc, key) => {
      acc[key] = filterTagRegistry[key].map(tag => ({ ...tag, selected: false }));
      return acc;
    }, {});
    setFilterStates(resetState);
    setResetFlag(prev => !prev);
  };

  const handleClickOutside = (event) => {
    if (panelRef.current && !panelRef.current.contains(event.target)) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const FilterSection = ({ title, show, toggleShow, children }) => (
    <div className="border-t border-gray-200 pt-2">
      <div
        className="flex items-center justify-between cursor-pointer px-1 py-1"
        onClick={toggleShow}
      >
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
          {show ? (
            <ChevronDownIcon className="w-4 h-4 text-gray-700" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-gray-700" />
          )}
        </div>
      </div>
      {show && <div className="mt-3">{children}</div>}
    </div>
  );

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            ref={panelRef}
            key="dropdown-panel"
            className="absolute left-0 top-full w-full rounded-md bg-white shadow-lg border border-gray-200 z-[99]"
            initial={{ opacity: 1, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0, transitionEnd: { display: "none" } }}
            transition={{
              opacity: { duration: 0.25, ease: "easeOut" },
              height: { duration: 0.25, ease: "easeInOut" },
            }}
            style={{ overflow: "hidden" }}
          >
            {/* Sticky Header */}
            <div className="border-b border-gray-200 px-4 py-2 bg-white sticky top-0 z-10">
              <div className="text-sm font-semibold text-gray-800">{`${activeTab} Filter Panel`}</div>
            </div>

            <div className="max-h-[300px] overflow-y-auto px-4 py-6 space-y-4">
              <div className="text-sm text-gray-600 font-semibold">Filters</div>
              <div className="flex flex-col gap-3">
                {Object.entries(filterTagRegistry).map(([key, tags]) => (
                  <FilterSection
                    key={key}
                    title={key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}
                    show={sectionVisibility[key]}
                    toggleShow={() =>
                      setSectionVisibility(prev => ({ ...prev, [key]: !prev[key] }))
                    }
                  >
                    <div className="flex flex-wrap gap-2 mt-2">
                      {filterStates[key].map((tag) => (
                        <button
                          key={tag.label}
                          onClick={() => handleToggleTag(key, tag.value)}
                          className={`px-2 py-1 text-xs rounded transition ${
                            tag.selected
                              ? "bg-gray-900 text-white hover:bg-gray-800"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </FilterSection>
                ))}
              </div>
            </div>

            {/* Sticky footer */}
            <div className="border-t border-gray-200 px-4 py-2 flex justify-end bg-white sticky bottom-0">
              <button
                className="text-sm text-gray-500 hover:text-gray-700 mr-4"
                onClick={resetAllTags}
              >
                Reset
              </button>
              <button className="bg-gray-900 text-white px-3 py-1 text-sm rounded-md hover:bg-gray-800">
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
