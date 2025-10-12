import React from 'react';
import CellPlugin from '../default/table/CellPlugin.jsx';

export default function CellPluginPanel({ onPanelStateChange, panelCommand }) {
  // Mock row data for rendering the toolbar
  const mockRow = { _rowId: 'preview-cell' };
  const mockCellState = {};
  const mockExpandedRows = {};

  return (
    <div className="flex flex-col bg-gray-50 p-4">
      <div className="text-xs text-gray-500 mb-2">Cell Plugin Preview (column-row sized container)</div>
      <div className="w-full h-[32px] border border-gray-300 bg-white">
        <CellPlugin
          row={mockRow}
          cellState={mockCellState}
          expandedRows={mockExpandedRows}
          toggleRowExpanded={() => {}}
          title="Cell Plugin"
        />
      </div>
    </div>
  );
}
