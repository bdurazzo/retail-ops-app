// src/features/storeDashboard/components/VisualStoreTrends.jsx
// UI-only shell: two compact selectors + a chart placeholder using short labels.
// Layout unchanged. No data fetching or external state.

import React, { useMemo, useState } from "react";

// ---------- Local timeframe choices (placeholders) ----------
const TF1 = ["this_week", "last_week", "last_7d", "this_month", "last_month"];
const TF2 = ["last_week", "prev_week", "last_7d", "last_30d", "last_month"];

// Short labels for the dropdowns
const TF_LABEL = {
  this_week:  "This Week",
  last_week:  "Last Week",
  prev_week:  "2 Weeks Ago",
  last_7d:    "Last 7 Days",
  last_30d:   "Last 30 Days",
  this_month: "This Month",
  last_month: "Last Month",
};

// ---------- Range helpers (US Retail Week: Sun..Sat) ----------
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay   = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

function retailWeekRange(anchor = new Date(), offsetWeeks = 0) {
  const a = new Date(anchor);
  a.setDate(a.getDate() + offsetWeeks * 7);
  const dow = a.getDay();            // 0..6, Sun=0
  const sunday = new Date(a); sunday.setDate(a.getDate() - dow);
  const saturday = new Date(sunday); saturday.setDate(sunday.getDate() + 6);
  return { start: startOfDay(sunday), end: endOfDay(saturday) };
}

function monthRange(anchor = new Date(), offsetMonths = 0) {
  const y = anchor.getFullYear();
  const m = anchor.getMonth() + offsetMonths;
  const start = new Date(y, m, 1);
  const end   = new Date(y, m + 1, 0);
  return { start: startOfDay(start), end: endOfDay(end) };
}

function lastNDays(n, endAnchor = new Date()) {
  const end = endOfDay(endAnchor);
  const start = new Date(end);
  start.setDate(end.getDate() - (n - 1));
  return { start: startOfDay(start), end };
}

function rangeForId(id) {
  switch (id) {
    case "this_week":  return retailWeekRange(new Date(), 0);
    case "last_week":  return retailWeekRange(new Date(), -1);
    case "prev_week":  return retailWeekRange(new Date(), -2);
    case "this_month": return monthRange(new Date(), 0);
    case "last_month": return monthRange(new Date(), -1);
    case "last_7d":    return lastNDays(7);
    case "last_30d":   return lastNDays(30);
    default:             return lastNDays(7);
  }
}

// ---------- Lightweight chart shell (placeholder) ----------
function TrendChart({ anchorRange, compareRange, label1, label2 /*, series1, series2*/ }) {
  return (
    <div
      className="h-56 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50/60 flex items-center justify-center"
      data-tf1-start={anchorRange?.start?.toISOString?.()}
      data-tf1-end={anchorRange?.end?.toISOString?.()}
      data-tf2-start={compareRange?.start?.toISOString?.()}
      data-tf2-end={compareRange?.end?.toISOString?.()}
    >
      <div className="text-xs text-gray-500 text-center">
        {label1} vs {label2}
      </div>
    </div>
  );
}

// ---------- UI-only component ----------
export default function VisualStoreTrends() {
  // Local UI state for selectors
  const [tf1, setTf1] = useState("this_week");
  const [tf2, setTf2] = useState("last_week");

  const tf1Label = TF_LABEL[tf1] || "This Week";
  const tf2Label = TF_LABEL[tf2] || "Last Week";

  // Compute ranges only for display/testing (no data fetch)
  const anchorRange = useMemo(() => rangeForId(tf1), [tf1]);
  const compareRange = useMemo(() => rangeForId(tf2), [tf2]);

  return (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Selectors */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <select
            value={tf1}
            onChange={(e) => setTf1(e.target.value)}
            className="text-[11px] border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {TF1.map((id) => (
              <option key={`tf1-${id}`} value={id} className="text-[11px]">
                {TF_LABEL[id]}
              </option>
            ))}
          </select>

          <span className="text-[12px] sm:text-[12px] text-gray-900">VS.</span>

          <select
            value={tf2}
            onChange={(e) => setTf2(e.target.value)}
            className="text-[11px] border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {TF2.map((id) => (
              <option key={`tf2-${id}`} value={id} className="text-[11px]">
                {TF_LABEL[id]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart holder */}
      <div className="p-3">
        <TrendChart
          anchorRange={anchorRange}
          compareRange={compareRange}
          label1={tf1Label}
          label2={tf2Label}
          // series1={series1}
          // series2={series2}
        />
      </div>
    </section>
  );
}
