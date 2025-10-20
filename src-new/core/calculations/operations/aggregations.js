// Data aggregation operations
// Builds on math functions to aggregate arrays of data

import { sum, mean, count, countNonZero } from '../math/statistical.js';
import { toNumber, round } from '../math/basic.js';

/**
 * Field extraction utilities
 */
export const extractField = (rows, fieldName) => {
  if (!Array.isArray(rows)) return [];
  return rows.map(row => row?.[fieldName]).filter(val => val !== null && val !== undefined);
};

export const extractNumericField = (rows, fieldName, defaultValue = 0) => {
  return extractField(rows, fieldName).map(val => toNumber(val, defaultValue));
};

/**
 * Basic aggregations
 */
export const sumField = (rows, fieldName) => {
  return sum(extractNumericField(rows, fieldName));
};

export const averageField = (rows, fieldName) => {
  return mean(extractNumericField(rows, fieldName));
};

export const countField = (rows, fieldName) => {
  return count(extractField(rows, fieldName));
};

export const countNonZeroField = (rows, fieldName) => {
  return countNonZero(extractNumericField(rows, fieldName));
};

/**
 * Group by operations
 */
export const groupBy = (rows, keyField) => {
  if (!Array.isArray(rows)) return new Map();
  
  const groups = new Map();
  
  rows.forEach(row => {
    const key = row?.[keyField];
    if (key === null || key === undefined) return;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(row);
  });
  
  return groups;
};

export const groupByMultiple = (rows, keyFields) => {
  if (!Array.isArray(rows) || !Array.isArray(keyFields)) return new Map();
  
  const groups = new Map();
  
  rows.forEach(row => {
    const compositeKey = keyFields.map(field => row?.[field]).join('|');
    
    if (!groups.has(compositeKey)) {
      groups.set(compositeKey, []);
    }
    groups.get(compositeKey).push(row);
  });
  
  return groups;
};

/**
 * Aggregate grouped data
 */
export const aggregateGroups = (groupedData, aggregations) => {
  const results = [];
  
  groupedData.forEach((rows, key) => {
    const result = { groupKey: key };
    
    Object.entries(aggregations).forEach(([outputField, config]) => {
      const { field, operation } = config;
      
      switch (operation) {
        case 'sum':
          result[outputField] = sumField(rows, field);
          break;
        case 'average':
          result[outputField] = round(averageField(rows, field), 2);
          break;
        case 'count':
          result[outputField] = countField(rows, field);
          break;
        case 'countNonZero':
          result[outputField] = countNonZeroField(rows, field);
          break;
        default:
          result[outputField] = 0;
      }
    });
    
    results.push(result);
  });
  
  return results;
};

/**
 * Quick aggregation helpers
 */
export const sumByGroup = (rows, groupField, sumField) => {
  const groups = groupBy(rows, groupField);
  const results = [];
  
  groups.forEach((groupRows, key) => {
    results.push({
      [groupField]: key,
      [sumField]: sumField(groupRows, sumField),
      count: groupRows.length
    });
  });
  
  return results;
};

export const averageByGroup = (rows, groupField, avgField) => {
  const groups = groupBy(rows, groupField);
  const results = [];
  
  groups.forEach((groupRows, key) => {
    results.push({
      [groupField]: key,
      [avgField]: round(averageField(groupRows, avgField), 2),
      count: groupRows.length
    });
  });
  
  return results;
};

/**
 * Filter operations
 */
export const filterByValue = (rows, field, value) => {
  if (!Array.isArray(rows)) return [];
  return rows.filter(row => row?.[field] === value);
};

export const filterByRange = (rows, field, min, max) => {
  if (!Array.isArray(rows)) return [];
  return rows.filter(row => {
    const val = toNumber(row?.[field]);
    return val >= toNumber(min) && val <= toNumber(max);
  });
};

export const filterNonZero = (rows, field) => {
  if (!Array.isArray(rows)) return [];
  return rows.filter(row => toNumber(row?.[field]) !== 0);
};

