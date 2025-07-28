import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AnalyticsChart({ config }) {
  const chartConfig = {
    data: {
      labels: config?.labels || [],
      datasets: config?.datasets || [],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
      },
      scales: {
        x: {
          ticks: {
            font: { size: 10 },
          },
        },
        y: {
          ticks: {
            font: { size: 10 },
          },
        },
      },
    },
  };

  return (
    <div className="h-[280px] w-full bg-white rounded-xl shadow p-4">
      <Bar {...chartConfig} />
    </div>
  );
}
