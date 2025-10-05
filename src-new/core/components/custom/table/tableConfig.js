/**
 * Table Config
 *
 * Calls templates and routes their output to TableContainer
 * Manages the bridge between data transformation and UI rendering
 */

import defaultTable from './templates/defaultTable.js';
import { DEFAULT_LAYOUT } from './tableProps.js';
import { getFieldLabel, getNumericFields } from '../../../config/schemaRegistry.js';

/**
 * Apply template to data and return TableContainer-ready props
 *
 * @param {Array} data - Filtered data from dataService
 * @param {Function|null} template - Template function (defaults to defaultTable)
 * @param {Object} options - Additional options
 * @returns {Object} Props ready for TableContainer
 */
export function applyTemplate(data = [], template = null, options = {}) {
  // Use provided template or default
  const templateFn = template || defaultTable;

  // Call template to get transformed data
  const templateOutput = templateFn(data, options);

  // Template returns: { rows, totals, columnKeys, columnLabels, styles, layout }
  const {
    rows = [],
    totals = {},
    columnKeys = [],
    columnLabels = {},
    styles = {},
    layout: templateLayout = {}
  } = templateOutput;

  // Route to TableContainer format
  return {
    // Data
    rows,
    totals,

    // Column configuration
    columnKeys,
    columnLabels,

    // Styles from template
    styles,

    // Layout (template defaults, can be overridden by options)
    layout: {
      firstColWidth: options.firstColWidth || templateLayout.firstColWidth || 200,
      metricColWidth: options.metricColWidth || templateLayout.metricColWidth || 100,
      headerHeight: options.headerHeight || templateLayout.headerHeight || 35,
      rowHeight: options.rowHeight || templateLayout.rowHeight || 50,
      footerHeight: options.footerHeight || templateLayout.footerHeight || 35,
      placeholderCols: options.placeholderCols || 4
    },

    // Visibility
    showHeader: options.showHeader !== false,
    showBody: options.showBody !== false,
    showFooter: options.showFooter !== false
  };
}

/**
 * Route AB table columns (fixed vs scrolling)
 */
export function routeABColumns(columnKeys = []) {
  if (!columnKeys.length) {
    return {
      fixedColumns: [],
      scrollingColumns: []
    };
  }

  // First column is fixed, rest scroll
  return {
    fixedColumns: [columnKeys[0]],
    scrollingColumns: columnKeys.slice(1)
  };
}

/**
 * Route CD table columns (fixed vs scrolling)
 */
export function routeCDColumns(columnKeys = []) {
  if (!columnKeys.length) {
    return {
      fixedColumns: [],
      scrollingColumns: []
    };
  }

  // First column is fixed, rest scroll
  return {
    fixedColumns: [columnKeys[0]],
    scrollingColumns: columnKeys.slice(1)
  };
}

/**
 * Get table configuration for a specific template
 */
export function getTableConfig(templateName = 'default') {
  // Template registry (will expand as we add more templates)
  const templates = {
    default: defaultTable,
    // productPerformance: productPerformanceTemplate,
    // etc...
  };

  return templates[templateName] || templates.default;
}

/**
 * Get column keys for a specific view mode
 * @param {string} viewMode - 'summary', 'by-color', 'by-size', 'by-variant'
 * @returns {string[]} Array of column keys for that view
 */
export function getViewModeColumns(viewMode = 'summary') {
  const columnConfigs = {
    'summary': ['product_name', 'quantity', 'discounted_price'],
    'by-color': ['product_name', 'color', 'quantity', 'discounted_price'],
    'by-size': ['product_name', 'size', 'quantity', 'discounted_price'],
    'by-variant': ['product_name', 'color', 'size', 'quantity', 'discounted_price']
  };

  return columnConfigs[viewMode] || columnConfigs.summary;
}

/**
 * Get standard column labels from schema
 * @param {string[]} columnKeys - Array of field names
 * @param {string} schemaName - Schema to use (defaults to 'retail_line_items')
 * @param {string} displayMode - 'default', 'short', 'verbose'
 * @returns {Object} Map of field_name → display label
 */
export function getStandardColumnLabels(columnKeys = [], schemaName = 'retail_line_items', displayMode = 'default') {
  const labels = {};

  columnKeys.forEach(key => {
    labels[key] = getFieldLabel(schemaName, key, displayMode);
  });

  return labels;
}

/**
 * Get column widths for each field
 * @param {string[]} columnKeys - Array of field names
 * @returns {Object} Map of field_name → width in pixels using DEFAULT_LAYOUT
 */
export function getColumnWidths(columnKeys = []) {
  const widths = {};
  columnKeys.forEach((key, index) => {
    // First column uses firstColWidth, rest use metricColWidth from DEFAULT_LAYOUT
    widths[key] = index === 0 ? DEFAULT_LAYOUT.firstColWidth : DEFAULT_LAYOUT.metricColWidth;
  });
  return widths;
}

/**
 * Get columns that should have totals calculated
 * @param {string[]} columnKeys - Array of field names
 * @param {string} schemaName - Schema to use (defaults to 'retail_line_items')
 * @returns {string[]} Array of field names that should be totaled
 */
export function getTotalableColumns(columnKeys = [], schemaName = 'retail_line_items') {
  const numericFields = getNumericFields(schemaName);

  // Return columnKeys that are in the schema's numeric fields
  return columnKeys.filter(key => numericFields.includes(key));
}

export default {
  applyTemplate,
  routeABColumns,
  routeCDColumns,
  getTableConfig,
  getViewModeColumns,
  getStandardColumnLabels,
  getColumnWidths,
  getTotalableColumns
};
