import React, { useState, useRef } from "react";
import AnalyticsChart from "../features/analytics/components/AnalyticsChart";
import GeneratedTable from "../features/analytics/components/GeneratedTable";
import KPIGrid from "../features/analytics/components/KPIGrid";
import ChartTabs from "../features/analytics/components/ChartTabs";
import TabDropPanel from "../features/analytics/components/TabDropPanel";
import mockChartData from "../features/analytics/data/mockChartData";
import mockTableData from "../features/analytics/data/mockTableData";
import mockKPIData from "../features/analytics/data/mockKPIData";

export default function Analytics() {
  const [chartData, setChartData] = useState(mockChartData);
  const [tableData, setTableData] = useState(mockTableData);
  const [kpis, setKpis] = useState(mockKPIData);
  const [activeTab, setActiveTab] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [filters, setFilters] = useState({});

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    setDropOpen((prev) => (activeTab === tab ? !prev : true));
  };

  const handleApplyFilters = (tab, appliedFilters) => {
    setFilters((prev) => ({ ...prev, [tab]: appliedFilters }));
    setDropOpen(false);

    // 👇 Example usage: pass filters into your chart logic here
    console.log("🚀 Apply filters for", tab, appliedFilters);
    // Placeholder: apply logic for Attach Rate filter (min price, etc.)
  };

  return (
    <div className="h-full flex flex-col px-4 py-6 relative">
      <h1 className="text-xl font-bold mb-4">Data Insights</h1>
      <ChartTabs activeTab={activeTab} onTabSelect={handleTabSelect} />
      <KPIGrid kpis={kpis} />
      <AnalyticsChart config={chartData} />
      <div className="flex-1 overflow-y-auto mt-4">
        <GeneratedTable data={tableData} />
      </div>
      <TabDropPanel
        isOpen={dropOpen}
        onClose={() => setDropOpen(false)}
        onApplyFilters={handleApplyFilters}
        activeTab={activeTab}
        savedFilters={filters[activeTab] || {}}
      />
    </div>
  );
}
