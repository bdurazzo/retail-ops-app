/**
 * Calculation Service
 *
 * Bridges the gap between dataService and calculation functions.
 * Handles loading enriched data (orders + line_items joined) and
 * passes it to existing calculation functions from core/calculations.
 */

import { loadAnalyticsData } from './dataService.js';

// Import existing calculation functions
import {
  groupBy,
  sumField,
  averageField,
  countField,
  findOrdersWithProducts,
  calculateAttachRate,
  calculateVelocity as aggregationsVelocity
} from '../calculations/operations/aggregations.js';

import {
  totalQuantitySold,
  averageQuantityPerOrder,
  averageQuantityPerItem,
  productPerformance,
  variantPerformance,
  sizeDistribution,
  colorDistribution,
  calculateVelocity,
  itemsPerOrder,
  averageItemsPerOrder
} from '../calculations/business/inventory.js';

import {
  orderSummary,
  totalOrders,
  averageOrderSize,
  averageOrderQuantity,
  ordersByValue,
  ordersByChannel,
  ordersByLocation,
  ordersByAssociate,
  ordersByTimeFrame,
  ordersByStatus
} from '../calculations/business/orders.js';

import {
  totalRevenue,
  averageOrderValue,
  averageItemValue,
  revenueByProduct,
  revenueByPeriod,
  calculateMargins,
  totalMargin,
  averageUnitPrice,
  revenuePerUnit
} from '../calculations/business/revenue.js';

/**
 * Load enriched dataset (line items with order data joined)
 * @param {Object} query - Query object with time filters
 * @returns {Promise<Array>} Enriched line items array with date_time, customer_name, etc.
 */
export async function loadEnrichedDataset(query = {}) {
  const result = await loadAnalyticsData(query, {}, 'line_items');
  return result.rawData;
}

/**
 * Product Performance Metrics
 * Uses existing productPerformance function from business/inventory.js
 */
export async function getProductPerformance(query = {}) {
  const enrichedData = await loadEnrichedDataset(query);
  return productPerformance(enrichedData);
}

/**
 * Product Velocity
 * Uses existing calculateVelocity function from business/inventory.js
 */
export async function getProductVelocity(query = {}, timeField = 'date_time') {
  const enrichedData = await loadEnrichedDataset(query);
  return calculateVelocity(enrichedData, timeField);
}

/**
 * Order Summary
 * Uses existing orderSummary function from business/orders.js
 */
export async function getOrderSummary(query = {}) {
  const enrichedData = await loadEnrichedDataset(query);
  return orderSummary(enrichedData);
}

/**
 * Revenue by Product
 * Uses existing revenueByProduct function from business/revenue.js
 */
export async function getRevenueByProduct(query = {}) {
  const enrichedData = await loadEnrichedDataset(query);
  return revenueByProduct(enrichedData);
}

/**
 * Variant Performance
 * Uses existing variantPerformance function from business/inventory.js
 */
export async function getVariantPerformance(query = {}) {
  const enrichedData = await loadEnrichedDataset(query);
  return variantPerformance(enrichedData);
}

/**
 * Order Statistics
 */
export async function getOrderStats(query = {}) {
  const enrichedData = await loadEnrichedDataset(query);
  return {
    totalOrders: totalOrders(enrichedData),
    averageOrderSize: averageOrderSize(enrichedData),
    averageOrderQuantity: averageOrderQuantity(enrichedData),
    averageItemsPerOrder: averageItemsPerOrder(enrichedData)
  };
}

/**
 * Revenue Statistics
 */
export async function getRevenueStats(query = {}) {
  const enrichedData = await loadEnrichedDataset(query);
  return {
    totalRevenue: totalRevenue(enrichedData),
    averageOrderValue: averageOrderValue(enrichedData),
    averageItemValue: averageItemValue(enrichedData),
    totalMargin: totalMargin(enrichedData)
  };
}

/**
 * Inventory Statistics
 */
export async function getInventoryStats(query = {}) {
  const enrichedData = await loadEnrichedDataset(query);
  return {
    totalQuantity: totalQuantitySold(enrichedData),
    averageQuantityPerOrder: averageQuantityPerOrder(enrichedData),
    averageQuantityPerItem: averageQuantityPerItem(enrichedData)
  };
}

export default {
  loadEnrichedDataset,
  getProductPerformance,
  getProductVelocity,
  getOrderSummary,
  getRevenueByProduct,
  getVariantPerformance,
  getOrderStats,
  getRevenueStats,
  getInventoryStats
};
