import React from 'react';
import { getAlignmentClasses } from '../../tableProps.js';
import ChA2 from '../../../../module/table/channel/ChA2.jsx';

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
              className={`${rIdx % 2 ? "bg-blue-50 relative z-20" : "bg-white relative z-20"} ${styles.classes || ""}`}
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
              const contentClasses = isPlaceholder ? "text-transparent select-none" : "";

              const cellValue = isPlaceholder ? "Placeholder" : (
                customContent && typeof customContent !== 'object'
                  ? customContent
                  : (row?.[columnKey] == null ? "" : String(row[columnKey]))
              );

              // Build classes - use ChA2 style (px-0) for wrapper since ChA2 has its own padding
              const baseClasses = styles.ChA2 || "flex-none px-0 flex items-center text-xs border-r border-gray-100 relative z-10";

              return (
                <div
                  key={`${columnKey}-${rIdx}`}
                  className={`${baseClasses} ${getAlignmentClasses(colAlignment)} ${contentClasses}`}
                  style={{ width: colWidth, height: rowHeight }}
                  title={!isPlaceholder && row !== null && row?.[columnKey] ? String(row[columnKey]) : ""}
                >
                  <ChA2
                    rowId={rowId}
                    columnKey={columnKey}
                    styles={styles}
                    cellValue={cellValue}
                    cellState={cellState}
                    onCellStateUpdate={onCellStateUpdate}
                    tableContext={tableContext}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}