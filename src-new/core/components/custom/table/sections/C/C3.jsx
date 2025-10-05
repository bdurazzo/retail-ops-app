import React from 'react';
import { getAlignmentClasses } from '../../tableProps.js';

/**
 * C3Section - Fixed footer left section (C/D system)
 * 
 * Renders the fixed column footers with:
 * - Fixed width positioning
 * - Multiple column support
 * - Total/summary display
 * - Proper z-index layering
 */
export default function C3Section({
  columnKeys = [],
  columnWidths = {},
  totals = {},
  alignment = 'center',
  columnAlignments = {},
  styles = {},
  className = "",
  tableContext
}) {
  // Get layout from context
  const { firstColWidth, footerHeight } = tableContext || { firstColWidth: 120, footerHeight: 35 };

  // Calculate total width for fixed columns
  const totalWidth = (!columnKeys || columnKeys.length === 0)
    ? firstColWidth
    : columnKeys.reduce((sum, key) => {
        return sum + (columnWidths[key] || firstColWidth);
      }, 0);

  // If no columns, render empty placeholder
  if (!columnKeys || columnKeys.length === 0) {
    return (
      <div
        className={className || "flex-none flex relative z-[60]"}
        style={{ width: firstColWidth }}
      >
        <div
          className="flex-none shadow-gray-300 shadow-lg flex items-center text-xs font-semibold text-gray-700 relative z-[60] bg-gradient-to-t from-gray-50 via-white to-gray-100"
          style={{ width: firstColWidth, height: footerHeight }}
        />
      </div>
    );
  }
  
  return (
    <div
      className={className || "flex-none flex relative z-[60]"}
      style={{ width: totalWidth }}
    >
      {columnKeys.map((columnKey, index) => {
        const colWidth = columnWidths[columnKey] || firstColWidth;
        const colAlignment = columnAlignments[columnKey] || alignment;
        
        // Build classes
        const baseClasses = styles.base || "flex-none shadow-gray-300 shadow-lg flex items-center text-xs font-semibold text-gray-700 relative z-[60]";
        const backgroundClasses = styles.background || "bg-gradient-to-t from-gray-50 via-white to-gray-100";
        const customClasses = styles.classes || "";
        const roundedClasses = (index === 0 && styles.rounded) ? styles.rounded : "";
        
        const className = `${baseClasses} ${backgroundClasses} ${customClasses} ${roundedClasses} ${getAlignmentClasses(colAlignment)}`.trim();
        
        // Get display value
        const displayValue = totals?.[columnKey] || (index === 0 ? 'Total' : '');
        
        return (
          <div
            key={columnKey}
            className={className}
            style={{ width: colWidth, height: footerHeight }}
          >
            {displayValue}
          </div>
        );
      })}
    </div>
  );
}