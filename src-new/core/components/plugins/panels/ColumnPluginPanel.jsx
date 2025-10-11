import React from 'react';
import ColumnPlugin from '../default/table/ColumnPlugin.jsx';

export default function ColumnPluginPanel({ onPanelStateChange, panelCommand }) {
  // Mock row data for rendering the toolbar
  const mockRow = { _rowId: 'preview-column' };
  const mockCellState = {};
  const mockExpandedRows = {};

  return (
    <div className="flex flex-col bg-gray-50 p-4">
      <div className="text-xs text-gray-500 mb-2">Column Plugin Preview (column-row sized container)</div>
      <div className="w-full h-[32px] border border-gray-300 bg-white">
        <ColumnPlugin
          row={mockRow}
          cellState={mockCellState}
          expandedRows={mockExpandedRows}
          toggleRowExpanded={() => {}}
          title="Column Plugin"
        />
      </div>
    </div>
  );
}
