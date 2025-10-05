import React from 'react';
import { getAlignmentClasses } from '../../tableProps.js';
import { shouldApplyRowPlugin } from '../../../../plugins/default/table/RowPlugin.jsx';
import NestedTable from '../../NestedTable.jsx';

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
  tableContainerWidth = 0
}) {
  // Get layout from context
  const firstColWidth = tableContext?.firstColWidth || 120;
  const rowHeight = tableContext?.rowHeight || 50;

  // Handle empty columns
  if (!columnKeys || columnKeys.length === 0) return null;

  // Calculate total width for fixed columns
  const totalWidth = columnKeys.reduce((sum, key) => {
    return sum + (columnWidths[key] || firstColWidth);
  }, 0);
  
  return (
    <div
      className="flex-none bg-white relative z-50 isolate"
      style={{ width: totalWidth }}
    >
      {rows.map((row, rIdx) => {
        // Check if row should use RowPlugin
        const usePlugin = shouldApplyRowPlugin(row, cellState);

        console.log('🔍 A2 ROW CHECK:', {
          rowIndex: rIdx,
          rowId: row?._rowId,
          usePlugin,
          cellStateKeys: Object.keys(cellState),
          cellStateCount: Object.keys(cellState).length
        });

        if (usePlugin) {
          return (
            <NestedTable
              key={`a2-nested-${rIdx}`}
              row={row}
              cellState={cellState}
              onCellStateUpdate={onCellStateUpdate}
              section="A2"
              expandedRows={expandedRows}
              toggleRowExpanded={toggleRowExpanded}
              rowHeight={rowHeight}
              tableContainerWidth={tableContainerWidth}
            />
          );
        }

        // Check for full-width custom content first
        const hasFullWidthContent = columnKeys.some(key => {
          const content = customRenderer?.[key] && row !== null 
            ? customRenderer[key](row[key], row, rIdx, key)
            : null;
          return content && typeof content === 'object' && content.type === 'fullWidth';
        });
        
        if (hasFullWidthContent) {
          const fullWidthColumnKey = columnKeys.find(key => {
            const content = customRenderer?.[key] && row !== null 
              ? customRenderer[key](row[key], row, rIdx, key)
              : null;
            return content && typeof content === 'object' && content.type === 'fullWidth';
          });
          
          const content = customRenderer[fullWidthColumnKey](row[fullWidthColumnKey], row, rIdx, fullWidthColumnKey);
          
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
        
        // Render multiple fixed columns
        return (
          <div 
            key={`a2-${rIdx}`} 
            className={`${rIdx % 2 ? "bg-gray-50 relative z-20" : "bg-white relative z-20"} ${styles.classes || ""} flex`}
            style={{ height: rowHeight }}
          >
            {columnKeys.map((columnKey) => {
              const colWidth = columnWidths[columnKey] || firstColWidth;
              const colAlignment = columnAlignments[columnKey] || alignment;
              
              // Check for custom renderer
              const customContent = customRenderer?.[columnKey] && row !== null 
                ? customRenderer[columnKey](row[columnKey], row, rIdx, columnKey)
                : null;
              
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

              const baseClasses = styles.cell || "px-3 flex shadow-xl shadow-gray-200 items-center text-[11px] leading-tight relative z-30";
              const contentClasses = isPlaceholder ? (styles.placeholder || "text-transparent select-none") : (styles.content || "text-gray-600");

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
                e.preventDefault();
              };

              return (
                <div
                  key={`${columnKey}-${rIdx}`}
                  className={`${baseClasses} ${getAlignmentClasses(colAlignment)} ${contentClasses}`}
                  style={{ width: colWidth, height: rowHeight }}
                  title={!isPlaceholder && row?.[columnKey] ? String(row[columnKey]) : ""}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <div className="w-full overflow-hidden">
                    <div className="truncate">
                      {cellData ? `[${cellData.type}]` : cellValue}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}