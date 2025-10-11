// 📄 src/pages/StoreDashboard.jsx

import React from "react";
import OverviewCard from "@/features/store/components/OverviewCard.jsx";
import VisualStoreTrends from "@/features/store/components/visualStoreTrends.jsx";

export function Store() {
  return (
    <div className="h-full flex flex-col px-4 py-6 relative">
      {/* Page title only */}
        <h1 className="text-xl font-bold text-gray-900">Store Dashboard</h1>

      {/* Single scrollable content area with just the Overview window */}
      <main className="flex-1 min-h-0 overflow-auto px-2 py-3">
        <div className="flex-1 overflow-auto px-2 py-2">
          <VisualStoreTrends />
          <div className="mb-6">
        
          
        </div> 

        <div className="mx-auto max-w-6xl">
          <OverviewCard />
          </div>
        </div>
      </main>
    </div>
  );
}