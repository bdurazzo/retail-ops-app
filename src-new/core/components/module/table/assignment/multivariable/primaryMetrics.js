/**
 * primaryMetrics.js
 * Table 1 template: Primary metrics analysis (Quantity, Net Revenue)
 * Generates table data for top products by primary sales metrics
 */

import { groupBy, sumField } from '../../../../../calculations/operations/aggregations.js';
import { MODULE_LAYOUT } from '../../../../custom/table/tableProps.js';

/**
 * Generate primary metrics table data
 * @param {Array} lineItems - All line items
 * @param {Object} options - Configuration options
 * @returns {Object} Table props object
 */
export function generatePrimaryMetricsTable(lineItems, options = {}) {
  const {
    sampleSize = 10,
    sortBy = 'quantity',
    sortDirection = 'desc'
  } = options;

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return createEmptyTable();
  }

  // Group by product
  const productGroups = groupBy(lineItems, 'product_name');
  const productData = [];

  // Calculate metrics for each product
  productGroups.forEach((items, productName) => {
    const quantity = sumField(items, 'quantity');
    // Calculate net revenue: sum of (quantity * discounted_price)
    const discounted_price = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.discounted_price) || 0;
      return sum + (qty * price);
    }, 0);

    productData.push({
      _rowId: `product-${productName}`,
      product_name: productName,
      product_title: items[0]?.product_title || productName,
      quantity,
      discounted_price
    });
  });

  // Sort by selected metric
  const sortField = sortBy === 'quantity' ? 'quantity' : 'discounted_price';
  productData.sort((a, b) => {
    return sortDirection === 'desc'
      ? b[sortField] - a[sortField]
      : a[sortField] - b[sortField];
  });

  // Limit to sample size
  const topProducts = productData.slice(0, sampleSize);

  // Calculate totals
  const totals = {
    quantity: sumField(topProducts, 'quantity'),
    discounted_price: sumField(topProducts, 'discounted_price')
  };

  return {
    rows: topProducts,
    totals,
    columnKeys: ['product_name', 'quantity', 'discounted_price'],
    columnLabels: {
      product_name: 'Product',
      quantity: 'Units',
      discounted_price: 'Net'
    },
    columnWidths: {
      product_name: MODULE_LAYOUT.firstColWidth,
      quantity: MODULE_LAYOUT.metricColWidth,
      discounted_price: MODULE_LAYOUT.metricColWidth
    },
    fixedColumns: ['product_name'],
    scrollingColumns: ['quantity', 'discounted_price'],
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
    columnKeys: ['product_name', 'quantity', 'discounted_price'],
    columnLabels: {
      product_name: 'Product',
      quantity: 'Units',
      discounted_price: 'Net'
    },
    columnWidths: {
      product_name: MODULE_LAYOUT.firstColWidth,
      quantity: MODULE_LAYOUT.metricColWidth,
      discounted_price: MODULE_LAYOUT.metricColWidth
    },
    fixedColumns: ['product_name'],
    scrollingColumns: ['quantity', 'discounted_price'],
    layout: MODULE_LAYOUT,
    styles: {}
  };
}

/**
 * Get products from table for pairing
 * @param {Object} tableProps - Table props from generatePrimaryMetricsTable
 * @returns {Array} Array of product objects
 */
export function getProductsForPairing(tableProps) {
  if (!tableProps?.rows) return [];

  return tableProps.rows.map(row => ({
    product_name: row.product_name,
    product_title: row.product_title || row.product_name,
    quantity: row.quantity,
    discounted_price: row.discounted_price
  }));
}
