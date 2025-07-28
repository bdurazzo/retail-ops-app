import React from "react";

const ChartTabs = ({ activeTab, onTabSelect }) => {
  const tabs = ["Attach Rate", "AOV", "UPT", "Order Qty"];

  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex rounded-xl border border-gray-300 overflow-hidden shadow">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabSelect(tab)}
            className={`px-4 py-1.5 text-xs font-semibold transition-colors duration-200
              ${tab === activeTab
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"}`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChartTabs;
