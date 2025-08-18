// 📄 src/features/storeDashboard/components/visualStoreTrends.jsx
// Minimal husk per user request:
//  • Pseudo-header with two scrollable selectors: A Week vs B Week
//  • Single chart card placeholder
//  • No metric buttons/footers yet

import React, { useMemo, useState } from "react";
import { getTimeframeLabel } from "@/utilities/timeFrameLabels.js";

export default function VisualStoreTrends() {
  const [tf1, setTf1] = useState("this_week");
  const [tf2, setTf2] = useState("last_week");

  const tf1Label = useMemo(() => getTimeframeLabel(tf1), [tf1]);
  const tf2Label = useMemo(() => getTimeframeLabel(tf2), [tf2]);

  return (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* ─── Pseudo header: "A Week —vs— B Week" with native <select> (scrollable) ─── */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-200">

        <div className="flex items-center gap-2">
          {/* A Week selector */}
            <select
              value={tf1}
              onChange={(e) => setTf1(e.target.value)}
              className="text-[11px] border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {(TIMEFRAMES || []).map((t) => (
                <option key={`1-${t.id}`} value={t.id} className="text-[11px]">
                  {getTimeframeLabel(t.id)}
                </option>
              ))}
            </select>

          <span className="text-[14px] text-gray-900">compared to</span>

          {/* B Week selector */}
            <select
              value={tf2}
              onChange={(e) => setTf2(e.target.value)}
              className="text-[11px] border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {(TIMEFRAMES || []).map((t) => (
                <option key={`2-${t.id}`} value={t.id} className="text-[11px]">
                  {getTimeframeLabel(t.id)}
                </option>
              ))}
            </select>
        </div>
      </div>

      {/* ─── Chart holder ─── */}
      <div className="p-3">
        <div className="h-56 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50/60 flex items-center justify-center">
          <div className="text-xs text-gray-500 text-center">
            Chart placeholder — {tf1Label} vs {tf2Label}
            <div className="text-[11px] text-gray-400 mt-1">
              (Next: wire to real data & render comparison series)
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}