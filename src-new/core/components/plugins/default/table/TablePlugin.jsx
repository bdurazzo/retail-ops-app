/**
 * TablePlugin
 *
 * Smart wrapper component that manages all state and logic for nested tables
 * Imports and renders NestedTable (pure UI component)
 */

import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import Toolbar from '../../../../../components/Toolbar.jsx';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { productTable } from '../../../custom/table/templates/productTable.js';
import { applyTemplate } from '../../../custom/table/tableConfig.js';
import { DEFAULT_LAYOUT } from '../../../custom/table/tableProps.js';
import { useDragDrop } from '../../../../hooks/useDragDrop.js';
import { useViewModeTransition } from '../../../../hooks/useViewModeTransition.js';
import { DRAG_TYPES } from '../../../../utils/dragDropTypes.js';
import { sortTableRows, getNextSortState } from '../../../../utils/tableSorting.js';
import NestedTable from '../../../custom/table/NestedTable.jsx';

/**
 * Helper: Check if row should use TablePlugin
 */
export function shouldApplyTablePlugin(row, cellState = {}) {
  const rowId = row?._rowId;
  if (!rowId) return false;

  return Object.keys(cellState).some(key => {
    return key.startsWith(`${rowId}_`) && cellState[key]?.type;
  });
}

/**
 * Helper: Get plugin data for this row
 */
export function getTablePluginData(row, cellState = {}) {
  const rowId = row?._rowId;
  if (!rowId) return null;

  const cellKey = Object.keys(cellState).find(key =>
    key.startsWith(`${rowId}_`)
  );

  return cellState[cellKey] || null;
}

/**
 * Helper: Route columns based on view mode
 */
function routeColumns(allColumns, viewMode) {
  let fixedColumns = [];
  let scrollingColumns = [];

  if (viewMode === 'by-color') {
    fixedColumns = ['color'];
    // Keep size in scrolling (will show dashes), plus metrics
    // But don't duplicate color
    scrollingColumns = ['size', 'quantity', 'discounted_price'];
  } else if (viewMode === 'by-size') {
    fixedColumns = ['size'];
    // Keep color in scrolling (will show dashes), plus metrics
    // But don't duplicate size
    scrollingColumns = ['color', 'quantity', 'discounted_price'];
  } else {
    // by-variant or summary - no fixed columns, all scroll
    fixedColumns = [];
    scrollingColumns = allColumns;
  }

  return { fixedColumns, scrollingColumns };
}

/**
 * Helper: Get column widths based on which section they're in
 */
function getColumnWidths(columnKeys, fixedColumns, firstColWidth, metricColWidth) {
  const columnWidths = {};

  columnKeys.forEach(key => {
    columnWidths[key] = fixedColumns.includes(key)
      ? firstColWidth
      : metricColWidth;
  });

  return columnWidths;
}

/**
 * Helper: Get view mode from column key (for drag/drop)
 */
function getViewModeFromColumn(columnKey) {
  const viewModeMap = {
    'color': 'by-color',
    'size': 'by-size'
  };

  return viewModeMap[columnKey] || null;
}

/**
 * TablePlugin Component
 * Complete package: toolbar + expand/collapse + column routing + drag/drop + plugin sockets
 */
