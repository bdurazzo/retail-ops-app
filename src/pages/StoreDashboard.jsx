// 📄 src/pages/StoreDashboard.jsx
// Page shell that renders ONLY the Overview window.

import React from "react";
import OverviewCard from "@/features/storeDashboard/components/OverviewCard.jsx";

export function StoreDashboard() {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gray-50">
      {/* Page title only */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Store Dashboard</h1>
      </header>

      {/* Single scrollable content area with just the Overview window */}
      <main className="flex-1 min-h-0 overflow-auto px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <OverviewCard />
        </div>
      </main>
    </div>
  );
}