import React from 'react';
import { isColumnSortable, getSortIndicator } from '../../../../../utils/tableSorting.js';
import { getAlignmentClasses } from '../../tableProps.js';

/**
 * B1Section - Scrolling headers section
 * 
 * Renders metric column headers with:
 * - Grid-based layout
 * - Horizontal scroll sync via transform
 * - Sorting functionality
 * - Placeholder column support
 */
export default function B1Section({
  columnKeys = [],
  columnLabels = {},
  columnWidths = {},
  sortKey,
  sortDirection,
  onSort,
  disableSorting = false,
  alignment = 'center',
  columnAlignments = {},
  styles = {},
  tableContext
}) {
  // Get layout from context
  const { layout } = tableContext || {};
  const { metricColWidth } = layout || {};
  const headerHeight = tableContext?.headerHeight || 35;
  

  // Calculate grid template and total width from column widths
  const gridTemplate = columnKeys.map(key => `${columnWidths[key] || metricColWidth || 80}px`).join(' ');
  const totalMetricWidth = columnKeys.reduce((sum, key) => sum + (columnWidths[key] || metricColWidth || 80), 0);
  
  return (
    <div className="flex-1 overflow-hidden relative" ref={tableContext?.hTopRef} style={{ height: headerHeight }}>
      <div 
        className="h-full will-change-transform" 
        style={{ width: totalMetricWidth }} 
        ref={tableContext?.b1TrackRef}
      >
        <div
          className="grid h-full"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {columnKeys.map((columnKey, i) => {
            const sortable = !disableSorting && isColumnSortable(columnKey);
            const isLast = i === columnKeys.length - 1;
            const colAlignment = columnAlignments[columnKey] || alignment;
            
            // Get display label
            const displayLabel = columnLabels[columnKey] || columnKey;
            
            // Build classes
            const baseClasses = styles.base || "flex items-center gap-1 border-r border-gray-100 text-gray-600 text-xs font-semibold h-full whitespace-nowrap select-none transition-colors";
            const sortableClasses = sortable ? (styles.sortable || "hover:text-white hover:bg-gray-800 cursor-pointer") : (styles.nonSortable || "text-gray-600 cursor-default");
            const customClasses = styles.classes || "";
            const roundedClasses = isLast && styles.rounded ? styles.rounded : "";
            
            const className = `${baseClasses} ${sortableClasses} ${customClasses} ${roundedClasses} ${getAlignmentClasses(colAlignment)}`.trim();
            
            return (
              <button
                type="button"
                key={`b1-${columnKey}`}
                onClick={sortable ? () => onSort(columnKey) : undefined}
                className={className}
                title={String(columnKey)}
              >
                <span>{displayLabel}</span>
                {sortKey === columnKey && (
                  <span className="inline-block text-gray-600 leading-none" aria-hidden>
                    {getSortIndicator(columnKey, sortKey, sortDirection)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}