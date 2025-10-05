// Inventory-specific business calculations
// Builds on math and operations for inventory analysis

import { sumField, averageField, groupBy, countField } from '../operations/aggregations.js';
import { toNumber, round, divide } from '../math/basic.js';

/**
 * Quantity and unit calculations
 */
export const totalQuantitySold = (lineItems) => {
  // Try multiple field names for quantity
  const quantityFields = ['quantity', 'Units', 'quantity_sold', 'units_sold'];
  
  for (const field of quantityFields) {
    const total = sumField(lineItems, field);
    if (total > 0) return total;
  }
  
  return 0;
};

export const averageQuantityPerOrder = (lineItems) => {
  const orderGroups = groupBy(lineItems, 'order_id');
  const orderQuantities = [];
  
  orderGroups.forEach((items) => {
    orderQuantities.push(totalQuantitySold(items));
  });
  
  return orderQuantities.length > 0 ? round(orderQuantities.reduce((sum, qty) => sum + qty, 0) / orderQuantities.length, 2) : 0;
};

export const averageQuantityPerItem = (lineItems) => {
  return round(averageField(lineItems, 'quantity') || averageField(lineItems, 'Units') || 0, 2);
};

/**
 * Product performance metrics
 */
export const productPerformance = (lineItems) => {
  const productGroups = groupBy(lineItems, 'product_name');
  const results = [];
  
  productGroups.forEach((items, productName) => {
    const totalQty = totalQuantitySold(items);
    const uniqueOrders = new Set(items.map(item => item.order_id)).size;
    
    results.push({
      product_name: productName,
      total_quantity: totalQty,
      unique_orders: uniqueOrders,
      average_qty_per_order: uniqueOrders > 0 ? round(totalQty / uniqueOrders, 2) : 0,
      line_items_count: items.length,
      average_qty_per_line: round(totalQty / items.length, 2)
    });
  });
  
  return results.sort((a, b) => b.total_quantity - a.total_quantity);
};

/**
 * Variant analysis
 */
export const variantPerformance = (lineItems) => {
  const variantGroups = groupBy(lineItems, 'sku');
  const results = [];
  
  variantGroups.forEach((items, sku) => {
    const item = items[0]; // Get product info from first item
    
    results.push({
      sku: sku,
      product_name: item.product_name || '',
      color: item.color || item.Color || '',
      size: item.size || item.Size || '',
      total_quantity: totalQuantitySold(items),
      order_count: new Set(items.map(i => i.order_id)).size,
      line_items_count: items.length
    });
  });
  
  return results.sort((a, b) => b.total_quantity - a.total_quantity);
};

/**
 * Size and color analysis
 */
export const sizeDistribution = (lineItems) => {
  const sizeGroups = groupBy(lineItems, 'size');
  const results = [];
  
  sizeGroups.forEach((items, size) => {
    results.push({
      size: size || 'Unknown',
      total_quantity: totalQuantitySold(items),
      order_count: new Set(items.map(item => item.order_id)).size,
      product_count: new Set(items.map(item => item.product_name)).size
    });
  });
  
  return results.sort((a, b) => b.total_quantity - a.total_quantity);
};

export const colorDistribution = (lineItems) => {
  const colorGroups = groupBy(lineItems, 'color');
  const results = [];
  
  colorGroups.forEach((items, color) => {
    results.push({
      color: color || 'Unknown',
      total_quantity: totalQuantitySold(items),
      order_count: new Set(items.map(item => item.order_id)).size,
      product_count: new Set(items.map(item => item.product_name)).size
    });
  });
  
  return results.sort((a, b) => b.total_quantity - a.total_quantity);
};

/**
 * Inventory turnover and velocity
 */
export const calculateVelocity = (lineItems, timeFieldName = 'date') => {
  // Group by product and time period
  const productGroups = groupBy(lineItems, 'product_name');
  const results = [];
  
  productGroups.forEach((items, productName) => {
    const timeGroups = groupBy(items, timeFieldName);
    const periodsWithSales = timeGroups.size;
    const totalQuantity = totalQuantitySold(items);
    
    results.push({
      product_name: productName,
      total_quantity: totalQuantity,
      periods_with_sales: periodsWithSales,
      average_qty_per_period: periodsWithSales > 0 ? round(totalQuantity / periodsWithSales, 2) : 0,
      velocity_score: round(totalQuantity / Math.max(periodsWithSales, 1), 2)
    });
  });
  
  return results.sort((a, b) => b.velocity_score - a.velocity_score);
};

/**
 * Cross-sell analysis
 */
export const itemsPerOrder = (lineItems) => {
  const orderGroups = groupBy(lineItems, 'order_id');
  const orderSizes = [];
  
  orderGroups.forEach((items, orderId) => {
    orderSizes.push({
      order_id: orderId,
      item_count: items.length,
      total_quantity: totalQuantitySold(items),
      unique_products: new Set(items.map(item => item.product_name)).size
    });
  });
  
  return orderSizes.sort((a, b) => b.item_count - a.item_count);
};

export const averageItemsPerOrder = (lineItems) => {
  const orderData = itemsPerOrder(lineItems);
  const totalItems = orderData.reduce((sum, order) => sum + order.item_count, 0);
  
  return orderData.length > 0 ? round(totalItems / orderData.length, 2) : 0;
};