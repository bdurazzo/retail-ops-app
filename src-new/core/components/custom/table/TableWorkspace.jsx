/**
 * TableWorkspace
 *
 * Main workspace for building and composing tables
 * Uses the complete flow: dataService → dataConfig → template → tableConfig → TableContainer
 */

import React, { useState, useEffect } from 'react';
import Toolbar from '../../../../components/Toolbar.jsx';
import TableContainer, { TableHeader, TableBody, TableFooter } from './TableContainer.jsx';
import { applyTemplate } from './tableConfig.js';

// Import sections
import A1Section from './sections/A/A1.jsx';
import A2Section from './sections/A/A2.jsx';
import A3Section from './sections/A/A3.jsx';
import B1Section from './sections/B/B1.jsx';
import B2Section from './sections/B/B2.jsx';
import B3Section from './sections/B/B3.jsx';

export default function TableWorkspace({
  // Data from dataService
  data = [],

  // Template function (or use default)
  template = null,

  // Additional options
  options = {},

  ...props
}) {
  // Cell state: { rowId_colKey: { type, content, template } }
  const [cellState, setCellState] = useState({});

  // Expanded state: { rowId: boolean } - shared between A2 and B2
  const [expandedRows, setExpandedRows] = useState({});

  // Apply template to data
  const tableProps = applyTemplate(data, template, options);

  // Route columns for AB table
  const fixedColumns = tableProps.columnKeys.slice(0, 1); // First column fixed
  const scrollingColumns = tableProps.columnKeys.slice(1); // Rest scroll

  const handleCellDrop = (rowId, colKey, droppedData) => {
    const cellKey = `${rowId}_${colKey}`;

    console.log('📥 DROP EVENT:', {
      rowId,
      colKey,
      cellKey,
      droppedType: droppedData.type,
      droppedTitle: droppedData.title,
      contentCount: droppedData.content?.length || 0,
      contentSample: droppedData.content?.[0]
    });

    setCellState(prev => {
      const newState = {
        ...prev,
        [cellKey]: {
          type: droppedData.type,
          title: droppedData.title,
          content: droppedData.content,
          options: droppedData.options,
          template: droppedData.template
        }
      };

      console.log('📦 CELL STATE UPDATED:', {
        cellKey,
        totalCells: Object.keys(newState).length,
        newCellData: newState[cellKey]
      });

      return newState;
    });
  };

  const toggleRowExpanded = (rowId) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const handleCellStateUpdate = (cellKey, data) => {
    setCellState(prev => ({
      ...prev,
      [cellKey]: data
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <Toolbar />

      <TableContainer {...tableProps}>
        <TableHeader>
          <A1Section
            columnKeys={fixedColumns}
            columnLabels={tableProps.columnLabels}
            styles={tableProps.styles?.a1 || {}}
          />
          <B1Section
            columnKeys={scrollingColumns}
            columnLabels={tableProps.columnLabels}
            styles={tableProps.styles?.b1 || {}}
          />
        </TableHeader>

        <TableBody>
          <A2Section
            columnKeys={fixedColumns}
            rows={tableProps.rows}
            onCellDrop={handleCellDrop}
            cellState={cellState}
            onCellStateUpdate={handleCellStateUpdate}
            expandedRows={expandedRows}
            toggleRowExpanded={toggleRowExpanded}
          />
          <B2Section
            columnKeys={scrollingColumns}
            rows={tableProps.rows}
            onCellDrop={handleCellDrop}
            cellState={cellState}
            onCellStateUpdate={handleCellStateUpdate}
            expandedRows={expandedRows}
            toggleRowExpanded={toggleRowExpanded}
          />
        </TableBody>

        <TableFooter>
          <A3Section
            columnKeys={fixedColumns}
            totals={tableProps.totals}
          />
          <B3Section
            columnKeys={scrollingColumns}
            totals={tableProps.totals}
          />
        </TableFooter>
      </TableContainer>
    </div>
  );
}
