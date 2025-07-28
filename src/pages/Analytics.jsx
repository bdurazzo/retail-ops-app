import React, { useEffect, useState } from "react";
import AnalyticsChart from "../features/analytics/components/AnalyticsChart";
import GeneratedTable from "../features/analytics/components/GeneratedTable";
import KPIGrid from "../features/analytics/components/KPIGrid";
import ChartTabs from "../features/analytics/components/ChartTabs";

import mockChartData from "../features/analytics/data/mockChartData";
import mockTableData from "../features/analytics/data/mockTableData";
import mockKPIData from "../features/analytics/data/mockKPIData";

export default function Analytics() {
  const [chartData, setChartData] = useState(mockChartData);
  const [tableData, setTableData] = useState(mockTableData);
  const [kpis, setKpis] = useState(mockKPIData);
  const [activeTab, setActiveTab] = useState("Attach Rate");

  // Optional: simulate loading new data on tab change
  const handleTabSelect = (tabName) => {
    setActiveTab(tabName);
    // In the future, use this to fetch new data based on selected metric
  };

  return (
    <div className="h-full flex flex-col px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold mb-2">Data Insights</h1>

      <ChartTabs onTabSelect={handleTabSelect} activeTab={activeTab} />

      <KPIGrid kpis={kpis} />

      <AnalyticsChart config={chartData} />

      <div className="flex-1 overflow-y-auto mt-4">
        <GeneratedTable data={tableData} />
      </div>
    </div>
  );
}
