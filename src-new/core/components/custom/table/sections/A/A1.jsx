import React from 'react';
import { isColumnSortable, getSortIndicator } from '../../../../../utils/tableSorting.js';
import { getAlignmentClasses } from '../../tableProps.js';
import ChA1 from '../../../../module/table/channel/ChA1.jsx';

/**
 * A1Section - Fixed header left section (A/B system)
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
  className = "",
  // Empty state props (from container)
  isEmpty = false,
  emptyConfig = {},
  // Drag/drop handlers (can be passed as props or via tableContext)
  onA1Drop: onA1DropProp,
  onDragOver: onDragOverProp,
  isTransitioning: isTransitioningProp,
  // Plugin props (from TableHeader)
  onColumnDrop = null,
  columnState = {},
  onColumnStateUpdate = () => {},
  pluginComponents = {},
  tableContext
}) {
  // Get layout and drag/drop handlers from context
  const {
    headerHeight,
    firstColWidth,
    a1HeaderLabel,
    onA1Drop: onA1DropContext,
    onDragOver: onDragOverContext,
    isTransitioning: isTransitioningContext,
    sortKey: sortKeyContext,
    sortDirection: sortDirectionContext,
    onSort: onSortContext
  } = tableContext || { headerHeight: 35, firstColWidth: 120 };

  // Use explicit props if provided, otherwise fall back to context
  const onA1Drop = onA1DropProp || onA1DropContext;
  const onDragOver = onDragOverProp || onDragOverContext;
  const isTransitioning = isTransitioningProp ?? isTransitioningContext;
  const finalSortKey = sortKey !== undefined ? sortKey : sortKeyContext;
  const finalSortDirection = sortDirection !== undefined ? sortDirection : sortDirectionContext;
  const finalOnSort = onSort || onSortContext;

  // If empty, render empty state from container config
  if (isEmpty) {
    return (
      <div
        className={className || "flex-none flex relative z-50"}
        style={{ width: emptyConfig.width || firstColWidth }}
      >
        <div
          className={emptyConfig.className}
          style={{ width: emptyConfig.width || firstColWidth, height: emptyConfig.height || headerHeight }}
          onDrop={onA1Drop}
          onDragOver={onDragOver}
        >
          <span>{emptyConfig.placeholder}</span>
        </div>
      </div>
    );
  }

  // Calculate total width for fixed columns
  const totalWidth = columnKeys.reduce((sum, key) => {
    return sum + (columnWidths[key] || firstColWidth);
  }, 0);

  return (
    <div
      className={className || "flex-none flex relative z-50"}
      style={{ width: totalWidth }}
    >
      {columnKeys.map((columnKey, index) => {
        const isPlaceholder = columnKey.startsWith('_placeholder');
        const displayLabel = isPlaceholder ? "Drop column" : (columnLabels[columnKey] || columnKey);
        const colWidth = columnWidths[columnKey] || firstColWidth;
        const colAlignment = columnAlignments[columnKey] || alignment;

        // Determine if this column is sortable
        const sortable = !isPlaceholder && !disableSorting && isColumnSortable(columnKey);

        // Handle click
        const handleClick = sortable && finalOnSort ? () => finalOnSort(columnKey) : undefined;

        // Default header rendering
        const label = a1HeaderLabel || displayLabel;

        // Build classes - use pluginCell (px-0) for wrapper since ChA1 has its own padding
        const baseClasses = isPlaceholder
          ? (styles.placeholder || "flex-none px-3 flex items-center justify-center text-xs text-gray-400 border-b border-r border-gray-100 font-medium relative z-50 bg-gradient-to-b from-gray-100 via-white to-gray-100")
          : (styles.pluginCell || "flex-none px-0 flex items-center text-[11px] text-gray-600 font-medium relative z-50 transition-colors");
        const sortableClasses = sortable ? (styles.sortable || "hover:bg-gray-100 hover:text-white cursor-pointer") : (styles.nonSortable || "text-gray-200");
        const customClasses = styles.classes || "";
        const roundedClasses = (index === 0 && styles.rounded) ? styles.rounded : "";

        const className = `${baseClasses} ${sortableClasses} ${customClasses} ${roundedClasses} ${getAlignmentClasses(colAlignment)}`.trim();

        return (
          <div
            key={columnKey}
            className={className}
            style={{ width: colWidth, height: headerHeight }}
            title={columnKey}
            onClick={handleClick}
          >
            <ChA1
              columnKey={columnKey}
              columnLabel={label}
              columnState={columnState}
              onColumnStateUpdate={onColumnStateUpdate}
              tableContext={tableContext}
            />
          </div>
        );
      })}
    </div>
  );
}
