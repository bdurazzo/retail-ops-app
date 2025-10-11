/**
 * TableBody
 *
 * State & logic layer for table body.
 * Manages:
 * - Cell plugin state (which cells have plugins assigned)
 * - Row expansion state
 * - Plugin rendering logic
 * - Drop handlers for cell-level plugin assignment
 */

import React, { useState } from 'react';
import A2Section from '../../../custom/table/sections/A/A2.jsx';
import B2Section from '../../../custom/table/sections/B/B2.jsx';
import TablePlugin from '../../../plugins/default/table/TablePlugin.jsx';
import RowPlugin from '../../../plugins/default/table/RowPlugin.jsx';

export default function TableBody({
  rowAssignments = [],
  columnAssignments = [],
  rows = [],
  columnWidths = {},
  fixedColumns = [],
  scrollingColumns = [],
  tableContext
}) {
  // State management
  const [cellState, setCellState] = useState({});
  const [expandedRows, setExpandedRows] = useState({});

  // Cell drop handler - called when user drops plugin on a cell
  const handleCellDrop = (rowId, columnKey, droppedData) => {
    const cellKey = `${rowId}_${columnKey}`;
    setCellState(prev => ({
      ...prev,
      [cellKey]: droppedData
    }));
  };

  // Cell state update - for plugins to update their own state
  const handleCellStateUpdate = (cellKey, data) => {
    setCellState(prev => ({
      ...prev,
      [cellKey]: data
    }));
  };

  // Row expansion toggle
  const toggleRowExpanded = (rowId) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  // Check if a row has a TablePlugin assigned
  const hasTablePlugin = (row) => {
    const rowId = row?._rowId;
    if (!rowId) return false;
    return Object.keys(cellState).some(key =>
      key.startsWith(`${rowId}_`) && cellState[key]?.type === 'table'
    );
  };

  // Check if a row has a RowPlugin assigned
  const hasRowPlugin = (row) => {
    const rowId = row?._rowId;
    if (!rowId) return false;
    return Object.keys(cellState).some(key =>
      key.startsWith(`${rowId}_`) && cellState[key]?.type === 'row'
    );
  };

  // Get plugin data for a row
  const getPluginData = (row) => {
    const rowId = row?._rowId;
    if (!rowId) return null;
    const cellKey = Object.keys(cellState).find(key => key.startsWith(`${rowId}_`));
    return cellState[cellKey] || null;
  };

  // Build props for A2 section
  const a2Props = {
    columnKeys: fixedColumns,
    columnWidths,
    rows,
    styles: tableContext?.styles?.a2 || {},
    tableContext,
    onCellDrop: handleCellDrop,
    cellState,
    onCellStateUpdate: handleCellStateUpdate,
    expandedRows,
    toggleRowExpanded,
    // Pass plugin components so A2 can render them in cells
    pluginComponents: {
      table: TablePlugin,
      row: RowPlugin
    }
  };

  // Build props for B2 section
  const b2Props = {
    columnKeys: scrollingColumns,
    columnWidths,
    rows,
    styles: tableContext?.styles?.b2 || {},
    tableContext,
    onCellDrop: handleCellDrop,
    cellState,
    onCellStateUpdate: handleCellStateUpdate,
    expandedRows,
    toggleRowExpanded,
    // Pass plugin components so B2 can render them in cells
    pluginComponents: {
      table: TablePlugin,
      row: RowPlugin
    }
  };

  return (
    <>
      <A2Section {...a2Props} />
      <B2Section {...b2Props} />
    </>
  );
}
