import React from 'react';
import { getAlignmentClasses } from '../../tableProps.js';

/**
 * B3Section - Scrolling footer section (A/B system, owns horizontal scrollbar)
 *
 * This is the critical component that:
 * - Owns the horizontal scrollbar
 * - Drives B1 and B2 scroll synchronization
 * - Renders metric totals/footers
 */
export default function B3Section({
  columnKeys = [],
  columnWidths = {},
  totals = {},
  alignment = 'center',
  columnAlignments = {},
  styles = {},
  className = "",
  tableContext,
  // Empty state props (from container)
  isEmpty = false,
  emptyConfig = {}
}) {
  // Get layout from context
  const { layout } = tableContext || {};
  const { metricColWidth } = layout || {};
  const footerHeight = tableContext?.footerHeight || 35;

  // If empty, render empty state from container config
  if (isEmpty) {
    return (
      <div
        className={emptyConfig.className || className || "flex-1 overflow-x-auto overflow-y-hidden relative z-50"}
        ref={tableContext?.hBottomRef}
        style={{ minWidth: emptyConfig.minWidth, height: emptyConfig.height || footerHeight }}
      >
        <span>{emptyConfig.placeholder}</span>
      </div>
    );
  }

  // Calculate grid template and total width from column widths (like B1 and B2)
  const gridTemplate = columnKeys.map(key => `${columnWidths[key] || metricColWidth || 80}px`).join(' ');
  const totalMetricWidth = columnKeys.reduce((sum, key) => sum + (columnWidths[key] || metricColWidth || 80), 0);

  console.log('B3: columnKeys:', columnKeys);
  console.log('B3: totalMetricWidth:', totalMetricWidth);
  console.log('B3: gridTemplate:', gridTemplate);

  // Format value helper (same as B2)
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
            const isPlaceholder = columnKey.startsWith('_placeholder');
            const isLast = i === columnKeys.length - 1;

            // Get display value
            const display = isPlaceholder ? "\u00A0" : (formatVal(columnKey, totals?.[columnKey]) || "");

            // Get column-specific alignment
            const colAlignment = columnAlignments[columnKey] || alignment;

        const baseClasses = isPlaceholder
          ? (styles.placeholder || "flex-none shadow-gray-300 flex border-t border-r border-gray-100 items-center justify-center text-xs font-semibold text-gray-400 relative z-[60] bg-gradient-to-t from-gray-100 via-white to-gray-100")
          : (styles.base || "flex-none border-t border-r border-gray-100 flex items-center text-xs font-semibold text-gray-700 relative z-[60]");
            const backgroundClasses = isPlaceholder ? "" : (styles.background || "bg-gradient-to-t from-gray-50 via-white to-gray-100");
            const customClasses = styles.classes || "";
            const roundedClasses = isLast && styles.rounded ? styles.rounded : "";

            const className = `${baseClasses} ${customClasses} ${roundedClasses} ${getAlignmentClasses(colAlignment)}`.trim();

            return (
              <div
                key={`b3-${columnKey}`}
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
