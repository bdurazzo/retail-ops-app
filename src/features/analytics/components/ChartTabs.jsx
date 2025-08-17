// --------------------------------------------------------
// ChartTabs.jsx – Simple tab click tracker only
// --------------------------------------------------------

import React, { useRef, useEffect, useState } from "react";

export default function ChartTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "TAB 1", label: "Item" },
    { id: "TAB 2", label: "" },
    { id: "TAB 3", label: "" },
    { id: "TAB 4", label: "" },
    { id: "TAB 5", label: "" },
  ];
  const tabRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const handleTabClick = (id) => {
    setActiveTab(id); // Only job: tell Analytics which tab was clicked
  };

  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const currentTab = tabRefs.current[activeIndex];
    if (currentTab) {
      setIndicatorStyle({
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth,
      });
    }
  }, [activeTab]);

  return (
    <div className="w-full mb-1 relative z-10">
      <div className="relative flex w-full rounded-lg shadow-md border-t border-x border-gray-300 overflow-hidden bg-white">
        {tabs.map((tab, index) => {
          const isFirst = index === 0;
          const isLast = index === tabs.length - 1;
          const isActive = tab.id === activeTab;

          return (
            <button
              ref={(el) => (tabRefs.current[index] = el)}
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 text-center px-3 py-3 text-xs font-medium transition-colors duration-[400ms] focus:outline-none
                ${isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}
                ${!isFirst ? "border-l border-gray-200" : ""}
                ${isFirst ? "rounded-l-lg" : ""}
                ${isLast ? "rounded-r-lg" : ""}
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}