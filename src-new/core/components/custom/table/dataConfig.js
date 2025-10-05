/**
 * Data Config
 *
 * Receives filtered data from dataService and provides manipulation functions
 * Leverages calculations folder for all math/aggregation operations
 */

import { sumField, groupBy, filterByValue, round } from '../../../calculations/index.js';

/**
 * Basic data pass-through for templates
 */
export function prepareDataForTemplate(data = []) {
  if (!Array.isArray(data)) return [];
  return data;
}

/**
 * Calculate numeric totals for given fields
 * Uses calculations/operations/aggregations.js
 */
export function calculateTotals(data = [], fields = []) {
  const totals = {};

  fields.forEach(field => {
    totals[field] = sumField(data, field);
  });

  return totals;
}

/**
 * Group data by field
 * Uses calculations/operations/aggregations.js
 */
export function groupDataBy(data = [], field) {
  return groupBy(data, field);
}

/**
 * Filter data by field value
 * Uses calculations/operations/aggregations.js
 */
export function filterData(data = [], field, value) {
  return filterByValue(data, field, value);
}

/**
 * Format cell values for display
 */
export function formatValue(key, value) {
  if (value == null || value === "") return "";
  if (typeof value !== "number") return String(value);

  const k = String(key);
  if (k.includes("UPT") || k.includes("Attach Rate")) {
    return round(value, 2);
  }
  if (k.includes("Revenue") || k.includes("Net") || k.includes("AOV")) {
    return `$${Math.round(value).toLocaleString()}`;
  }
  return Math.round(value).toLocaleString();
}

/**
 * Load all-time product data from dataService
 * Used when dragging products to get complete historical data
 */
export async function loadProductData(productNames = []) {
  if (!productNames || productNames.length === 0) {
    return [];
  }

  const data = await loadAllTimeProductData(productNames);
  return data;
}

// Re-export commonly used calculation functions for templates
export { sumField, groupBy, filterByValue, round } from '../../../calculations/index.js';

export default {
  prepareDataForTemplate,
  calculateTotals,
  groupDataBy,
  filterData,
  formatValue,
  loadProductData
};
