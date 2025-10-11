import React from 'react';
import { isColumnSortable, getSortIndicator } from '../../../../../utils/tableSorting.js';
import { getAlignmentClasses } from '../../tableProps.js';

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
    isTransitioning: isTransitioningContext
  } = tableContext || { headerHeight: 35, firstColWidth: 120 };

  // Use explicit props if provided, otherwise fall back to context
  const onA1Drop = onA1DropProp || onA1DropContext;
  const onDragOver = onDragOverProp || onDragOverContext;
  const isTransitioning = isTransitioningProp ?? isTransitioningContext;

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
        const handleClick = sortable ? () => onSort(columnKey) : undefined;

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

        // Build classes - use pluginCell if plugin exists, otherwise normal styling
        const baseClasses = ColumnPluginComponent
          ? (styles.pluginCell || styles.base || "")
          : isPlaceholder
            ? (styles.placeholder || "flex-none px-3 flex items-center justify-center text-xs text-gray-400 border-b border-r border-gray-100 font-semibold relative z-50 bg-gradient-to-b from-gray-50 via-white to-gray-100")
            : (styles.base || "flex-none px-3 flex items-center text-xs shadow-lg shadow-gray-300 text-gray-600 font-semibold relative z-50 transition-colors");
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
        const label = a1HeaderLabel || displayLabel;

        return (
          <div
            key={columnKey}
            className={className}
            style={{ width: colWidth, height: headerHeight }}
            title={columnKey}
            onClick={handleClick}
            onDrop={onA1Drop || handleColumnPluginDrop}
            onDragOver={onDragOver || handleColumnDragOver}
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
                  {label}
                </span>
                {sortKey === columnKey && (
                  <span className="ml-1 text-gray-600">
                    {getSortIndicator(columnKey, sortKey, sortDirection)}
                  </span>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
