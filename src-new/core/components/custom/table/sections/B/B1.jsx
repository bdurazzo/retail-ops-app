import React from 'react';
import { isColumnSortable, getSortIndicator } from '../../../../../utils/tableSorting.js';
import { getAlignmentClasses } from '../../tableProps.js';

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
  pluginComponents = {},
  tableContext
}) {
  // Get layout and drag/drop handlers from context
  const { layout, onHeaderDragStart: onHeaderDragStartContext, isTransitioning: isTransitioningContext } = tableContext || {};
  const { metricColWidth } = layout || {};
  const headerHeight = tableContext?.headerHeight || 35;

  // Use explicit props if provided, otherwise fall back to context
  const onHeaderDragStart = onHeaderDragStartProp || onHeaderDragStartContext;
  const isTransitioning = isTransitioningProp ?? isTransitioningContext;

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

            // Handle plugin drop on column header
            const handleColumnPluginDrop = (e) => {
              e.preventDefault();
              if (onColumnDrop) {
                const droppedData = JSON.parse(e.dataTransfer.getData('text/plain'));
                onColumnDrop(columnKey, droppedData);
              }
            };

            const handleColumnDragOver = (e) => {
              // Only preventDefault for drag events, not wheel/scroll
              if (e.dataTransfer) {
                e.preventDefault();
              }
            };

            // Check if this column has a plugin
            const columnData = columnState[columnKey];
            const ColumnPluginComponent = columnData?.type && pluginComponents?.[columnData.type];

            // Build classes - use pluginCell if plugin exists
            const baseClasses = ColumnPluginComponent
              ? (styles.pluginCell || styles.base || "")
              : isPlaceholder
                ? (styles.placeholder || "flex-none px-3 flex items-center justify-center text-[11px] text-gray-400 font-semibold relative z-50 bg-gradient-to-b from-gray-50 via-white to-gray-100 border-r border-b border-gray-100")
                : (styles.base || "flex-none px-3 flex items-center text-xs text-gray-600 font-semibold relative z-50 transition-colors");
            const sortableClasses = sortable ? (styles.sortable || "") : "";
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
                draggable={!!onHeaderDragStart}
                onDragStart={onHeaderDragStart ? (e) => onHeaderDragStart(e, columnKey) : undefined}
                onDrop={handleColumnPluginDrop}
                onDragOver={handleColumnDragOver}
              >
                {ColumnPluginComponent ? (
                  <ColumnPluginComponent
                    columnKey={columnKey}
                    columnState={columnState}
                    onColumnStateUpdate={onColumnStateUpdate}
                  />
                ) : (
                  <>
                    <span className={isTransitioning ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
                      {displayLabel}
                    </span>
                    {sortKey === columnKey && (
                      <span className="inline-block text-gray-600 leading-none" aria-hidden>
                        {getSortIndicator(columnKey, sortKey, sortDirection)}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
