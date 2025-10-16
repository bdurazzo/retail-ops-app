/**
 * TableHeader
 *
 * State & logic layer for table headers.
 * Manages:
 * - Column plugin state (which columns have plugins)
 * - Drop handlers for column-level plugin assignment
 */

import React, { useState } from 'react';
import A1Section from '../../../custom/table/sections/A/A1.jsx';
import B1Section from '../../../custom/table/sections/B/B1.jsx';
import ColumnPlugin from '../../../plugins/default/table/ColumnPlugin.jsx';

export default function TableHeader({
  columnAssignments = [],
  columnLabels = {},
  columnWidths = {},
  fixedColumns = [],
  scrollingColumns = [],
  allColumnKeys = [],
  onColumnSwap = () => {},
  tableContext
}) {
  // State management for column plugins
  const [columnState, setColumnState] = useState({});

  // Extract sorting and column swap from tableContext
  const { sortKey, sortDirection, onSort, onColumnSwap: onColumnSwapContext } = tableContext || {};
  const finalOnColumnSwap = onColumnSwap || onColumnSwapContext;

  // Column drop handler - called when user drops plugin on a column header
  const handleColumnDrop = (columnKey, droppedData) => {
    setColumnState(prev => ({
      ...prev,
      [columnKey]: droppedData
    }));
  };

  // Column state update - for plugins to update their own state
  const handleColumnStateUpdate = (columnKey, data) => {
    setColumnState(prev => ({
      ...prev,
      [columnKey]: data
    }));
  };

  // Build props for A1 section
  const a1Props = {
    columnKeys: fixedColumns,
    columnLabels,
    columnWidths,
    styles: tableContext?.styles?.a1 || {},
    tableContext,
    onColumnDrop: handleColumnDrop,
    columnState,
    onColumnStateUpdate: handleColumnStateUpdate,
    pluginComponents: {
      column: ColumnPlugin
    }
  };

  // Build props for B1 section
  const b1Props = {
    columnKeys: scrollingColumns,
    allColumnKeys: allColumnKeys.filter(key => !fixedColumns.includes(key)), // All non-fixed columns for picker
    columnLabels,
    columnWidths,
    styles: tableContext?.styles?.b1 || {},
    tableContext,
    onColumnDrop: handleColumnDrop,
    columnState,
    onColumnStateUpdate: handleColumnStateUpdate,
    onColumnSwap: finalOnColumnSwap,
    pluginComponents: {
      column: ColumnPlugin
    }
  };

  return (
    <>
      <A1Section {...a1Props} />
      <B1Section {...b1Props} />
    </>
  );
}
