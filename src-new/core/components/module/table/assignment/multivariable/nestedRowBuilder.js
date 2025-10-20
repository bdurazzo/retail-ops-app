/**
 * nestedRowBuilder.js
 * Builds nested row data showing best alternative pairs for each product
 */

/**
 * Build nested rows for a pair showing best alternatives
 * @param {Object} currentPair - The current pair being displayed
 * @param {Array} allPairs - All calculated pairs
 * @returns {Array} Array of nested row objects
 */
export function buildNestedRowsForPair(currentPair, allPairs) {
  if (!currentPair?.productA || !currentPair?.productB || !Array.isArray(allPairs)) {
    return [];
  }

  const { productA, productB } = currentPair;

  const nestedRowsA = buildNestedRowsForProduct(productA, allPairs, currentPair);
  const nestedRowsB = buildNestedRowsForProduct(productB, allPairs, currentPair);

  return [nestedRowsA, nestedRowsB];
}

/**
 * Build nested row data for a single product
 * @param {Object} product - Product object
 * @param {Array} allPairs - All pairs
 * @param {Object} currentPair - Current pair for comparison
 * @returns {Object} Nested row data
 */
function buildNestedRowsForProduct(product, allPairs, currentPair) {
  // Find all pairs containing this product
  const pairsWithProduct = allPairs.filter(p =>
    p.productA.product_name === product.product_name ||
    p.productB.product_name === product.product_name
  );

  if (pairsWithProduct.length === 0) {
    return {
      type: `best_pairs_for_${product.product_name}`,
      label: `Best Alternative Pairs for ${product.product_name}`,
      metrics: {}
    };
  }

  // Find best performing pair for each metric
  const bestByMetric = {
    orders: findBestByMetric(pairsWithProduct, 'ordersTogether'),
    net: findBestByMetric(pairsWithProduct, 'netTogether'),
    bundleRate: findBestByMetric(pairsWithProduct, 'bundleRate'),
    velocity: findBestByMetric(pairsWithProduct, 'velocityTogether')
  };

  return {
    type: `best_pairs_for_${product.product_name}`,
    label: `Best Alternative Pairs for ${product.product_name}`,
    metrics: {
      orders: {
        bestPair: getPartnerName(bestByMetric.orders, product.product_name),
        value: bestByMetric.orders.metrics?.ordersTogether || 0,
        percentDiff: calculatePercentDiff(
          bestByMetric.orders.metrics?.ordersTogether || 0,
          currentPair.metrics?.ordersTogether || 0
        ),
        isCurrent: isPairCurrent(bestByMetric.orders, currentPair)
      },
      net: {
        bestPair: getPartnerName(bestByMetric.net, product.product_name),
        value: bestByMetric.net.metrics?.netTogether || 0,
        percentDiff: calculatePercentDiff(
          bestByMetric.net.metrics?.netTogether || 0,
          currentPair.metrics?.netTogether || 0
        ),
        isCurrent: isPairCurrent(bestByMetric.net, currentPair)
      },
      bundleRate: {
        bestPair: getPartnerName(bestByMetric.bundleRate, product.product_name),
        value: bestByMetric.bundleRate.metrics?.bundleRate || 0,
        percentDiff: calculatePercentDiff(
          bestByMetric.bundleRate.metrics?.bundleRate || 0,
          currentPair.metrics?.bundleRate || 0
        ),
        isCurrent: isPairCurrent(bestByMetric.bundleRate, currentPair)
      },
      velocity: {
        bestPair: getPartnerName(bestByMetric.velocity, product.product_name),
        value: bestByMetric.velocity.metrics?.velocityTogether || 0,
        percentDiff: calculatePercentDiff(
          bestByMetric.velocity.metrics?.velocityTogether || 0,
          currentPair.metrics?.velocityTogether || 0
        ),
        isCurrent: isPairCurrent(bestByMetric.velocity, currentPair)
      }
    }
  };
}

/**
 * Find best pair by specific metric
 * @param {Array} pairs - Array of pairs
 * @param {string} metricKey - Metric to compare
 * @returns {Object} Best performing pair
 */
function findBestByMetric(pairs, metricKey) {
  if (!pairs || pairs.length === 0) return { metrics: {} };

  return pairs.reduce((best, pair) => {
    const bestVal = best.metrics?.[metricKey] || 0;
    const pairVal = pair.metrics?.[metricKey] || 0;
    return pairVal > bestVal ? pair : best;
  }, pairs[0]);
}

/**
 * Get partner product name from a pair
 * @param {Object} pair - Pair object
 * @param {string} productName - Name of one product
 * @returns {string} Name of partner product
 */
function getPartnerName(pair, productName) {
  if (!pair?.productA || !pair?.productB) return 'Unknown';

  return pair.productA.product_name === productName
    ? pair.productB.product_name
    : pair.productA.product_name;
}

/**
 * Calculate percentage difference
 * @param {number} newValue - New value
 * @param {number} currentValue - Current value
 * @returns {number} Percentage difference
 */
function calculatePercentDiff(newValue, currentValue) {
  if (currentValue === 0) {
    return newValue > 0 ? 100 : 0;
  }

  return ((newValue - currentValue) / currentValue) * 100;
}

/**
 * Check if a pair is the current pair
 * @param {Object} pair - Pair to check
 * @param {Object} currentPair - Current pair
 * @returns {boolean} True if same pair
 */
function isPairCurrent(pair, currentPair) {
  if (!pair?.productA || !pair?.productB || !currentPair?.productA || !currentPair?.productB) {
    return false;
  }

  return (
    (pair.productA.product_name === currentPair.productA.product_name &&
     pair.productB.product_name === currentPair.productB.product_name) ||
    (pair.productA.product_name === currentPair.productB.product_name &&
     pair.productB.product_name === currentPair.productA.product_name)
  );
}
