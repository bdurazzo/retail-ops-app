/**
 * Default Table Template
 *
 * Returns empty grid structure with drop zones
 * Grid dimensions can be configured via options
 */

import { DEFAULT_STYLES, DEFAULT_COLUMN_LABELS, DEFAULT_LAYOUT } from '../tableProps.js';

export function defaultTable(rawData = [], options = {}) {
  const {
    gridRows = 10,
    gridCols = 8,
    headerHeight = DEFAULT_LAYOUT.headerHeight,
    rowHeight = DEFAULT_LAYOUT.rowHeight,
    footerHeight = DEFAULT_LAYOUT.footerHeight,
    firstColWidth = DEFAULT_LAYOUT.firstColWidth,
    metricColWidth = DEFAULT_LAYOUT.metricColWidth
  } = options;

  // Generate column keys (col_0, col_1, col_2, etc.)
  const columnKeys = Array.from({ length: gridCols }, (_, i) => `col_${i}`);

  // Split into fixed (first column) and scrolling (rest)
  const fixedColumns = [columnKeys[0]];
  const scrollingColumns = columnKeys.slice(1);

  // Generate column labels (Column 1, Column 2, etc.)
  const columnLabels = {};
  columnKeys.forEach((key, i) => {
    columnLabels[key] = `Drop Zone ${i + 1}`;
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
    styles: DEFAULT_STYLES,
    layout: {
      firstColWidth,
      metricColWidth,
      headerHeight,
      rowHeight,
      footerHeight
    }
  };
}

export default defaultTable;
