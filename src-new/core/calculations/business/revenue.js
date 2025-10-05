// Revenue-specific business calculations
// Builds on math and operations for revenue analysis

import { sumField, averageField, groupBy, aggregateGroups } from '../operations/aggregations.js';
import { grossMargin, marginPercent, unitPrice, totalAmount } from '../math/financial.js';
import { toNumber, round } from '../math/basic.js';

/**
 * Revenue calculations from line items
 */
export const totalRevenue = (lineItems) => {
  // Try multiple field names for flexibility
  const revenueFields = ['discounted_price', 'net_price', 'total_price', 'revenue', 'Net', 'Product Net'];
  
  for (const field of revenueFields) {
    const total = sumField(lineItems, field);
    if (total > 0) return total;
  }
  
  return 0;
};

export const averageOrderValue = (lineItems) => {
  // Group by order and calculate average order total
  const orderGroups = groupBy(lineItems, 'order_id');
  const orderTotals = [];
  
  orderGroups.forEach((items) => {
    orderTotals.push(totalRevenue(items));
  });
  
  return orderTotals.length > 0 ? round(orderTotals.reduce((sum, total) => sum + total, 0) / orderTotals.length, 2) : 0;
};

export const averageItemValue = (lineItems) => {
  return round(averageField(lineItems, 'discounted_price') || averageField(lineItems, 'Net') || 0, 2);
};

/**
 * Revenue by product
 */
export const revenueByProduct = (lineItems) => {
  const productGroups = groupBy(lineItems, 'product_name');
  const results = [];
  
  productGroups.forEach((items, productName) => {
    results.push({
      product_name: productName,
      total_revenue: totalRevenue(items),
      total_quantity: sumField(items, 'quantity') || sumField(items, 'Units') || 0,
      average_price: averageItemValue(items),
      order_count: new Set(items.map(item => item.order_id)).size
    });
  });
  
  return results.sort((a, b) => b.total_revenue - a.total_revenue);
};

/**
 * Revenue by time period
 */
export const revenueByPeriod = (lineItems, periodField = 'date') => {
  const periodGroups = groupBy(lineItems, periodField);
  const results = [];
  
  periodGroups.forEach((items, period) => {
    results.push({
      period: period,
      total_revenue: totalRevenue(items),
      total_quantity: sumField(items, 'quantity') || sumField(items, 'Units') || 0,
      order_count: new Set(items.map(item => item.order_id)).size,
      average_order_value: averageOrderValue(items)
    });
  });
  
  return results.sort((a, b) => new Date(a.period) - new Date(b.period));
};

/**
 * Margin calculations
 */
export const calculateMargins = (lineItems) => {
  return lineItems.map(item => {
    const revenue = toNumber(item.discounted_price || item.Net || 0);
    const cost = toNumber(item.unit_cost || item.cost || 0);
    
    return {
      ...item,
      gross_margin: grossMargin(revenue, cost),
      margin_percent: round(marginPercent(revenue, cost), 2)
    };
  });
};

export const totalMargin = (lineItems) => {
  const totalRev = totalRevenue(lineItems);
  const totalCost = sumField(lineItems, 'unit_cost') || sumField(lineItems, 'cost') || 0;
  
  return {
    total_revenue: totalRev,
    total_cost: totalCost,
    gross_margin: grossMargin(totalRev, totalCost),
    margin_percent: round(marginPercent(totalRev, totalCost), 2)
  };
};

/**
 * Unit economics
 */
export const averageUnitPrice = (lineItems) => {
  const totalRev = totalRevenue(lineItems);
  const totalQty = sumField(lineItems, 'quantity') || sumField(lineItems, 'Units') || 0;
  
  return totalQty > 0 ? round(unitPrice(totalRev, totalQty), 2) : 0;
};

export const revenuePerUnit = (lineItems, groupField) => {
  const groups = groupBy(lineItems, groupField);
  const results = [];
  
  groups.forEach((items, groupValue) => {
    const revenue = totalRevenue(items);
    const quantity = sumField(items, 'quantity') || sumField(items, 'Units') || 0;
    
    results.push({
      [groupField]: groupValue,
      total_revenue: revenue,
      total_quantity: quantity,
      revenue_per_unit: quantity > 0 ? round(revenue / quantity, 2) : 0
    });
  });
  
  return results.sort((a, b) => b.total_revenue - a.total_revenue);
};