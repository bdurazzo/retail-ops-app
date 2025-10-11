import React from 'react';

export default function TabDisplay({ query }) {

      console.log("TabDisplay received:", query);
  console.log("TabDisplay query.time:", query?.time);
  
  // Helper to format date range
  const formatDateRange = (timeConfig) => {
    if (!timeConfig) return "All Time";
    
    const { startDate, endDate, startYYYYMM, endYYYYMM } = timeConfig;
    
    if (startDate && endDate) {
      return `${startDate} → ${endDate}`;
    } else if (startYYYYMM && endYYYYMM) {
      return `${startYYYYMM} → ${endYYYYMM}`;
    }
    
    return "Date Range";
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
      <span className="text-gray-600 font-medium">Date Range:</span>
      <span className="text-gray-900 font-medium">
        {formatDateRange(query?.time)}
      </span>
    </div>
  );
}