/**
 * ColumnPlugin
 *
 * Renders a column as a nested table using productTable logic
 * Sections call this when cellState indicates data was dropped in a column
 */

import React, { useState } from 'react';
import { productTable } from '../../../custom/table/templates/productTable.js';

/**
 * Check if column should use ColumnPlugin
 */
export function shouldApplyColumnPlugin(columnKey, cellState = {}) {
  // Check if any cell in this column has plugin data
  return Object.keys(cellState).some(key => {
    return key.endsWith(`_${columnKey}`) && cellState[key]?.type === 'product';
  });
}

/**
 * Get plugin data for this column
 */
export function getColumnPluginData(columnKey, cellState = {}) {
  const cellKey = Object.keys(cellState).find(key =>
    key.endsWith(`_${columnKey}`) && cellState[key]?.type === 'product'
  );

  return cellState[cellKey] || null;
}

/**
 * ColumnPlugin Component
 * Renders nested product table in a column
 */
export default function ColumnPlugin({
  columnKey,
  cellState = {},
  colWidth = 120,
  rowHeight = 50,
  ...props
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const pluginData = getColumnPluginData(columnKey, cellState);

  if (!pluginData) return null;

  // Use productTable logic to transform data
  const productData = pluginData.content || [];
  const tableOutput = productTable(productData, pluginData.options || {});

  return (
    <div className="w-full h-full bg-white border-r border-gray-100">
      {/* Collapsed toolbar view */}
      <div
        className="flex items-center justify-center px-2 cursor-pointer hover:bg-gray-50"
        style={{ height: rowHeight }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-xs text-gray-700 truncate">
          {isExpanded ? '�' : '�'} {pluginData.title || 'Data'}
        </span>
      </div>

      {/* Expanded nested table */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-2">
          <div className="text-xs text-gray-600">
            {/* Mini table will render here using tableOutput */}
            <pre className="text-[10px]">{JSON.stringify(tableOutput, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
