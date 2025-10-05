import React from 'react';
import { getAlignmentClasses } from '../../tableProps.js';

/**
 * D3Section - Scrolling footer section (C/D system, owns horizontal scrollbar)
 * 
 * This is the critical component that:
 * - Owns the horizontal scrollbar
 * - Drives D1 and D2 scroll synchronization
 * - Renders metric totals/footers
 */
export default function D3Section({
  columnKeys = [],
  totals = {},
  alignment = 'center',
  columnAlignments = {},
  styles = {},
  className = "",
  tableContext
}) {
  // Get layout from context
  const { layout } = tableContext || {};
  const { metricColWidth } = layout || {};
  const footerHeight = tableContext?.footerHeight || 35;
  
  // Calculate grid template and total width from column widths (like D1 and D2)
  const gridTemplate = columnKeys.map(key => `${metricColWidth || 80}px`).join(' ');
  const totalMetricWidth = columnKeys.reduce((sum, key) => sum + (metricColWidth || 80), 0);
  
  // Format value helper (same as B3)
  const formatVal = (key, val) => {
    if (val == null || val === "") return "";
    if (typeof val !== "number") return String(val);
    const k = String(key);
    if (k.includes("UPT") || k.includes("Attach Rate")) return val.toFixed(2);
    if (k.includes("Revenue") || k.includes("Net") || k.includes("AOV")) {
      return `$${Math.round(val).toLocaleString()}`;
    }
    return Math.round(val).toLocaleString();
  };
  
  return (
    <div className={className || "flex-1 overflow-x-auto overflow-y-hidden relative z-50"} ref={tableContext?.hBottomRef}>
      <div className="h-full" style={{ width: totalMetricWidth }}>
        <div
          className="grid"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {columnKeys.map((columnKey, i) => {
            const isLast = i === columnKeys.length - 1;
            
            // Get display value
            const display = formatVal(columnKey, totals?.[columnKey]) || "";
            
            // Get column-specific alignment
            const colAlignment = columnAlignments[columnKey] || alignment;
            
            // Build classes
            const baseClasses = styles.base || "flex items-center border-r border-gray-100 text-xs font-medium text-gray-700 h-full whitespace-nowrap tabular-nums relative z-50";
            const backgroundClasses = styles.background || "bg-gradient-to-t from-gray-50 via-white to-gray-100";
            const customClasses = styles.classes || "";
            const roundedClasses = isLast && styles.rounded ? styles.rounded : "";
            
            const className = `${baseClasses} ${backgroundClasses} ${customClasses} ${roundedClasses} ${getAlignmentClasses(colAlignment)}`.trim();
            
            return (
              <div
                key={`d3-${columnKey}`}
                className={className}
                style={{ height: footerHeight }}
                title={display}
              >
                {display}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}