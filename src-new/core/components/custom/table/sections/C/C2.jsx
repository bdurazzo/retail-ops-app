import React from 'react';
import { getAlignmentClasses } from '../../tableProps.js';

/**
 * C2Section - Fixed column body section (C/D system)
 * 
 * Renders the fixed column data rows with:
 * - Fixed width positioning
 * - Multiple column support
 * - Shared vertical scroll
 * - Custom cell renderers
 * - Alternating row styling
 * - Placeholder support
 */
export default function C2Section({
  columnKeys = [],
  columnWidths = {},
  rows = [],
  alignment = 'center',
  columnAlignments = {},
  styles = {},
  customRenderer = null,
  className = "",
  tableContext
}) {
  // Get layout and transition state from context
  const firstColWidth = tableContext?.firstColWidth || 120;
  const rowHeight = tableContext?.rowHeight || 50;
  const isTransitioning = tableContext?.isTransitioning || false;

  // Calculate total width for fixed columns
  const totalWidth = (!columnKeys || columnKeys.length === 0)
    ? firstColWidth
    : columnKeys.reduce((sum, key) => {
        return sum + (columnWidths[key] || firstColWidth);
      }, 0);
  
  return (
    <div
      className={className || `flex-none bg-white relative z-50 isolate transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
      style={{ width: totalWidth }}
    >
      {rows.map((row, rIdx) => {
        // If no columns, render empty placeholder cell
        if (!columnKeys || columnKeys.length === 0) {
          return (
            <div
              key={`c2-placeholder-${rIdx}`}
              className={`${rIdx % 2 ? "bg-gray-50 relative z-20" : "bg-white relative z-20"} ${styles.classes || ""}`}
              style={{ width: firstColWidth, height: rowHeight }}
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
              key={`c2-${rIdx}`}
              className={`${rIdx % 2 ? "bg-gray-50 relative z-20" : "bg-white relative z-20"} ${styles.classes || ""}`}
            >
              <div style={{ height: 'auto', minHeight: rowHeight }}>
                {content.c2Content || content}
              </div>
            </div>
          );
        }
        
        // Render multiple fixed columns
        return (
          <div 
            key={`c2-${rIdx}`} 
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
              const baseClasses = styles.cell || "px-3 flex shadow-xl shadow-gray-200 items-center text-[11px] leading-tight relative z-30";
              const contentClasses = isPlaceholder ? (styles.placeholder || "text-transparent select-none") : (styles.content || "text-gray-600");
              
              const cellValue = isPlaceholder ? "Placeholder" : (
                customContent && typeof customContent !== 'object' 
                  ? customContent 
                  : (row?.[columnKey] == null ? "" : String(row[columnKey]))
              );
              
              return (
                <div
                  key={`${columnKey}-${rIdx}`}
                  className={`${baseClasses} ${getAlignmentClasses(colAlignment)} ${contentClasses}`}
                  style={{ width: colWidth, height: rowHeight }}
                  title={!isPlaceholder && row?.[columnKey] ? String(row[columnKey]) : ""}
                >
                  <div className="w-full overflow-hidden">
                    <div className="truncate">
                      {cellValue}
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