export default function TablePlugin({
  row,
  cellState = {},
  onCellStateUpdate = () => {},
  expandedRows = {},
  toggleRowExpanded = () => {},
  rowHeight = DEFAULT_LAYOUT.rowHeight,
  onConfigChange = null,
  ...props
}) {
  // Get rowId to store view mode and sort state in cellState
  const rowId = row?._rowId;
  const viewModeKey = `${rowId}_viewMode`;
  const sortStateKey = `${rowId}_sortState`;

  // Get view mode from cellState or default to 'by-variant'
  const currentViewMode = cellState[viewModeKey]?.viewMode || 'by-color';

  // Get sort state from cellState
  const sortKey = cellState[sortStateKey]?.sortKey || null;
  const sortDirection = cellState[sortStateKey]?.sortDirection || null;

  // Drag/drop and transition hooks
  const { handleDragStart, handleDrop, handleDragOver } = useDragDrop();
  const { isTransitioning, transition } = useViewModeTransition();

  const pluginData = getTablePluginData(row, cellState);

  if (!pluginData) return null;

  const isExpanded = expandedRows[rowId] || false;

  // Use tableConfig to apply template with current view mode
  const productData = pluginData.content || [];
  const tableProps = applyTemplate(productData, productTable, {
    ...pluginData.options,
    viewMode: currentViewMode
  });

  // Internal state for plugin configuration
  const [config, setConfig] = useState({
    type: 'product',
    data: productData,
    tableOutput: tableProps,
    metadata: {
      title: pluginData.title || 'Product Table',
      rowCount: productData.length
    }
  });

  // Update config when productData changes
  React.useEffect(() => {
    setConfig({
      type: 'product',
      data: productData,
      tableOutput: tableProps,
      metadata: {
        title: pluginData.title || 'Product Table',
        rowCount: productData.length
      }
    });
  }, [productData, tableProps, pluginData.title]);

  const handlePluginData = (data) => {
    if (onConfigChange) {
      onConfigChange({
        action: 'plugin_data',
        data: data,
        config: config
      });
    }
  };

  const handlePluginConnect = (connection) => {
    if (onConfigChange) {
      onConfigChange({
        action: 'plugin_connect',
        connection: connection,
        config: config
      });
    }
  };

  // Build plugin context from product data
  const pluginContext = {
    productData: config.data,
    tableData: config.tableOutput,
    productName: config.metadata?.title,
    ...config.metadata
  };

  // Apply sorting to rows
  const sortedRows = sortKey
    ? sortTableRows(tableProps.rows, sortKey, sortDirection)
    : tableProps.rows;

  // Route columns based on view mode
  const allColumns = [...tableProps.columnKeys].filter(key => key !== 'product_name');
  const { fixedColumns, scrollingColumns } = routeColumns(allColumns, currentViewMode);

  // Get column widths
  const columnWidths = getColumnWidths(
    tableProps.columnKeys,
    fixedColumns,
    DEFAULT_LAYOUT.firstColWidth,
    DEFAULT_LAYOUT.metricColWidth
  );

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

  // D1 header drag handler - map column to view mode
  const onHeaderDragStart = (e, columnKey) => {
    const viewMode = getViewModeFromColumn(columnKey);
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

  // A1 header drop handler
  const onA1Drop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    handleDrop(e, DRAG_TYPES.VIEW_MODE, (data) => {
      handleViewModeSwitch(data.viewMode);
    });
  };

  // Sort handler
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

  // Create nested table context
  const nestedTableContext = {
    firstColWidth: tableProps.layout?.firstColWidth,
    metricColWidth: tableProps.layout?.metricColWidth,
    headerHeight: tableProps.layout?.headerHeight,
    rowHeight: tableProps.layout?.rowHeight,
    footerHeight: tableProps.layout?.footerHeight,
    layout: tableProps.layout,
    isTransitioning,
    onHeaderDragStart,
    onA1Drop,
    onDragOver: handleDragOver,
    sortKey,
    sortDirection,
    onSort: handleSort
  };

  return (
    <div className="relative border-b border-t w-full flex flex-col">
      {/* Toolbar - always render */}
      <div className="flex" style={{ width: '100%', height: rowHeight, zIndex: 100 }}>
        <Toolbar
          height={rowHeight}
          borderWidth={1}
          shadowSize=""
          paddingX={3}
          backgroundColor="bg-gradient-to-r from-gray-100 via-white to-gray-100"
          className="w-full cursor-pointer hover:bg-gray-300 rounded-none"
          leftContent={
            <div className="absolute h-6 w-6 shadow bg-gradient-to-t from-gray-100 via-gray-50 to-gray-200">
              <div onClick={() => toggleRowExpanded(rowId)} className="flex py-1 justify-center items-center">
                {isExpanded ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
              </div>
            </div>
          }
          centerContent={
            <div className="flex-1 items-center pl-9">
              <span className=" text-[12px] truncate text-gray-700 font-semibold">{pluginData.title || 'Product Table'}</span>
            </div>
          }
        />
      </div>

      {/* Expanded content - render NestedTable */}
      {isExpanded && (
        <div className="border-t border-gray-200 w-full flex">
          <NestedTable
            fixedColumns={fixedColumns}
            scrollingColumns={scrollingColumns}
            rows={sortedRows}
            totals={tableProps.totals}
            columnKeys={tableProps.columnKeys}
            columnLabels={tableProps.columnLabels}
            columnWidths={columnWidths}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            styles={tableProps.styles}
            layout={{
              firstColWidth: 100,
              metricColWidth: 70,
              headerHeight: 32,
              rowHeight: 32,
              footerHeight: 32
            }}
            onHeaderDragStart={onHeaderDragStart}
            onA1Drop={onA1Drop}
            onDragOver={handleDragOver}
            isTransitioning={isTransitioning}
          />
        </div>
      )}
    </div>
  );
}
