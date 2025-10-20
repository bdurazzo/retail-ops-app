/**
 * pairMetrics.js
 * Calculates coupled metrics for product pairs using core calculation functions
 */

import { findOrdersWithProducts, sumField } from '../../../../../calculations/operations/aggregations.js';

/**
 * Calculate all coupled metrics for a product pair
 * @param {Object} pair - Pair object with {productA, productB}
 * @param {Array} lineItems - All line items
 * @param {Object} dateRange - Date range {days: number} or {start: Date, end: Date}
 * @returns {Object} Metrics object
 */
export function calculateCoupledMetrics(pair, lineItems, dateRange) {
  if (!pair?.productA || !pair?.productB || !Array.isArray(lineItems)) {
    return {
      ordersTogether: 0,
      netTogether: 0,
      bundleRate: 0,
      velocityTogether: 0
    };
  }

  const productNames = [pair.productA.product_name, pair.productB.product_name];

  // Use aggregations.js function to find orders with both products
  const pairOrders = findOrdersWithProducts(lineItems, productNames);

  // Filter line items to only those in matching orders
  const pairLineItems = lineItems.filter(item => pairOrders.has(item.order_id));

  // Calculate metrics
  const ordersTogether = pairOrders.size;
  const netTogether = sumField(pairLineItems, 'net');
  const bundleRate = calculateBundleRate(pair, pairOrders, lineItems);
  const velocityTogether = calculatePairVelocity(pairOrders.size, dateRange);

  return {
    ordersTogether,
    netTogether,
    bundleRate,
    velocityTogether
  };
}

/**
 * Calculate bundle rate for a pair
 * How often the pair appears together vs either product alone
 * @param {Object} pair - Pair object
 * @param {Set} pairOrders - Set of order IDs with both products
 * @param {Array} allLineItems - All line items
 * @returns {number} Bundle rate (0-1 scale)
 */
function calculateBundleRate(pair, pairOrders, allLineItems) {
  // Count orders containing product A
  const ordersWithA = new Set(
    allLineItems
      .filter(item => item.product_name === pair.productA.product_name)
      .map(item => item.order_id)
  );

  // Count orders containing product B
  const ordersWithB = new Set(
    allLineItems
      .filter(item => item.product_name === pair.productB.product_name)
      .map(item => item.order_id)
  );

  // Total appearances of either product
  const totalAppearances = ordersWithA.size + ordersWithB.size;

  if (totalAppearances === 0) return 0;

  return pairOrders.size / totalAppearances;
}

/**
 * Calculate velocity for a pair
 * @param {number} orderCount - Number of orders with this pair
 * @param {Object} dateRange - Date range object
 * @returns {number} Orders per day
 */
function calculatePairVelocity(orderCount, dateRange) {
  if (!dateRange) return orderCount;

  if (dateRange.days) {
    return dateRange.days > 0 ? orderCount / dateRange.days : 0;
  }

  if (dateRange.start && dateRange.end) {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    return orderCount / days;
  }

  return orderCount;
}

/**
 * Calculate metrics for multiple pairs
 * @param {Array} pairs - Array of pair objects
 * @param {Array} lineItems - All line items
 * @param {Object} dateRange - Date range
 * @returns {Array} Pairs with metrics attached
 */
export function calculateMetricsForPairs(pairs, lineItems, dateRange) {
  return pairs.map(pair => ({
    ...pair,
    metrics: calculateCoupledMetrics(pair, lineItems, dateRange)
  }));
}