/**
 * Coupled Pairs Analysis Functions
 * Used for multivariate product analysis
 */

/**
 * Find all unique orders that contain ALL specified products
 * @param {Array} lineItems - Array of line item records
 * @param {Array} productNames - Array of product names to find together
 * @returns {Set} Set of order IDs containing all specified products
 */
export const findOrdersWithProducts = (lineItems, productNames) => {
  if (!Array.isArray(lineItems) || !Array.isArray(productNames)) return new Set();
  if (productNames.length === 0) return new Set();

  // Group line items by order
  const orderGroups = groupBy(lineItems, 'order_id');
  const matchingOrders = new Set();

  // Check each order for all specified products
  orderGroups.forEach((items, orderId) => {
    const productsInOrder = new Set(items.map(item => item.product_name));
    const hasAllProducts = productNames.every(name => productsInOrder.has(name));

    if (hasAllProducts) {
      matchingOrders.add(orderId);
    }
  });

  return matchingOrders;
};

/**
 * Calculate attach rate for a product
 * Measures how frequently a product appears with other products vs. alone
 * @param {Array} lineItems - Array of line item records
 * @param {string} productName - Product to calculate attach rate for
 * @param {Array} referenceProducts - Optional array of product names to calculate attach rate against
 * @returns {number} Attach rate (0-1 scale)
 */
export const calculateAttachRate = (lineItems, productName, referenceProducts = null) => {
  if (!Array.isArray(lineItems) || !productName) return 0;

  const orderGroups = groupBy(lineItems, 'order_id');

  // If reference products provided, calculate attach rate relative to those
  if (referenceProducts && Array.isArray(referenceProducts) && referenceProducts.length > 0) {
    let ordersWithReferenceProducts = 0;
    let ordersWithBothReferenceAndTarget = 0;

    orderGroups.forEach((items) => {
      const productNames = items.map(item => item.product_name);

      // Does this order contain any reference products?
      const hasReferenceProduct = referenceProducts.some(refProduct => productNames.includes(refProduct));

      if (hasReferenceProduct) {
        ordersWithReferenceProducts++;

        // Does it also contain the target product?
        if (productNames.includes(productName)) {
          ordersWithBothReferenceAndTarget++;
        }
      }
    });

    if (ordersWithReferenceProducts === 0) return 0;
    // Return as percentage (0-100) with 1 decimal place
    const rate = (ordersWithBothReferenceAndTarget / ordersWithReferenceProducts) * 100;
    return round(rate, 1);
  }

  // Default behavior: calculate general multi-item attach rate
  let ordersWithProduct = 0;
  let ordersWithProductAndOthers = 0;

  orderGroups.forEach((items) => {
    const hasProduct = items.some(item => item.product_name === productName);

    if (hasProduct) {
      ordersWithProduct++;

      // Check if order has other products besides this one
      const hasOtherProducts = items.some(item => item.product_name !== productName);
      if (hasOtherProducts) {
        ordersWithProductAndOthers++;
      }
    }
  });

  if (ordersWithProduct === 0) return 0;
  return round(ordersWithProductAndOthers / ordersWithProduct, 2);
};

/**
 * Calculate sales velocity for a product
 * Measures order frequency (orders per day)
 * @param {Array} lineItems - Array of line item records for a product
 * @param {Object} dateRange - Object with {days: number} representing the time period
 * @returns {number} Orders per day (rounded to 2 decimals)
 */
export const calculateVelocity = (lineItems, dateRange) => {
  if (!Array.isArray(lineItems) || lineItems.length === 0) return 0;

  // Count unique orders for this product
  const uniqueOrders = new Set(lineItems.map(item => item.order_id)).size;

  // Use provided days from dateRange (e.g., 30 days for a month of data)
  const days = dateRange?.days || 30;

  return days > 0 ? round(uniqueOrders / days, 2) : 0;
};