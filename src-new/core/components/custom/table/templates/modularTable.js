/**
 * Modular Table Template
 *
 * Returns empty grid structure with drop zones
 * Grid dimensions can be configured via options
 */

import { MODULE_STYLES, DEFAULT_COLUMN_LABELS, MODULE_LAYOUT } from '../tableProps.js';

export function modularTable(rawData = [], options = {}) {
  const {
    gridRows = 15,
    gridCols = 0,
    headerHeight = MODULE_LAYOUT.headerHeight,
    rowHeight = MODULE_LAYOUT.rowHeight,
    footerHeight = MODULE_LAYOUT.footerHeight,
    firstColWidth = MODULE_LAYOUT.firstColWidth,
    metricColWidth = MODULE_LAYOUT.metricColWidth
  } = options;

  // Generate column keys (col_0, col_1, col_2, etc.)
  // If gridCols is 0, create placeholder slots instead
  const minCols = gridCols === 0 ? 6 : gridCols;
  const columnKeys = Array.from({ length: minCols }, (_, i) =>
    gridCols === 0 ? `_placeholder_${i}` : `col_${i}`
  );

  // Split into fixed (first column) and scrolling (rest)
  const fixedColumns = [columnKeys[0]];
  const scrollingColumns = columnKeys.slice(1);

  // Generate column labels (Column 1, Column 2, etc.)
  const columnLabels = {};
  columnKeys.forEach((key, i) => {
    // Don't label placeholder columns (they'll show as drop zones)
    if (!key.startsWith('_placeholder')) {
      columnLabels[key] = ` ${i + 1}`;
    }
  });

  // Generate column widths
  const columnWidths = {};
  columnKeys.forEach((key, i) => {
    columnWidths[key] = i === 0 ? firstColWidth : metricColWidth;
  });

  // Generate empty rows with drop zone cells
  const rows = Array.from({ length: gridRows }, (_, rowIndex) => {
    const row = {
      _rowId: `row_${rowIndex}`,
      _dropZone: true
    };

    columnKeys.forEach(colKey => {
      row[colKey] = ''; // Empty cell, ready for drop
    });

    return row;
  });

  // Empty totals
  const totals = {
    col_0: 'Total'
  };

  return {
    rows,
    totals,
    columnKeys,
    columnLabels,
    columnWidths,
    fixedColumns,
    scrollingColumns,
    styles: MODULE_STYLES,
    layout: {
      firstColWidth,
      metricColWidth,
      headerHeight,
      rowHeight,
      footerHeight
    }
  };
}

export default modularTable;
