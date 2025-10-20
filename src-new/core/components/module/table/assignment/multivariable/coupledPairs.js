/**
 * coupledPairs.js
 * Table 3 template: Coupled pairs analysis
 * Generates table data for product pairs with compound metrics
 */

import { generatePairs } from './pairGeneration.js';
import { calculateMetricsForPairs } from './pairMetrics.js';
import { rankPairsByCompoundScore, getTopPairs } from './compoundRanking.js';
import { buildNestedRowsForPair } from './nestedRowBuilder.js';
import { MODULE_LAYOUT } from '../../../../custom/table/tableProps.js';

/**
 * Generate coupled pairs table data
 * @param {Array} products1 - Products from table 1
 * @param {Array} products2 - Products from table 2
 * @param {Array} lineItems - All line items
 * @param {Object} options - Configuration options
 * @returns {Object} Table props object
 */
export function generateCoupledPairsTable(products1, products2, lineItems, options = {}) {
  const {
    sampleSize = 10,
    sortBy = 'compound',
    sortDirection = 'desc',
    dateRange = null,
    weights = null
  } = options;

  if (!Array.isArray(products1) || !Array.isArray(products2) ||
      !Array.isArray(lineItems) || products1.length === 0 || products2.length === 0) {
    return createEmptyTable();
  }

  // Generate all possible pairs
  const pairs = generatePairs(products1, products2);

  if (pairs.length === 0) {
    return createEmptyTable();
  }

  // Calculate metrics for each pair
  const pairsWithMetrics = calculateMetricsForPairs(pairs, lineItems, dateRange);

  // Rank by compound score
  const rankedPairs = rankPairsByCompoundScore(pairsWithMetrics, weights);

  // Get top N pairs
  const topPairs = getTopPairs(rankedPairs, sampleSize);

  // Build table rows with nested row data
  const rows = topPairs.map((pair, index) => ({
    _rowId: `pair-${pair.productA.product_name}-${pair.productB.product_name}`,
    product_a: pair.productA.product_name,
    product_b: pair.productB.product_name,
    orders_together: pair.metrics.ordersTogether,
    net_together: pair.metrics.netTogether,
    bundle_rate: pair.metrics.bundleRate,
    velocity_together: pair.metrics.velocityTogether,
    compound_score: pair.compoundScore || 0,
    // Store full pair data for nested rows
    _pairData: pair,
    _allPairs: rankedPairs,
    // Generate nested rows
    nestedRows: buildNestedRowsForPair(pair, rankedPairs)
  }));

  // Calculate totals
  const totals = {
    orders_together: rows.reduce((sum, r) => sum + r.orders_together, 0),
    net_together: rows.reduce((sum, r) => sum + r.net_together, 0),
    bundle_rate: rows.length > 0
      ? rows.reduce((sum, r) => sum + r.bundle_rate, 0) / rows.length
      : 0,
    velocity_together: rows.length > 0
      ? rows.reduce((sum, r) => sum + r.velocity_together, 0) / rows.length
      : 0,
    compound_score: rows.length > 0
      ? rows.reduce((sum, r) => sum + r.compound_score, 0) / rows.length
      : 0
  };

  return {
    rows,
    totals,
    columnKeys: ['product_a', 'product_b', 'orders_together', 'net_together', 'bundle_rate', 'velocity_together', 'compound_score'],
    columnLabels: {
      product_a: 'Product A',
      product_b: 'Product B',
      orders_together: 'Orders Together',
      net_together: 'Net Together',
      bundle_rate: 'Bundle Rate',
      velocity_together: 'Velocity',
      compound_score: 'Score'
    },
    columnWidths: {
      product_a: MODULE_LAYOUT.firstColWidth,
      product_b: MODULE_LAYOUT.firstColWidth,
      orders_together: MODULE_LAYOUT.metricColWidth,
      net_together: MODULE_LAYOUT.metricColWidth,
      bundle_rate: MODULE_LAYOUT.metricColWidth,
      velocity_together: MODULE_LAYOUT.metricColWidth,
      compound_score: MODULE_LAYOUT.metricColWidth
    },
    fixedColumns: ['product_a', 'product_b'],
    scrollingColumns: ['orders_together', 'net_together', 'bundle_rate', 'velocity_together', 'compound_score'],
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
    columnKeys: ['product_a', 'product_b', 'orders_together', 'net_together', 'bundle_rate', 'velocity_together', 'compound_score'],
    columnLabels: {
      product_a: 'Product A',
      product_b: 'Product B',
      orders_together: 'Orders Together',
      net_together: 'Net Together',
      bundle_rate: 'Bundle Rate',
      velocity_together: 'Velocity',
      compound_score: 'Score'
    },
    columnWidths: {
      product_a: MODULE_LAYOUT.firstColWidth,
      product_b: MODULE_LAYOUT.firstColWidth,
      orders_together: MODULE_LAYOUT.metricColWidth,
      net_together: MODULE_LAYOUT.metricColWidth,
      bundle_rate: MODULE_LAYOUT.metricColWidth,
      velocity_together: MODULE_LAYOUT.metricColWidth,
      compound_score: MODULE_LAYOUT.metricColWidth
    },
    fixedColumns: ['product_a', 'product_b'],
    scrollingColumns: ['orders_together', 'net_together', 'bundle_rate', 'velocity_together', 'compound_score'],
    layout: MODULE_LAYOUT,
    styles: {}
  };
}

/**
 * Nested row renderer for Table 3
 * @param {Object} row - Table row with nested data
 * @returns {React.Element} Nested row content
 */
export function renderNestedPairRows(row) {
  if (!row?.nestedRows || row.nestedRows.length === 0) {
    return null;
  }

  // This will be implemented in the actual component
  // For now, return the data structure that the component will use
  return {
    type: 'nested-pairs',
    data: row.nestedRows
  };
}
