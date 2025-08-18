// src/features/storeDashboard/components/visualStoreTrends.jsx
// Two compact selectors (TF1/TF2) + chart placeholder using short labels.

import React, { useMemo, useState } from "react";
import { TIMEFRAME1, TIMEFRAME2 } from "@/utilities/timeFrames.js";
import { getTf1Label, getTf2Label } from "@/utilities/timeFrameLabels.js";

export default function VisualStoreTrends() {
  const [tf1, setTf1] = useState("this_week");
  const [tf2, setTf2] = useState("last_week");

  const tf1Label = useMemo(() => getTf1Label(tf1), [tf1]);
  const tf2Label = useMemo(() => getTf2Label(tf2), [tf2]);

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
            {TIMEFRAME1.map((id) => (
              <option key={`tf1-${id}`} value={id} className="text-[11px]">
                {getTf1Label(id)}
              </option>
            ))}
          </select>

          <span className="text-[12px] sm:text-[12px] text-gray-900">VS.</span>

          <select
            value={tf2}
            onChange={(e) => setTf2(e.target.value)}
            className="text-[11px] border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {TIMEFRAME2.map((id) => (
              <option key={`tf2-${id}`} value={id} className="text-[11px]">
                {getTf2Label(id)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart holder */}
      <div className="p-3">
        <div className="h-56 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50/60 flex items-center justify-center">
          <div className="text-xs text-gray-500 text-center">
            Chart placeholder — {tf1Label} vs {tf2Label}
          </div>
        </div>
      </div>
    </section>
  );
}