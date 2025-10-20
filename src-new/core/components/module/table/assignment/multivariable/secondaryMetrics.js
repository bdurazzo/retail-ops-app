/**
 * secondaryMetrics.js
 * Table 2 template: Secondary metrics analysis (Attach Rate, Velocity)
 * Generates table data for top products by secondary performance metrics
 */

import { groupBy, sumField, calculateAttachRate, calculateVelocity } from '../../../../../calculations/operations/aggregations.js';
import { MODULE_LAYOUT } from '../../../../custom/table/tableProps.js';

/**
 * Generate secondary metrics table data
 * @param {Array} lineItems - All line items
 * @param {Object} options - Configuration options
 * @returns {Object} Table props object
 */
export function generateSecondaryMetricsTable(lineItems, options = {}) {
  const {
    sampleSize = 10,
    sortBy = 'attach_rate',
    sortDirection = 'desc',
    dateRange = null,
    referenceProducts = null // Array of product names from Table 1
  } = options;

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return createEmptyTable();
  }

  // Group by product
  const productGroups = groupBy(lineItems, 'product_name');
  const productData = [];

  // Calculate metrics for each product
  productGroups.forEach((items, productName) => {
    // Calculate attach rate relative to reference products (Table 1)
    const attachRate = calculateAttachRate(lineItems, productName, referenceProducts);
    const velocity = calculateVelocity(items, dateRange);

    productData.push({
      _rowId: `product-${productName}`,
      product_name: productName,
      product_title: items[0]?.product_title || productName,
      attach_rate: attachRate,
      velocity
    });
  });

  // Sort by selected metric
  const sortField = sortBy === 'attach_rate' ? 'attach_rate' : 'velocity';
  productData.sort((a, b) => {
    return sortDirection === 'desc'
      ? b[sortField] - a[sortField]
      : a[sortField] - b[sortField];
  });

  // Limit to sample size
  const topProducts = productData.slice(0, sampleSize);

  // Calculate averages for totals
  const avgAttachRate = topProducts.length > 0
    ? topProducts.reduce((sum, p) => sum + p.attach_rate, 0) / topProducts.length
    : 0;

  const avgVelocity = topProducts.length > 0
    ? topProducts.reduce((sum, p) => sum + p.velocity, 0) / topProducts.length
    : 0;

  const totals = {
    attach_rate: avgAttachRate,
    velocity: avgVelocity
  };

  return {
    rows: topProducts,
    totals,
    columnKeys: ['product_name', 'attach_rate', 'velocity'],
    columnLabels: {
      product_name: 'Product',
      attach_rate: 'Attach %',
      velocity: 'Velocity'
    },
    columnWidths: {
      product_name: MODULE_LAYOUT.firstColWidth,
      attach_rate: MODULE_LAYOUT.metricColWidth,
      velocity: MODULE_LAYOUT.metricColWidth
    },
    fixedColumns: ['product_name'],
    scrollingColumns: ['attach_rate', 'velocity'],
    layout: MODULE_LAYOUT,
    styles: {}
  };
}

/**
 * Create empty table structure
 * @returns {Object} Empty table props
 */
function createEmptyTable() {
  return {
    rows: [],
    totals: {},
    columnKeys: ['product_name', 'attach_rate', 'velocity'],
    columnLabels: {
      product_name: 'Product',
      attach_rate: 'Attach Rate (%)',
      velocity: 'Velocity'
    },
    columnWidths: {
      product_name: MODULE_LAYOUT.firstColWidth,
      attach_rate: MODULE_LAYOUT.metricColWidth,
      velocity: MODULE_LAYOUT.metricColWidth
    },
    fixedColumns: ['product_name'],
    scrollingColumns: ['attach_rate', 'velocity'],
    layout: MODULE_LAYOUT,
    styles: {}
  };
}

/**
 * Get products from table for pairing
 * @param {Object} tableProps - Table props from generateSecondaryMetricsTable
 * @returns {Array} Array of product objects
 */
export function getProductsForPairing(tableProps) {
  if (!tableProps?.rows) return [];

  return tableProps.rows.map(row => ({
    product_name: row.product_name,
    product_title: row.product_title || row.product_name,
    attach_rate: row.attach_rate,
    velocity: row.velocity
  }));
}
