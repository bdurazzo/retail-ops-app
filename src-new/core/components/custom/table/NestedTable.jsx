/**
 * NestedTable
 *
 * Renders nested CD table using RowPlugin
 * Transforms data with productTable and displays in C/D sections
 */

import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { productTable } from './templates/productTable.js';
import { applyTemplate, routeCDColumns, getColumnWidths } from './tableConfig.js';
import { DEFAULT_LAYOUT } from './tableProps.js';
import RowPlugin, { getRowPluginData } from '../../plugins/default/table/RowPlugin.jsx';
import { useDragDrop } from '../../../hooks/useDragDrop.js';
import { useViewModeTransition } from '../../../hooks/useViewModeTransition.js';
import { DRAG_TYPES, VIEW_MODE_MAP } from '../../../utils/dragDropTypes.js';
import { sortTableRows, getNextSortState } from '../../../utils/tableSorting.js';
import C1Section from './sections/C/C1.jsx';
import C2Section from './sections/C/C2.jsx';
import C3Section from './sections/C/C3.jsx';
import D1Section from './sections/D/D1.jsx';
import D2Section from './sections/D/D2.jsx';
import D3Section from './sections/D/D3.jsx';

export default function NestedTable({
  row,
  cellState = {},
  onCellStateUpdate = () => {},
  section = 'A2', // 'A2' or 'B2'
  expandedRows = {},
  toggleRowExpanded = () => {},
  rowHeight = DEFAULT_LAYOUT.rowHeight,
  tableContainerWidth = 0,
  ...props
}) {
  // Get rowId to store view mode and sort state in cellState
  const rowId = row?._rowId;
  const viewModeKey = `${rowId}_viewMode`;
  const sortStateKey = `${rowId}_sortState`;

  // Get view mode from cellState or default to 'by-variant'
  const currentViewMode = cellState[viewModeKey]?.viewMode || 'by-variant';

  // Get sort state from cellState (shared between A2 and B2 instances)
  const sortKey = cellState[sortStateKey]?.sortKey || null;
  const sortDirection = cellState[sortStateKey]?.sortDirection || null;

  // Drag/drop and transition hooks
  const { handleDragStart, handleDrop, handleDragOver } = useDragDrop();
  const { isTransitioning, transition } = useViewModeTransition();

  const pluginData = getRowPluginData(row, cellState);

  console.log('NestedTable pluginData:', pluginData);

  if (!pluginData) return null;

  const isExpanded = expandedRows[rowId] || false;

  // Use tableConfig to apply template with current view mode
  const productData = pluginData.content || [];
  const tableProps = applyTemplate(productData, productTable, {
    ...pluginData.options,
    viewMode: currentViewMode
  });

  console.log('NestedTable productData:', productData);
  console.log('NestedTable tableProps:', tableProps);

  // Apply sorting to rows
  const sortedRows = sortKey
    ? sortTableRows(tableProps.rows, sortKey, sortDirection)
    : tableProps.rows;

  // Route columns: put grouping dimension in C, other dimension + metrics in D
  // For by-color: C gets 'color', D gets 'size', 'quantity', 'discounted_price'
  // For by-size: C gets 'size', D gets 'color', 'quantity', 'discounted_price'
  // For by-variant: C is empty, D gets 'color', 'size', 'quantity', 'discounted_price'
  const allColumns = [...tableProps.columnKeys].filter(key => key !== 'product_name');

  let fixedColumns = [];
  let scrollingColumns = [];

  if (currentViewMode === 'by-color') {
    fixedColumns = ['color'];
    // Keep size in D, but it will show dashes since we're grouped by color
    scrollingColumns = ['size', 'quantity', 'discounted_price'];
  } else if (currentViewMode === 'by-size') {
    fixedColumns = ['size'];
    // Keep color in D, but it will show dashes since we're grouped by size
    scrollingColumns = ['color', 'quantity', 'discounted_price'];
  } else {
    // by-variant or summary - C is empty, D shows all
    fixedColumns = [];
    scrollingColumns = allColumns;
  }

  // Get column widths - columns in C use firstColWidth, columns in D use metricColWidth
  const columnWidths = {};
  tableProps.columnKeys.forEach(key => {
    // If this column is in fixedColumns (C section), use firstColWidth
    // Otherwise use metricColWidth
    columnWidths[key] = fixedColumns.includes(key)
      ? DEFAULT_LAYOUT.firstColWidth
      : DEFAULT_LAYOUT.metricColWidth;
  });

  // Handle view mode switch via drag/drop
  const handleViewModeSwitch = async (viewMode) => {
    await transition(() => {
      flushSync(() => {
        onCellStateUpdate(viewModeKey, {
          viewMode,
          type: 'viewMode'
        });
      });
    });
  };

  // D1 header drag handler - pass columnKey to determine view mode
  const onHeaderDragStart = (e, columnKey) => {
    // Map columnKey to view mode
    const viewModeMap = {
      'color': 'by-color',
      'size': 'by-size'
    };

    const viewMode = viewModeMap[columnKey];
    if (!viewMode) {
      e.preventDefault();
      return;
    }

    const serialized = handleDragStart(DRAG_TYPES.VIEW_MODE, {
      viewMode,
      columnKey
    });

    e.dataTransfer.setData('text/plain', serialized);
    e.dataTransfer.effectAllowed = 'move';
  };

  // C1 header drop handler
  const onC1Drop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    handleDrop(e, DRAG_TYPES.VIEW_MODE, (data) => {
      handleViewModeSwitch(data.viewMode);
    });
  };

  // Sort handler - update cellState so both A2 and B2 instances see it
  const handleSort = (columnKey) => {
    const { sortKey: newSortKey, sortDirection: newSortDirection } = getNextSortState(
      sortKey,
      columnKey,
      sortDirection
    );

    onCellStateUpdate(sortStateKey, {
      sortKey: newSortKey,
      sortDirection: newSortDirection,
      type: 'sortState'
    });
  };

  // Create nested table context using tableProps from tableConfig
  const nestedTableContext = {
    firstColWidth: tableProps.layout?.firstColWidth,
    metricColWidth: tableProps.layout?.metricColWidth,
    headerHeight: tableProps.layout?.headerHeight,
    rowHeight: tableProps.layout?.rowHeight,
    footerHeight: tableProps.layout?.footerHeight,
    layout: tableProps.layout,
    // Pass transition state and drag/drop handlers
    isTransitioning,
    onHeaderDragStart,
    onC1Drop,
    onDragOver: handleDragOver,
    // Pass sort state and handler
    sortKey,
    sortDirection,
    onSort: handleSort
  };

  return (
    <RowPlugin
      title={pluginData.title || 'Product Table'}
      subtitle={`${tableProps.rows.length} rows`}
      isExpanded={isExpanded}
      onToggle={() => toggleRowExpanded(rowId)}
      rowHeight={rowHeight}
      showToolbar={true}
      section={section}
      tableContainerWidth={tableContainerWidth}
      productData={productData}
      tableOutput={tableProps}
    >
      {section === 'A2' ? (
        <>
          <C1Section
            columnKeys={fixedColumns}
            columnLabels={tableProps.columnLabels}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            styles={tableProps.styles?.c1 || {}}
            className="bg-gradient-to-b from-gray-200 via-white to-gray-100 border-r"
            tableContext={nestedTableContext}
          />
          <C2Section
            columnKeys={fixedColumns}
            columnWidths={columnWidths}
            rows={sortedRows}
            styles={tableProps.styles?.c2 || {}}
            tableContext={nestedTableContext}
          />
          <C3Section
            columnKeys={fixedColumns}
            totals={tableProps.totals}
            styles={tableProps.styles?.c3 || {}}
            tableContext={nestedTableContext}
          />
        </>
      ) : (
        <>
          <D1Section
            columnKeys={scrollingColumns}
            columnLabels={tableProps.columnLabels}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            styles={tableProps.styles?.d1 || {}}
            tableContext={nestedTableContext}
            className="bg-gradient-to-b from-gray-200 via-white to-gray-100"
          />
          <D2Section
            columnKeys={scrollingColumns}
            columnWidths={columnWidths}
            rows={sortedRows}
            styles={tableProps.styles?.d2 || {}}
            tableContext={nestedTableContext}
          />
          <D3Section
            columnKeys={scrollingColumns}
            totals={tableProps.totals}
            styles={tableProps.styles?.d3 || {}}
            tableContext={nestedTableContext}
          />
        </>
      )}
    </RowPlugin>
  );
}
