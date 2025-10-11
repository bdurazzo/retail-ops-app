// --------------------------------------------------------
// Panel.jsx – Simple tab click tracker with vertical support
// --------------------------------------------------------

import React, { useRef, useEffect, useState } from "react";
import {
  IconShirtFilled,
  IconBriefcaseFilled,
  IconClockFilled,
  IconTemperaturePlusFilled,
  IconChartDots2Filled,
  IconFileAnalyticsFilled,
} from "@tabler/icons-react";

// Single source of truth for tab metadata (id, label, icon)
export const TABS = [
  { id: "TAB 1", label: "Product",  icon: IconShirtFilled },
  { id: "TAB 2", label: "Metric",  icon: IconBriefcaseFilled },
  { id: "TAB 3", label: "Time",     icon: IconClockFilled },
  { id: "TAB 4", label: "Element", icon: IconTemperaturePlusFilled },
  { id: "TAB 5", label: "Trend",   icon: IconChartDots2Filled },
];

// Map from id → label for consumers like TabDropPanel
export const TAB_LABELS = Object.fromEntries(TABS.map(t => [t.id, t.label]));

// Helper for safe lookup
export const getTabLabel = (id) => TAB_LABELS[id] ?? id;

export default function Panel({ activeTab, setActiveTab, vertical = false }) {
  const tabs = TABS;
  const tabRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const handleTabClick = (id) => setActiveTab(id);

  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const currentTab = tabRefs.current[activeIndex];
    if (currentTab && !vertical) {
      setIndicatorStyle({
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth,
      });
    }
  }, [activeTab, vertical]);

  if (vertical) {
    return (
      <div className="flex relative z-10">
        <div className="flex-col h-full">
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <div className="py-1" key={tab.id}>
              <button
                onClick={() => handleTabClick(tab.id)}
                className={`border-b shadow rounded w-8 h-[50px] flex items-center justify-center transition-colors duration-[50ms] focus:outline-none
                  ${isActive ? "bg-gray-800 text-white" : "text-gray-700 hover:bg-gray-100"}
                  ${index === 0 ? "" : ""}
                  ${index === tabs.length - 1 ? "" : ""}
                  ${index !== tabs.length - 1 ? "" : ""}
                `}
                aria-label={tab.label}
                title={tab.label}
              >
                {Icon ? (
                  <Icon
                    size={20}
                    stroke={1.25}
                    className={isActive ? "text-white" : "text-gray-700"}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Original horizontal layout
  return (
    <div className="w-full relative z-10">
      <div className="relative flex w-full rounded-t-xl border-b overflow-hidden bg-gradient-to-t from-white via-gray-50 to-gray-50">
        {tabs.map((tab, index) => {
          const isFirst = index === 0;
          const isLast = index === tabs.length - 1;
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              ref={(el) => (tabRefs.current[index] = el)}
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 px-3 py-3 text-xs font-medium transition-colors duration-[50ms] focus:outline-none
                ${isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}
                ${!isFirst ? "border-l border-gray-200" : ""}
                ${isFirst ? "" : ""}
                ${isLast ? "" : ""}
              `}
              aria-label={tab.id}
            >
              <span className="flex items-center justify-center h-[12px]">
                {Icon ? (
                  <Icon
                    size={20}
                    stroke={1.75}
                    className={isActive ? "text-white" : "text-gray-700"}
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
