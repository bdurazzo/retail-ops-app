// src/features/analytics/components/TabDropPanel.jsx

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./TabDropPanel.css"; // create this for styling if needed

export default function TabDropPanel({ isOpen, onClose, filters, setFilters, applyFilters }) {
  const backdropRef = useRef();

  const handleClickOutside = (e) => {
    if (backdropRef.current && e.target === backdropRef.current) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleReset = () => {
    setFilters({
      priceFloor: "",
      category: "",
      timeRange: "",
    });
  };

  const handleApply = () => {
    applyFilters();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            className="fixed inset-0 bg-gray-800 bg-opacity-40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={backdropRef}
          />

          {/* PANEL */}
          <motion.div
            className="absolute left-0 right-0 mx-auto bg-white z-50 shadow-lg rounded-b-lg max-w-screen-md"
            initial={{ y: -200, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { duration: 0.25 } }}
            exit={{ y: -200, opacity: 0, transition: { duration: 0.2 } }}
            style={{ top: "52px" }} // drop from just beneath chart tab bar
          >
            {/* HEADER */}
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <h3 className="text-sm font-semibold uppercase">Filter Options</h3>
              <button className="text-gray-500 hover:text-black" onClick={onClose}>
                ✕
              </button>
            </div>

            {/* FILTER SECTIONS */}
            <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
              {/* Price Floor */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Price ($)</label>
                <input
                  type="number"
                  value={filters.priceFloor}
                  onChange={(e) => setFilters((prev) => ({ ...prev, priceFloor: e.target.value }))}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="">All</option>
                  <option value="Shirts">Shirts</option>
                  <option value="Pants">Pants</option>
                  <option value="Outerwear">Outerwear</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              {/* Time Range */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Time Range</label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => setFilters((prev) => ({ ...prev, timeRange: e.target.value }))}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="">All</option>
                  <option value="2023Q4">2023Q4</option>
                  <option value="2024Q1">2024Q1</option>
                  <option value="2024Q2">2024Q2</option>
                  <option value="2025Q1">2025Q1</option>
                  <option value="2025Q2">2025Q2</option>
                </select>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-between items-center p-4 border-t sticky bottom-0 bg-white">
              <button
                className="text-sm px-3 py-1 border rounded text-gray-600 hover:text-black"
                onClick={handleReset}
              >
                Reset
              </button>
              <button
                className="text-sm px-4 py-1 bg-black text-white rounded hover:bg-gray-800"
                onClick={handleApply}
              >
                Apply
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
