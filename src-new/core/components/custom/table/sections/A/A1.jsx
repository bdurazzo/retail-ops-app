import React from 'react';
import { isColumnSortable, getSortIndicator } from '../../../../../utils/tableSorting.js';
import { getAlignmentClasses } from '../../tableProps.js';

/**
 * A1Section - Fixed header left section
 * 
 * Renders the fixed column headers with:
 * - Fixed width positioning
 * - Multiple column support
 * - Sorting functionality
 * - Custom header renderers
 * - Proper z-index layering
 */
export default function A1Section({
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
  customRenderer = null,
  tableContext
}) {
  // Get layout from context
  const { headerHeight, firstColWidth } = tableContext || { headerHeight: 35, firstColWidth: 120 };

  console.log('A1 styles prop:', styles);
  

  // Handle empty or single column for backward compatibility
  if (!columnKeys || columnKeys.length === 0) return null;
  
  // Calculate total width for fixed columns
  const totalWidth = columnKeys.reduce((sum, key) => {
    return sum + (columnWidths[key] || firstColWidth);
  }, 0);
  
  return (
    <div 
      className="flex-none flex relative z-50"
      style={{ width: totalWidth }}
    >
      {columnKeys.map((columnKey, index) => {
        const displayLabel = columnLabels[columnKey] || columnKey;
        const colWidth = columnWidths[columnKey] || firstColWidth;
        const colAlignment = columnAlignments[columnKey] || alignment;
        
        // Determine if this column is sortable
        const sortable = !disableSorting && isColumnSortable(columnKey);
        
        // Handle click
        const handleClick = sortable ? () => onSort(columnKey) : undefined;
        
        // Build classes
        const baseClasses = styles.base || "flex-none px-3 flex items-center text-xs shadow-lg shadow-gray-300 text-gray-600 font-semibold relative z-50 transition-colors";
        const sortableClasses = sortable ? (styles.sortable || "hover:bg-gray-800 hover:text-white cursor-pointer") : (styles.nonSortable || "text-gray-200");
        const customClasses = styles.classes || "";
        const roundedClasses = (index === 0 && styles.rounded) ? styles.rounded : "";
        
        const className = `${baseClasses} ${sortableClasses} ${customClasses} ${roundedClasses} ${getAlignmentClasses(colAlignment)}`.trim();
        
        // Render custom content if provided
        if (customRenderer && customRenderer[columnKey]) {
          const customContent = customRenderer[columnKey](columnKey, displayLabel);
          
          // Handle special full-width toolbar case
          if (customContent && typeof customContent === 'object' && customContent.type === 'fullWidthToolbar') {
            return customContent.component;
          }
          
          return (
            <div
              key={columnKey}
              className={className}
              style={{ width: colWidth, height: headerHeight }}
              title={columnKey}
              onClick={handleClick}
            >
              {customContent}
            </div>
          );
        }
        
        // Default header rendering
        return (
          <div
            key={columnKey}
            className={className}
            style={{ width: colWidth, height: headerHeight }}
            title={columnKey}
            onClick={handleClick}
          >
            <span>{displayLabel}</span>
            {sortKey === columnKey && (
              <span className="ml-1 text-gray-600">
                {getSortIndicator(columnKey, sortKey, sortDirection)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}