/**
 * TableWorkspace
 *
 * Top-level orchestrator for the modular table system.
 * Receives assignments and routes them to appropriate container components.
 * Uses TableContainer from custom/table for the core table structure.
 */

import React from 'react';
import TableContainer, { TableHeader as TableHeaderSlot, TableBody as TableBodySlot, TableFooter as TableFooterSlot, TableToolbar } from '../../../custom/table/TableContainer.jsx';
import TableController from './TableController.jsx';
import TableHeader from './TableHeader.jsx';
import TableBody from './TableBody.jsx';
import TableFooter from './TableFooter.jsx';

export default function TableWorkspace({
  // Assignments from user drag/drop
  columnAssignments = [],
  rowAssignments = [],

  // Processed table props (eventually from tableOperator)
  tableProps = {
    rows: [],
    totals: {},
    columnKeys: [],
    columnLabels: {},
    columnWidths: {},
    layout: {},
    styles: {},
    fixedColumns: [],
    scrollingColumns: []
  },

  // Data configuration
  dataConfig = {},

  // Sorting
  sortKey = null,
  sortDirection = null,
  onSort = () => {},

  // Column swapping
  onColumnSwap = () => {},

  ...props
}) {
  return (
    <div className="flex flex-col h-full w-full rounded-xl min-w-0">
      {/* Main table container */}
      <TableContainer
        rows={tableProps.rows}
        totals={tableProps.totals}
        columnKeys={tableProps.columnKeys}
        columnLabels={tableProps.columnLabels}
        columnWidths={tableProps.columnWidths}
        layout={tableProps.layout}
        styles={tableProps.styles}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={onSort}
        onColumnSwap={onColumnSwap}
      >
        {/* Toolbar */}
        <TableToolbar>
          <TableController />
        </TableToolbar>

        <TableHeaderSlot>
          <TableHeader
            columnAssignments={columnAssignments}
            columnLabels={tableProps.columnLabels}
            columnWidths={tableProps.columnWidths}
            fixedColumns={tableProps.fixedColumns}
            scrollingColumns={tableProps.scrollingColumns}
            allColumnKeys={tableProps.columnKeys}
            onColumnSwap={onColumnSwap}
          />
        </TableHeaderSlot>

        <TableBodySlot>
          <TableBody
            rowAssignments={rowAssignments}
            columnAssignments={columnAssignments}
            rows={tableProps.rows}
            columnWidths={tableProps.columnWidths}
            fixedColumns={tableProps.fixedColumns}
            scrollingColumns={tableProps.scrollingColumns}
          />
        </TableBodySlot>

        <TableFooterSlot>
          <TableFooter
            columnAssignments={columnAssignments}
            totals={tableProps.totals}
            columnWidths={tableProps.columnWidths}
            fixedColumns={tableProps.fixedColumns}
            scrollingColumns={tableProps.scrollingColumns}
          />
        </TableFooterSlot>
      </TableContainer>
    </div>
  );
}