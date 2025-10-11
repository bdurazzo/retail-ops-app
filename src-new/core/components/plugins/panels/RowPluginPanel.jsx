import React from 'react';
import RowPlugin from '../default/table/RowPlugin.jsx';

export default function RowPluginPanel({ onPanelStateChange, panelCommand }) {
  // Mock row data for rendering the toolbar
  const mockRow = { _rowId: 'preview-row' };
  const mockCellState = {};
  const mockExpandedRows = {};

  return (
    <div className="flex flex-col bg-gray-50 p-4">
      <div className="text-xs text-gray-500 mb-2">Row Plugin Preview (column-row sized container)</div>
      <div className="w-full h-[32px] border border-gray-300 bg-white">
        <RowPlugin
          row={mockRow}
          cellState={mockCellState}
          expandedRows={mockExpandedRows}
          toggleRowExpanded={() => {}}
          title="Row Plugin"
        />
      </div>
    </div>
  );
}
