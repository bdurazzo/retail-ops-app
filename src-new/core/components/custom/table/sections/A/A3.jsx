import React from 'react';
import { getAlignmentClasses } from '../../tableProps.js';

/**
 * A3Section - Fixed footer left section
 * 
 * Renders the fixed column footers with:
 * - Fixed width positioning
 * - Multiple column support
 * - Total/summary display
 * - Proper z-index layering
 */
export default function A3Section({
  columnKeys = [],
  columnWidths = {},
  totals = {},
  alignment = 'center',
  columnAlignments = {},
  styles = {},
  tableContext
}) {
  // Get layout from context
  const { firstColWidth, footerHeight } = tableContext || { firstColWidth: 120, footerHeight: 35 };
  
  // Handle empty columns
  if (!columnKeys || columnKeys.length === 0) return null;
  
  // Calculate total width for fixed columns
  const totalWidth = columnKeys.reduce((sum, key) => {
    return sum + (columnWidths[key] || firstColWidth);
  }, 0);
  
  return (
    <div 
      className="flex-none flex relative z-[60]"
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