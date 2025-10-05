import React from 'react';
import { isColumnSortable, getSortIndicator } from '../../../../../utils/tableSorting.js';
import { getAlignmentClasses } from '../../tableProps.js';

/**
 * C1Section - Fixed header left section (C/D system)
 * 
 * Renders the fixed column headers with:
 * - Fixed width positioning
 * - Multiple column support
 * - Sorting functionality
 * - Custom header renderers
 * - Proper z-index layering
 */
export default function C1Section({
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
  className = "",
  tableContext
}) {
  // Get layout and drag/drop handlers from context
  const {
    headerHeight,
    firstColWidth,
    c1HeaderLabel,
    onC1Drop,
    onDragOver,
    isTransitioning
  } = tableContext || { headerHeight: 35, firstColWidth: 120 };

  // Calculate total width for fixed columns
  const totalWidth = (!columnKeys || columnKeys.length === 0)
    ? firstColWidth
    : columnKeys.reduce((sum, key) => {
        return sum + (columnWidths[key] || firstColWidth);
      }, 0);

  // If no columns, render empty drop zone
  if (!columnKeys || columnKeys.length === 0) {
    return (
      <div
        className={className || "flex-none flex relative z-50"}
        style={{ width: firstColWidth }}
      >
        <div
          className="flex-none px-3 flex items-center justify-center text-xs shadow-lg shadow-gray-300 text-gray-400 font-semibold relative z-50 bg-gray-50 border-r border-gray-200"
          style={{ width: firstColWidth, height: headerHeight }}
          onDrop={onC1Drop}
          onDragOver={onDragOver}
        >
          <span className="text-gray-300">Drop here</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={className || "flex-none flex relative z-50"}
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
        const sortableClasses = sortable ? (styles.sortable || "hover:bg-gray-200 hover:text-white cursor-pointer") : (styles.nonSortable || "text-gray-200");
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
        
        // Default header rendering with drop zone support
        const label = c1HeaderLabel || displayLabel;

        return (
          <div
            key={columnKey}
            className={className}
            style={{ width: colWidth, height: headerHeight }}
            title={columnKey}
            onClick={handleClick}
            onDrop={onC1Drop}
            onDragOver={onDragOver}
          >
            <span className={isTransitioning ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
              {label}
            </span>
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