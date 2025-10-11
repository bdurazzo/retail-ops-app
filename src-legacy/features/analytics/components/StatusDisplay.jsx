// src/features/analytics/components/StatusDisplay.jsx

import React from 'react';

export function StatusDisplay({ query, loading, error, meta }) {
  // Helper function to safely format missing months
  const formatMissingMonths = (missing) => {
    if (!missing || !Array.isArray(missing)) return "";
    
    return missing.map(m => {
      // Handle both object and primitive formats
      if (typeof m === 'object' && m !== null) {
        // Convert any Date objects or complex objects to strings
        const yyyy = String(m.yyyy || '');
        const mm = String(m.mm || '').padStart(2, '0');
        return `${yyyy}-${mm}`;
      }
      return String(m); // Fallback for primitive values
    }).join(", ");
  };

  return (
    <div className="text-xs text-gray-500 mb-2">
      {query?.time
        ? <>Range: {String(query.time.startYYYYMM)} → {String(query.time.endYYYYMM)}</>
        : "No range selected"}
      {loading ? " • loading…" : ""}
      {error ? ` • error: ${String(error.message || error)}` : ""}
      {!loading && meta?.missing?.length
        ? ` • missing: ${formatMissingMonths(meta.missing)}`
        : ""}
    </div>
  );
}