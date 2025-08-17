// ---------------------------------------------------
// KPIGrid.jsx – Static metric block shell
// ---------------------------------------------------

import React from "react";

export default function KPIGrid() {
  // Static placeholder data (no props or logic yet)
  const kpis = [
    { label: "Revenue", value: "$52,400" },
    { label: "Orders", value: "1,238" },
    { label: "AOV", value: "$42.30" },
    { label: "Conversion", value: "5.1%" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* 
        grid               → enable grid layout
        grid-cols-2        → 2 columns on mobile
        md:grid-cols-4     → 4 columns on medium+ screens
        gap-4              → 1rem gap between items
      */}
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
        >
          {/* 
            bg-white          → white card
            border            → 1px gray border
            rounded-lg        → rounded edges
            p-4               → padding inside card
            shadow-sm         → subtle card shadow
          */}
          <p className="text-xs text-gray-500">{kpi.label}</p>
          <p className="text-lg font-semibold text-gray-900">{kpi.value}</p>
        </div>
      ))}
    </div>
  );
}