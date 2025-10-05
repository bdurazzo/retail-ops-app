import React from 'react';
import { getAlignmentClasses, formatValue } from '../../tableProps.js';

/**
 * B3Section - Scrolling footer section (owns horizontal scrollbar)
 *
 * This is the critical component that:
 * - Owns the horizontal scrollbar
 * - Drives B1 and B2 scroll synchronization
 * - Renders metric totals/footers
 */
export default function B3Section({
  columnKeys = [],
  totals = {},
  alignment = 'center',
  columnAlignments = {},
  styles = {},
  tableContext
}) {
  // Get layout from context
  const metricColWidth = tableContext?.layout?.metricColWidth || 80;
  const footerHeight = tableContext?.footerHeight || 35;

  // Calculate grid template from columnKeys
  const gridTemplate = columnKeys.map(() => `${metricColWidth}px`).join(' ');
  const totalMetricWidth = columnKeys.length * metricColWidth;

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden relative z-50" ref={tableContext?.hBottomRef}>
      <div className="h-full" style={{ width: totalMetricWidth }}>
        <div
          className="grid"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {columnKeys.map((columnKey, i) => {
            const isLast = i === columnKeys.length - 1;

            // Get display value
            const display = formatValue(columnKey, totals?.[columnKey]);

            // Get column-specific alignment
            const colAlignment = columnAlignments[columnKey] || alignment;

            // Build classes from styles
            const baseClasses = styles.base || "flex items-center border-r border-gray-100 text-xs font-medium text-gray-700 h-full whitespace-nowrap tabular-nums relative z-50";
            const backgroundClasses = styles.background || "bg-gradient-to-t from-gray-50 via-white to-gray-100";
            const customClasses = styles.classes || "";
            const roundedClasses = isLast && styles.rounded ? styles.rounded : "";

            const className = `${baseClasses} ${backgroundClasses} ${customClasses} ${roundedClasses} ${getAlignmentClasses(colAlignment)}`.trim();

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
