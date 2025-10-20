/**
 * compoundRanking.js
 * Ranks product pairs by normalized compound score across multiple metrics
 */

/**
 * Rank pairs by compound score
 * @param {Array} pairs - Array of pairs with metrics
 * @param {Object} weights - Metric weights (default: equal weights)
 * @returns {Array} Sorted pairs with compoundScore added
 */
export function rankPairsByCompoundScore(pairs, weights = null) {
  if (!Array.isArray(pairs) || pairs.length === 0) return [];

  const w = weights || {
    ordersTogether: 0.25,
    netTogether: 0.25,
    bundleRate: 0.25,
    velocityTogether: 0.25
  };

  // Normalize metrics to 0-1 scale
  const normalized = normalizePairMetrics(pairs);

  // Calculate compound score for each pair
  const scored = normalized.map(pair => ({
    ...pair,
    compoundScore:
      pair.ordersTogether_norm * w.ordersTogether +
      pair.netTogether_norm * w.netTogether +
      pair.bundleRate_norm * w.bundleRate +
      pair.velocityTogether_norm * w.velocityTogether
  }));

  // Sort by compound score (highest first)
  return scored.sort((a, b) => b.compoundScore - a.compoundScore);
}

/**
 * Normalize all metrics to 0-1 scale
 * @param {Array} pairs - Pairs with metrics
 * @returns {Array} Pairs with normalized metrics added
 */
function normalizePairMetrics(pairs) {
  const metrics = ['ordersTogether', 'netTogether', 'bundleRate', 'velocityTogether'];
  const ranges = {};

  // Calculate min/max for each metric
  metrics.forEach(metric => {
    const values = pairs.map(p => p.metrics?.[metric] || 0);
    ranges[metric] = {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  });

  // Normalize each pair's metrics
  return pairs.map(pair => ({
    ...pair,
    ordersTogether_norm: normalize(pair.metrics?.ordersTogether || 0, ranges.ordersTogether),
    netTogether_norm: normalize(pair.metrics?.netTogether || 0, ranges.netTogether),
    bundleRate_norm: normalize(pair.metrics?.bundleRate || 0, ranges.bundleRate),
    velocityTogether_norm: normalize(pair.metrics?.velocityTogether || 0, ranges.velocityTogether)
  }));
}

/**
 * Normalize a value to 0-1 scale
 * @param {number} value - Value to normalize
 * @param {Object} range - {min, max}
 * @returns {number} Normalized value
 */
function normalize(value, range) {
  const { min, max } = range;

  // If all values are the same, return 0.5
  if (max === min) return 0.5;

  return (value - min) / (max - min);
}

/**
 * Rank pairs by a single metric
 * @param {Array} pairs - Pairs with metrics
 * @param {string} metricKey - Metric to sort by
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} Sorted pairs
 */
export function rankPairsByMetric(pairs, metricKey, direction = 'desc') {
  if (!Array.isArray(pairs)) return [];

  const sorted = [...pairs].sort((a, b) => {
    const aVal = a.metrics?.[metricKey] || 0;
    const bVal = b.metrics?.[metricKey] || 0;
    return direction === 'desc' ? bVal - aVal : aVal - bVal;
  });

  return sorted;
}

/**
 * Get top N pairs
 * @param {Array} pairs - Sorted pairs
 * @param {number} limit - Number of pairs to return
 * @returns {Array} Top N pairs
 */
export function getTopPairs(pairs, limit = 10) {
  if (!Array.isArray(pairs)) return [];
  return pairs.slice(0, limit);
}
