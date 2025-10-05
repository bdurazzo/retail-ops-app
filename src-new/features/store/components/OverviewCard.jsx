// 📄 src/features/storeDashboard/components/OverviewCard.jsx
// Minimal, data-agnostic overview window. No charts, no APIs — just slots.

import React from "react";

export default function OverviewCard() {
  return (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header row (title + placeholder controls) */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Overview</h2>

        {/* Placeholder controls (timeframe, channel) — leave empty for now */}
        <div className="flex items-center gap-2">
          {/* <button className="text-xs px-2 py-1 border rounded-md bg-white">This Week</button> */}
          {/* <button className="text-xs px-2 py-1 border rounded-md bg-white">In-Store</button> */}
        </div>
      </div>

      {/* Body (flex column so we can drop rows/blocks later) */}
      <div className="p-3 space-y-3">
        {/* KPI row placeholder */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg border border-gray-200 bg-gray-50/60 flex items-center justify-center text-xs text-gray-500"
            >
              KPI {i + 1}
            </div>
          ))}
        </div>

        {/* Trend/summary row placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="h-40 rounded-lg border border-gray-200 bg-gray-50/60 flex items-center justify-center text-xs text-gray-500">
            Trend A
          </div>
          <div className="h-40 rounded-lg border border-gray-200 bg-gray-50/60 flex items-center justify-center text-xs text-gray-500">
            Trend B
          </div>
        </div>

        {/* Alerts/notes placeholder */}
        <div className="h-24 rounded-lg border border-gray-200 bg-gray-50/60 flex items-center justify-center text-xs text-gray-500">
          Alerts / Notes
        </div>
      </div>
    </section>
  );
}