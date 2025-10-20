/**
 * TableWorkspace
 *
 * Top-level orchestrator for the modular table system.
 * Receives assignments and routes them to appropriate container components.
 * Uses TableContainer from custom/table for the core table structure.
 *
 * Supports two modes:
 * - 'single': Standard single table (default, backward compatible)
 * - 'multi': Multiple vertically stacked tables with resize handles
 */

import React, { useState, useRef, useEffect } from 'react';
import TableContainer, { TableHeader as TableHeaderSlot, TableBody as TableBodySlot, TableFooter as TableFooterSlot, TableToolbar as TableToolbarSlot } from '../../../custom/table/TableContainer.jsx';
import TableController from './TableController.jsx';
import TableToolbar from './TableToolbar.jsx';
import TableHeader from './TableHeader.jsx';
import TableBody from './TableBody.jsx';
import TableFooter from './TableFooter.jsx';

export default function TableWorkspace({
  // Mode: 'single' | 'multi'
  mode = 'multi',

  // Single table mode props (backward compatible)
  columnAssignments = [],
  rowAssignments = [],
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
  dataConfig = {},
  sortKey = [],
  sortDirection = [],
  onSort = () => {},
  onColumnSwap = () => {},

  // Multi-table mode props
  tables = [],
  resizeHeights = [33, 33, 34],
  onResizeChange,

  ...props
}) {
  const containerRef = useRef(null);

  // Render a single table
  const renderTable = (config, index, includeToolbar = true) => {
    const {
      id,
      tableProps: tp = tableProps,
      columnAssignments: ca = columnAssignments,
      rowAssignments: ra = rowAssignments,
      sortKey: sk = sortKey,
      sortDirection: sd = sortDirection,
      onSort: os = onSort,
      onColumnSwap: ocs = onColumnSwap,
      expandable = false,
      nestedRowRenderer = null
    } = config;

    // Custom container classes - no border-t since each table has its own rounded toolbar
    const containerClasses = "w-full h-full shadow rounded-t-lg rounded-b-lg flex flex-col overflow-hidden";

    return (
      <TableContainer
        key={id || index}
        rows={tp.rows}
        totals={tp.totals}
        columnKeys={tp.columnKeys}
        columnLabels={tp.columnLabels}
        columnWidths={tp.columnWidths}
        layout={tp.layout}
        styles={tp.styles}
        sortKey={sk}
        sortDirection={sd}
        onSort={os}
        onColumnSwap={ocs}
        containerClasses={containerClasses}
      >
        {includeToolbar && (
          <TableToolbarSlot>
            <TableToolbar 
              tableId={id} 
              tableIndex={index}
           />
          </TableToolbarSlot>
        )}

        <TableHeaderSlot>
          <TableHeader
            columnAssignments={ca}
            columnLabels={tp.columnLabels}
            columnWidths={tp.columnWidths}
            fixedColumns={tp.fixedColumns}
            scrollingColumns={tp.scrollingColumns}
            allColumnKeys={tp.columnKeys}
            onColumnSwap={ocs}
          />
        </TableHeaderSlot>

        <TableBodySlot>
          <TableBody
            rowAssignments={ra}
            columnAssignments={ca}
            rows={tp.rows}
            columnWidths={tp.columnWidths}
            fixedColumns={tp.fixedColumns}
            scrollingColumns={tp.scrollingColumns}
            expandable={expandable}
            nestedRowRenderer={nestedRowRenderer}
          />
        </TableBodySlot>

        <TableFooterSlot>
          <TableFooter
            columnAssignments={ca}
            totals={tp.totals}
            columnWidths={tp.columnWidths}
            fixedColumns={tp.fixedColumns}
            scrollingColumns={tp.scrollingColumns}
          />
        </TableFooterSlot>
      </TableContainer>
    );
  };

  // Multi-table mode
  if (mode === 'multi' && tables.length > 0) {
    return (
      <div className="flex flex-col h-full w-full  min-w-0">
        {/* Single TableController for all tables */}
        <div className="flex-none">
          <TableController />
        </div>

        {/* Multiple table containers */}
        <div ref={containerRef} className="flex flex-col flex-1 min-h-0 gap-1">
          {tables.map((tableConfig, index) => (
            <div
              key={tableConfig.id || index}
              className="flex-1 flex flex-col py-2 min-h-0 overflow-hidden"
            >
              {renderTable(tableConfig, index, true)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Single table mode (backward compatible)
  return (
    <div className="flex flex-col h-full w-full rounded-xl min-w-0">
      {renderTable({
        tableProps,
        columnAssignments,
        rowAssignments,
        sortKey,
        sortDirection,
        onSort,
        onColumnSwap
      }, 0)}
    </div>
  );
}