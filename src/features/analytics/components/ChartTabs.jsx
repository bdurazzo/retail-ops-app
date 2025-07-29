import React from "react";

const tabs = ["Attach Rate", "AOV", "UPT", "Order Volume", "+ Custom"];

export default function ChartTabs({ activeTab, onTabSelect }) {
  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex border border-gray-300 rounded overflow-hidden bg-white shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabSelect(tab)}
            className={`px-4 py-1 text-sm font-medium transition-colors duration-150 ${
              activeTab === tab
                ? "bg-black text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
