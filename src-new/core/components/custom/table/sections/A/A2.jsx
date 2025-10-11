import React from 'react';
import { getAlignmentClasses } from '../../tableProps.js';

/**
 * A2Section - Fixed column body section
 * 
 * Renders the fixed column data rows with:
 * - Fixed width positioning
 * - Multiple column support
 * - Shared vertical scroll
 * - Custom cell renderers
 * - Alternating row styling
 * - Placeholder support
 */
export default function A2Section({
  columnKeys = [],
  columnWidths = {},
  rows = [],
  alignment = 'center',
  columnAlignments = {},
  styles = {},
  customRenderer = null,
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
  const firstColWidth = tableContext?.firstColWidth || 120;
  const rowHeight = tableContext?.rowHeight || 50;

  // If empty, render empty state from container config
  if (isEmpty) {
    return (
      <div
        className={emptyConfig.className || "flex-none bg-white shadow relative isolate"}
        style={{ width: emptyConfig.width || firstColWidth, minHeight: emptyConfig.minHeight }}
      >
        <span>{emptyConfig.placeholder}</span>
      </div>
    );
  }

  // Calculate total width for fixed columns
  const totalWidth = columnKeys.reduce((sum, key) => {
    return sum + (columnWidths[key] || firstColWidth);
  }, 0);

  return (
    <div
      className="flex-none bg-white relative z-20"
      style={{ width: totalWidth }}
    >
      {rows.map((row, rIdx) => {
        // Check if row has a plugin renderer (full-width)
        if (row && row._selectPlugin) {
          const PluginComponent = row._selectPlugin;
          return (
            <PluginComponent
              key={`a2-plugin-${rIdx}`}
              row={row}
              {...row._pluginProps}
            />
          );
        }

        // Check for full-width custom content first
        const hasFullWidthContent = columnKeys.some(key => {
          if (!customRenderer?.[key] || row === null) return false;
          try {
            const content = customRenderer[key](row[key], row, rIdx, key);
            return content && typeof content === 'object' && content.type === 'fullWidth';
          } catch (error) {
            return false;
          }
        });

        if (hasFullWidthContent) {
          const fullWidthColumnKey = columnKeys.find(key => {
            if (!customRenderer?.[key] || row === null) return false;
            try {
              const content = customRenderer[key](row[key], row, rIdx, key);
              return content && typeof content === 'object' && content.type === 'fullWidth';
            } catch (error) {
              return false;
            }
          });

          const content = (() => {
            if (!customRenderer?.[fullWidthColumnKey] || row === null) return null;
            try {
              return customRenderer[fullWidthColumnKey](row[fullWidthColumnKey], row, rIdx, fullWidthColumnKey);
            } catch (error) {
              console.warn(`Full-width renderer for column "${fullWidthColumnKey}" crashed:`, error);
              return null;
            }
          })();
          
          return (
            <div
              key={`a2-${rIdx}`}
              className={`${rIdx % 2 ? "bg-gray-50 relative z-20" : "bg-white relative z-20"} ${styles.classes || ""}`}
            >
              <div style={{ height: 'auto', minHeight: rowHeight }}>
                {content.a2Content || content}
              </div>
            </div>
          );
        }
        
        // Render multiple fixed columns (or empty row container if no columns)
        return (
          <div
            key={`a2-${rIdx}`}
            className={`${rIdx % 2 ? "bg-gray-50 relative z-20" : "bg-white relative z-20"} ${styles.classes || ""} flex`}
            style={{ height: rowHeight }}
          >
            {columnKeys.length === 0 ? null : columnKeys.map((columnKey) => {
              const colWidth = columnWidths[columnKey] || firstColWidth;
              const colAlignment = columnAlignments[columnKey] || alignment;
              
              // Check for custom renderer (with error handling)
              const customContent = (() => {
                if (!customRenderer?.[columnKey] || row === null) return null;
                try {
                  return customRenderer[columnKey](row[columnKey], row, rIdx, columnKey);
                } catch (error) {
                  console.warn(`Custom renderer for column "${columnKey}" crashed:`, error);
                  return null;
                }
              })();
              
              // Handle CellToolbar components
              const isCellToolbar = customContent && typeof customContent === 'object' && customContent.type;
              
              if (isCellToolbar) {
                return (
                  <div
                    key={`${columnKey}-${rIdx}`}
                    style={{ width: colWidth, height: rowHeight }}
                  >
                    {customContent}
                  </div>
                );
              }
              
              // Normal cell rendering
              const isPlaceholder = row === null;
              const rowId = row?._rowId || `row_${rIdx}`;
              const cellKey = `${rowId}_${columnKey}`;
              const cellData = cellState[cellKey];

              // Render plugin component if cellData has a plugin
              const PluginComponent = cellData?.type && pluginComponents?.[cellData.type];

              // Use pluginCell style if plugin exists, otherwise normal cell style
              const baseClasses = PluginComponent
                ? (styles.pluginCell || styles.cell || "")
                : (styles.cell || "");
              const contentClasses = isPlaceholder ? "text-transparent select-none" : "";

              const cellValue = isPlaceholder ? "Placeholder" : (
                customContent && typeof customContent !== 'object'
                  ? customContent
                  : (row?.[columnKey] == null ? "" : String(row[columnKey]))
              );

              const handleDrop = (e) => {
                e.preventDefault();
                if (onCellDrop) {
                  const droppedData = JSON.parse(e.dataTransfer.getData('text/plain'));
                  onCellDrop(rowId, columnKey, droppedData);
                }
              };

              const handleDragOver = (e) => {
                // Only preventDefault for drag events, not wheel/scroll
                if (e.dataTransfer) {
                  e.preventDefault();
                }
              };

              return (
                <div
                  key={`${columnKey}-${rIdx}`}
                  className={`${baseClasses} ${getAlignmentClasses(colAlignment)} ${contentClasses}`}
                  style={{ width: colWidth, height: rowHeight }}
                  title={!isPlaceholder && row !== null && row?.[columnKey] ? String(row[columnKey]) : ""}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {PluginComponent ? (
                    <PluginComponent
                      row={row}
                      cellState={cellState}
                      onCellStateUpdate={onCellStateUpdate}
                      expandedRows={expandedRows}
                      toggleRowExpanded={toggleRowExpanded}
                      rowHeight={rowHeight}
                    />
                  ) : (
                    <div className="w-full overflow-hidden">
                      <div className="truncate">
                        {cellData ? `[${cellData.type}]` : cellValue}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}