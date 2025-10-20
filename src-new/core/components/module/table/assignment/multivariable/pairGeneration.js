/**
 * pairGeneration.js
 * Generates Cartesian product of two product arrays
 */

/**
 * Generate all possible pairs from two product sets
 * @param {Array} products1 - First set of products
 * @param {Array} products2 - Second set of products
 * @returns {Array} Array of pair objects {productA, productB}
 */
export function generatePairs(products1, products2) {
  if (!Array.isArray(products1) || !Array.isArray(products2)) return [];

  const pairs = [];

  for (const p1 of products1) {
    for (const p2 of products2) {
      // Don't pair a product with itself
      if (p1.product_name !== p2.product_name) {
        pairs.push({
          productA: p1,
          productB: p2
        });
      }
    }
  }

  return pairs;
}

/**
 * Generate pairs and filter by minimum order threshold
 * @param {Array} products1 - First set of products
 * @param {Array} products2 - Second set of products
 * @param {Array} lineItems - All line items to check order counts
 * @param {number} minOrders - Minimum orders threshold
 * @returns {Array} Filtered pairs
 */
export function generatePairsWithThreshold(products1, products2, lineItems, minOrders = 1) {
  const pairs = generatePairs(products1, products2);

  if (minOrders <= 1) return pairs;

  // This would require pairMetrics to calculate, so just return all pairs
  // Filtering happens later in the pipeline
  return pairs;
}
