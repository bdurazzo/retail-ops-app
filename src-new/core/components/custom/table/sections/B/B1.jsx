import React from 'react';
import { isColumnSortable, getSortIndicator } from '../../../../../utils/tableSorting.js';
import { getAlignmentClasses } from '../../tableProps.js';
import ChB1 from '../../../../module/table/channel/ChB1.jsx';

/**
 * B1Section - Scrolling headers section (A/B system)
 *
 * Renders metric column headers with:
 * - Grid-based layout
 * - Horizontal scroll sync via transform
 * - Sorting functionality
 * - Placeholder column support
 */
export default function B1Section({
  columnKeys = [],
  allColumnKeys = [], // All possible columns for picker
  columnLabels = {},
  columnWidths = {},
  sortKey,
  sortDirection,
  onSort,
  disableSorting = false,
  alignment = 'center',
  columnAlignments = {},
  styles = {},
  className = "",
  // Empty state props (from container)
  isEmpty = false,
  emptyConfig = {},
  // Drag/drop handlers (can be passed as props or via tableContext)
  onHeaderDragStart: onHeaderDragStartProp,
  isTransitioning: isTransitioningProp,
  // Plugin props (from TableHeader)
  onColumnDrop = null,
  columnState = {},
  onColumnStateUpdate = () => {},
  onColumnSwap = () => {},
  pluginComponents = {},
  tableContext
}) {
  // Get layout and drag/drop handlers from context
  const {
    layout,
    onHeaderDragStart: onHeaderDragStartContext,
    isTransitioning: isTransitioningContext,
    sortKey: sortKeyContext,
    sortDirection: sortDirectionContext,
    onSort: onSortContext
  } = tableContext || {};
  const { metricColWidth } = layout || {};
  const headerHeight = tableContext?.headerHeight || 35;

  // Use explicit props if provided, otherwise fall back to context
  const onHeaderDragStart = onHeaderDragStartProp || onHeaderDragStartContext;
  const isTransitioning = isTransitioningProp ?? isTransitioningContext;
  const finalSortKey = sortKey !== undefined ? sortKey : sortKeyContext;
  const finalSortDirection = sortDirection !== undefined ? sortDirection : sortDirectionContext;
  const finalOnSort = onSort || onSortContext;

  // If empty, render empty state from container config
  if (isEmpty) {
    return (
      <div
        className={emptyConfig.className || className || "flex-1 overflow-hidden relative"}
        ref={tableContext?.hTopRef}
        style={{ height: emptyConfig.height || headerHeight, minWidth: emptyConfig.minWidth }}
      >
        <span>{emptyConfig.placeholder}</span>
      </div>
    );
  }

  // Calculate grid template and total width from column widths
  const gridTemplate = columnKeys.map(key => `${columnWidths[key] || metricColWidth || 80}px`).join(' ');
  const totalMetricWidth = columnKeys.reduce((sum, key) => sum + (columnWidths[key] || metricColWidth || 80), 0);

  console.log('B1: columnKeys:', columnKeys);
  console.log('B1: allColumnKeys:', allColumnKeys);
  console.log('B1: totalMetricWidth:', totalMetricWidth);

  return (
    <div className={className || "flex-1 overflow-hidden relative"} ref={tableContext?.hTopRef} style={{ height: headerHeight }}>
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
            const isPlaceholder = columnKey.startsWith('_placeholder');
            const sortable = !isPlaceholder && !disableSorting && isColumnSortable(columnKey);
            const isLast = i === columnKeys.length - 1;
            const colAlignment = columnAlignments[columnKey] || alignment;

            // Get display label
            const displayLabel = isPlaceholder ? "Drop Column" : (columnLabels[columnKey] || columnKey);

            // Build classes - use pluginCell (px-0) for ChB1 wrapper since ChB1 has its own padding
            const baseClasses = isPlaceholder
              ? (styles.placeholder || "flex-none px-3 flex items-center justify-center text-[11px] text-gray-400 font-semibold relative z-50 bg-gradient-to-b from-gray-50 via-white to-gray-100 border-r border-b border-gray-100")
              : (styles.pluginCell || "flex-none px-0 flex items-center text-xs text-gray-600 font-semibold relative z-50 transition-colors");
            const sortableClasses = sortable ? (styles.sortable || "") : "";
            const customClasses = styles.classes || "";
            const roundedClasses = isLast && styles.rounded ? styles.rounded : "";

            const className = `${baseClasses} ${sortableClasses} ${customClasses} ${roundedClasses} ${getAlignmentClasses(colAlignment)}`.trim();

            const handleClick = sortable && finalOnSort ? () => finalOnSort(columnKey) : undefined;

            return (
              <div
                key={`b1-${columnKey}`}
                className={`${className} pointer-events-none`}
                title={String(columnKey)}
                draggable={!!onHeaderDragStart}
                onDragStart={onHeaderDragStart ? (e) => onHeaderDragStart(e, columnKey) : undefined}
              >
                <div className="pointer-events-auto w-full h-full" onClick={handleClick}>
                  <ChB1
                    columnKey={columnKey}
                    columnLabel={displayLabel}
                    columnKeys={columnKeys}
                    allColumnKeys={allColumnKeys}
                    columnLabels={columnLabels}
                    columnState={columnState}
                    onColumnStateUpdate={onColumnStateUpdate}
                    onColumnSwap={onColumnSwap}
                    tableContext={tableContext}
                    sortable={sortable}
                    onSort={sortable && finalOnSort ? () => finalOnSort(columnKey) : undefined}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
