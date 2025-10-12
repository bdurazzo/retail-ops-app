/**
 * TableWorkspace
 *
 * Top-level orchestrator for the modular table system.
 * Receives assignments and routes them to appropriate container components.
 * Uses TableContainer from custom/table for the core table structure.
 */

import React from 'react';
import TableContainer, { TableHeader as TableHeaderSlot, TableBody as TableBodySlot, TableFooter as TableFooterSlot } from '../../../custom/table/TableContainer.jsx';
import TableController from './TableController.jsx';
import TableHeader from './TableHeader.jsx';
import TableBody from './TableBody.jsx';
import TableFooter from './TableFooter.jsx';

export default function TableWorkspace({
  // Assignments from user drag/drop
  columnAssignments = [],
  rowAssignments = [],
  buttonAssignments = [],

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

  ...props
}) {
  return (
    <div className="flex flex-col h-full rounded-xl min-w-0">
      {/* Toolbar with button assignments */}
      <TableController
        buttonAssignments={buttonAssignments}
      />

      {/* Main table container */}
      <TableContainer
        rows={tableProps.rows}
        totals={tableProps.totals}
        columnKeys={tableProps.columnKeys}
        columnLabels={tableProps.columnLabels}
        columnWidths={tableProps.columnWidths}
        layout={tableProps.layout}
        maxBodyHeight={300}
        styles={tableProps.styles}
      >
        <TableHeaderSlot>
          <TableHeader
            columnAssignments={columnAssignments}
            columnLabels={tableProps.columnLabels}
            columnWidths={tableProps.columnWidths}
            fixedColumns={tableProps.fixedColumns}
            scrollingColumns={tableProps.scrollingColumns}
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