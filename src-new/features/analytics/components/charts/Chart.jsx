// --------------------------------------------------
// Chart.jsx – Recharts view consuming ChartDTO via pipeline
// Option B: derives ChartDTO from table.rows using chartFeeder
// --------------------------------------------------

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
// import { toChart } from "../../feeders/chartFeeder.js";
const toChart = (data) => ({ categories: [], series: [] }); // Mock implementation

// Small helper to turn ChartDTO into Recharts data array
function dtoToRechartsData(chartDTO) {
  const { categories = [], series = [] } = chartDTO || {};
  return categories.map((cat, i) => {
    const row = { category: cat };
    for (const s of series) {
      row[s.name] = s.data?.[i] ?? 0;
    }
    return row;
  });
}

export default function Chart({
  table,
  type = "line", // 'line' | 'bar' | 'area'
  height = 300,
  xKey = "__mm",
  yKey = "Product Net",
}) {
  const rows = table?.rows || [];

  const chartDTO = useMemo(() => toChart(rows, { xKey, yKey }), [rows, xKey, yKey]);
  const data = useMemo(() => dtoToRechartsData(chartDTO), [chartDTO]);
  const series = chartDTO.series || [];

  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#6b7280" }} />
      <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
      <Tooltip wrapperStyle={{ fontSize: 12 }} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
    </>
  );

  return (
    <div className="w-full border-t border-gray-200 shadow-xl rounded-b-xl bg-white" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === "bar" ? (
          <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            {common}
            {series.map((s, idx) => (
              <Bar key={s.name} dataKey={s.name} fill={["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"][idx % 4]} />
            ))}
          </BarChart>
        ) : type === "area" ? (
          <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            {common}
            {series.map((s, idx) => (
              <Area
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"][idx % 4]}
                fill={["#bae6fd", "#bbf7d0", "#fde68a", "#fecaca"][idx % 4]}
                fillOpacity={0.5}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            {common}
            {series.map((s, idx) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"][idx % 4]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
