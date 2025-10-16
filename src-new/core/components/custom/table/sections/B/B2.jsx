import React from 'react';
import { getAlignmentClasses } from '../../tableProps.js';
import ChB2 from '../../../../module/table/channel/ChB2.jsx';

/**
 * B2Section - Scrolling body section
 * 
 * Renders metric column data with:
 * - Grid-based layout
 * - Shared vertical scroll
 * - Horizontal scroll sync via transform  
 * - Custom cell renderers
 * - Placeholder support
 */
export default function B2Section({
  columnKeys = [],
  columnWidths = {},
  rows = [],
  alignment = 'center',
  columnAlignments = {},
  styles = {},
  customCellRenderer = {},
  tableContext,
  onCellDrop = null,
  cellState = {},
  onCellStateUpdate = () => {},
  expandedRows = {},
  toggleRowExpanded = () => {},
  tableContainerWidth = 0,
  pluginComponents = {},
  // Empty state props (from container)
  isEmpty = false,
  emptyConfig = {}
}) {
  // Get layout from context
  const { layout } = tableContext || {};
  const { metricColWidth, firstColWidth } = layout || {};
  const rowHeight = tableContext?.rowHeight || 50;

  // If empty, render empty state from container config
  if (isEmpty) {
    return (
      <div
        className={emptyConfig.className || "flex-1 min-h-0 relative z-0"}
        ref={tableContext?.b2TrackRef}
        style={{ minWidth: emptyConfig.minWidth, minHeight: emptyConfig.minHeight }}
      >
        <span>{emptyConfig.placeholder}</span>
      </div>
    );
  }

  // Calculate grid template and total width from column widths
  const gridTemplate = columnKeys.map(key => `${columnWidths[key] || metricColWidth || 80}px`).join(' ');
  const totalMetricWidth = columnKeys.reduce((sum, key) => sum + (columnWidths[key] || metricColWidth || 80), 0);
  
  // Format value helper
  const formatVal = (key, val) => {
    if (val == null || val === "") return "";
    if (typeof val !== "number") return String(val);
    const k = String(key);
    if (k.includes("UPT") || k.includes("Attach Rate")) return val.toFixed(2);
    if (k.includes("Revenue") || k.includes("Net") || k.includes("AOV")) {
      return `$${Math.round(val).toLocaleString()}`;
    }
    return Math.round(val).toLocaleString();
  };
  
  return (
    <div className="flex-1 min-h-0 relative">
      <div
        ref={tableContext?.b2TrackRef}
        className="will-change-transform transform-gpu relative"
        style={{ width: totalMetricWidth }}
      >
        {rows.map((row, rIdx) => {
          // Skip plugin rows (already rendered in A2)
          if (row && row._selectPlugin) {
            return null;
          }

          // Check if A_KEY custom renderer returns a full-width component
          const aColumnKey = tableContext?.A_KEY || columnKeys[0];
          const aCustomRenderer = customCellRenderer?.[aColumnKey];
          const aContent = aCustomRenderer && row !== null 
            ? aCustomRenderer(row[aColumnKey], row, rIdx, aColumnKey)
            : null;
          
          const isFullWidth = aContent && typeof aContent === 'object' && aContent.type === 'fullWidth';
          
          if (isFullWidth) {
            // Render full-width content
            const rowClasses = rIdx % 2 ? "bg-gray-50" : "bg-white";
            const customClasses = styles.classes || "";
            
            return (
              <div key={`b2-fullwidth-${rIdx}`} className={`${rowClasses} ${customClasses}`}>
                {aContent.b2Content ? (
                  <div className="w-full">
                    {aContent.b2Content}
                  </div>
                ) : (
                  <div className="w-full" style={{ marginLeft: `-${firstColWidth}px`, width: `calc(100% + ${firstColWidth}px)` }}>
                    {aContent.component}
                  </div>
                )}
              </div>
            );
          }
          
          // Normal grid rendering
          const rowClasses = rIdx % 2 ? (styles.oddRow || "bg-gray-50") : (styles.evenRow || "bg-white");
          const customClasses = styles.classes || "";

          return (
            <div key={`b2r-${rIdx}`} className={`${rowClasses} ${customClasses} relative z-10`}>
              <div
                className="grid"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {columnKeys.map((columnKey) => {
                  const isPlaceholder = row === null;

                  // Get cell value
                  const rawValue = isPlaceholder ? null : row?.[columnKey];
                  const display = isPlaceholder ? "\u00A0" : formatVal(columnKey, rawValue);

                  // Check for custom cell renderer
                  const customRenderer = customCellRenderer?.[columnKey];
                  const cellContent = customRenderer && row !== null
                    ? customRenderer(rawValue, row, rIdx, columnKey)
                    : display;

                  // Check if this is a CellToolbar component
                  const isCellToolbar = cellContent && typeof cellContent === 'object' && cellContent.type;

                  if (isCellToolbar) {
                    return (
                      <div
                        key={`b2c-${rIdx}-${columnKey}`}
                        className={`border-r border-gray-100 ${isPlaceholder ? "text-transparent select-none" : ""}`}
                        style={{ height: rowHeight }}
                      >
                        {cellContent}
                      </div>
                    );
                  }

                  // Normal cell rendering
                  const rowId = row?._rowId || `row_${rIdx}`;
                  const colAlignment = columnAlignments[columnKey] || alignment;
                  const contentClasses = isPlaceholder ? "text-transparent select-none" : "";

                  // Build classes - use ChB2 style (px-0) for wrapper since ChB2 has its own padding
                  const baseClasses = styles.ChB2 || "flex-none px-0 flex items-center text-xs border-r border-gray-100 relative z-10";
                  const className = `${baseClasses} ${getAlignmentClasses(colAlignment)} ${contentClasses}`.trim();

                  return (
                    <div
                      key={`b2c-${rIdx}-${columnKey}`}
                      className={className}
                      style={{ height: rowHeight }}
                      title={row !== null ? (typeof cellContent === 'string' ? cellContent : display) : ""}
                    >
                      <ChB2
                        rowId={rowId}
                        columnKey={columnKey}
                        cellValue={cellContent}
                        cellState={cellState}
                        onCellStateUpdate={onCellStateUpdate}
                        tableContext={tableContext}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}