import React from 'react';
import { getAlignmentClasses } from '../../tableProps.js';

/**
 * A3Section - Fixed footer left section (A/B system)
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
  className = "",
  tableContext,
  // Empty state props (from container)
  isEmpty = false,
  emptyConfig = {}
}) {
  // Get layout from context
  const { firstColWidth, footerHeight } = tableContext || { firstColWidth: 120, footerHeight: 35 };

  // If empty, render empty state from container config
  if (isEmpty) {
    return (
      <div
        className={emptyConfig.className || className || "flex-none flex border-t relative z-50"}
        style={{ width: emptyConfig.width || firstColWidth, height: emptyConfig.height || footerHeight }}
      >
        <span>{emptyConfig.placeholder}</span>
      </div>
    );
  }

  // Calculate total width for fixed columns
  const totalWidth = columnKeys.reduce((sum, key) => {
    return sum + (columnWidths[key] || firstColWidth);
  }, 0);

  // Old empty state handling - remove this block
  if (false) {
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
        const isPlaceholder = columnKey.startsWith('_placeholder');
        const colWidth = columnWidths[columnKey] || firstColWidth;
        const colAlignment = columnAlignments[columnKey] || alignment;

        // Build classes - use placeholder styling if needed
        const baseClasses = isPlaceholder
          ? (styles.placeholder || "flex-none shadow-gray-200 shadow flex border-t border-gray-100 items-center justify-center text-xs font-semibold text-gray-400 relative z-[60] bg-gradient-to-t from-gray-100 via-white to-gray-100")
          : (styles.base || "flex-none shadow-gray-300 shadow-lg flex items-center text-xs font-semibold text-gray-700 relative z-[60]");
        const backgroundClasses = isPlaceholder ? "" : (styles.background || "bg-gradient-to-t from-gray-50 via-white to-gray-100");
        const customClasses = styles.classes || "";
        const roundedClasses = (index === 0 && styles.rounded) ? styles.rounded : "";

        const className = `${baseClasses} ${backgroundClasses} ${customClasses} ${roundedClasses} ${getAlignmentClasses(colAlignment)}`.trim();

        // Get display value
        const displayValue = isPlaceholder ? "Drop column" : (totals?.[columnKey] || (index === 0 ? 'Total' : ''));

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
