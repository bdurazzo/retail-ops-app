/**
 * TableToolbar
 *
 * Visible toolbar bar that sits below the plugin toolbar
 * Renders table-specific controls based on tableId
 */

import React from 'react';

export default function TableToolbar({ tableId, tableIndex, tableContext }) {
  // Render different controls based on which table this is
  const renderControls = () => {
    switch (tableId) {
      case 'primary-metrics':
        return <span className="text-xs text-gray-600">Primary Metrics Controls</span>;
      case 'secondary-metrics':
        return <span className="text-xs text-gray-600">Secondary Metrics Controls</span>;
      case 'coupled-pairs':
        return <span className="text-xs text-gray-600">Coupled Pairs Controls</span>;
      default:
        return <span className="text-xs text-gray-600">Table Toolbar - {tableId || `Table ${tableIndex}`}</span>;
    }
  };

  return (
    <div className="flex h-[40px]  items-center gap-2 px-4 bg-gradient-to-b from-white via-gray-50 to-gray-100 border-b border-gray-200">
      {renderControls()}
    </div>
  );
}
