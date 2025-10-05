// Performance KPIs
// High-level metrics combining business calculations

import { totalRevenue, averageOrderValue, revenueByProduct, totalMargin } from '../business/revenue.js';
import { totalQuantitySold, productPerformance, averageItemsPerOrder } from '../business/inventory.js';
import { totalOrders, ordersByValue, ordersByAssociate } from '../business/orders.js';
import { round, percentage, percentageChange } from '../math/basic.js';
import { mean } from '../math/statistical.js';

/**
 * Overall performance dashboard
 */
export const performanceDashboard = (lineItems, comparisonLineItems = null) => {
  const current = {
    total_revenue: totalRevenue(lineItems),
    total_orders: totalOrders(lineItems),
    total_quantity: totalQuantitySold(lineItems),
    average_order_value: averageOrderValue(lineItems),
    average_items_per_order: averageItemsPerOrder(lineItems),
    unique_products: new Set(lineItems.map(item => item.product_name)).size,
    margin_data: totalMargin(lineItems)
  };
  
  const dashboard = {
    revenue: {
      total: current.total_revenue,
      average_order_value: current.average_order_value,
      margin_percent: current.margin_data.margin_percent
    },
    orders: {
      total_orders: current.total_orders,
      average_items_per_order: current.average_items_per_order,
      conversion_metrics: current.total_orders > 0 ? {
        items_per_order: round(lineItems.length / current.total_orders, 2),
        units_per_order: round(current.total_quantity / current.total_orders, 2)
      } : { items_per_order: 0, units_per_order: 0 }
    },
    inventory: {
      total_quantity: current.total_quantity,
      unique_products: current.unique_products,
      average_qty_per_product: round(current.total_quantity / current.unique_products, 2)
    }
  };
  
  // Add comparison if provided
  if (comparisonLineItems) {
    const comparison = {
      total_revenue: totalRevenue(comparisonLineItems),
      total_orders: totalOrders(comparisonLineItems),
      total_quantity: totalQuantitySold(comparisonLineItems),
      average_order_value: averageOrderValue(comparisonLineItems)
    };
    
    dashboard.growth = {
      revenue_change: percentageChange(comparison.total_revenue, current.total_revenue),
      orders_change: percentageChange(comparison.total_orders, current.total_orders),
      aov_change: percentageChange(comparison.average_order_value, current.average_order_value),
      quantity_change: percentageChange(comparison.total_quantity, current.total_quantity)
    };
  }
  
  return dashboard;
};

/**
 * Top performers
 */
export const topPerformers = (lineItems, limit = 10) => {
  const productRev = revenueByProduct(lineItems);
  const productPerf = productPerformance(lineItems);
  const associatePerf = ordersByAssociate(lineItems);
  
  return {
    top_products_by_revenue: productRev.slice(0, limit),
    top_products_by_quantity: productPerf.slice(0, limit),
    top_associates: associatePerf.slice(0, limit)
  };
};

/**
 * Efficiency metrics
 */
export const efficiencyMetrics = (lineItems) => {
  const totalRev = totalRevenue(lineItems);
  const totalOrds = totalOrders(lineItems);
  const totalQty = totalQuantitySold(lineItems);
  const uniqueProducts = new Set(lineItems.map(item => item.product_name)).size;
  
  return {
    revenue_per_order: totalOrds > 0 ? round(totalRev / totalOrds, 2) : 0,
    revenue_per_unit: totalQty > 0 ? round(totalRev / totalQty, 2) : 0,
    revenue_per_product: uniqueProducts > 0 ? round(totalRev / uniqueProducts, 2) : 0,
    units_per_order: totalOrds > 0 ? round(totalQty / totalOrds, 2) : 0,
    products_per_order: totalOrds > 0 ? round(uniqueProducts / totalOrds, 2) : 0,
    order_efficiency_score: round((totalRev / Math.max(totalOrds, 1)) * (totalQty / Math.max(totalOrds, 1)) / 100, 2)
  };
};

/**
 * Customer behavior insights
 */
export const customerBehaviorMetrics = (lineItems) => {
  const orderValues = ordersByValue(lineItems);
  const totalOrds = totalOrders(lineItems);
  
  // Calculate distribution percentages
  const valueDistribution = orderValues.map(tier => ({
    ...tier,
    percentage: totalOrds > 0 ? round((tier.order_count / totalOrds) * 100, 2) : 0
  }));
  
  // Customer value segments
  const highValueOrders = orderValues.find(tier => tier.tier === '$500+')?.order_count || 0;
  const mediumValueOrders = (orderValues.find(tier => tier.tier === '$251-$500')?.order_count || 0) +
                            (orderValues.find(tier => tier.tier === '$101-$250')?.order_count || 0);
  const lowValueOrders = (orderValues.find(tier => tier.tier === '$51-$100')?.order_count || 0) +
                         (orderValues.find(tier => tier.tier === '$0-$50')?.order_count || 0);
  
  return {
    value_distribution: valueDistribution,
    customer_segments: {
      high_value: { count: highValueOrders, percentage: round((highValueOrders / totalOrds) * 100, 2) },
      medium_value: { count: mediumValueOrders, percentage: round((mediumValueOrders / totalOrds) * 100, 2) },
      low_value: { count: lowValueOrders, percentage: round((lowValueOrders / totalOrds) * 100, 2) }
    }
  };
};

/**
 * Product mix analysis
 */
export const productMixMetrics = (lineItems) => {
  const products = revenueByProduct(lineItems);
  const totalRev = totalRevenue(lineItems);
  const totalQty = totalQuantitySold(lineItems);
  
  // Calculate concentration metrics
  const top5Revenue = products.slice(0, 5).reduce((sum, p) => sum + p.total_revenue, 0);
  const top10Revenue = products.slice(0, 10).reduce((sum, p) => sum + p.total_revenue, 0);
  
  return {
    total_products: products.length,
    top_5_concentration: round(percentage(top5Revenue, totalRev), 2),
    top_10_concentration: round(percentage(top10Revenue, totalRev), 2),
    revenue_distribution: {
      top_20_percent: products.slice(0, Math.ceil(products.length * 0.2))
        .reduce((sum, p) => sum + p.total_revenue, 0),
      bottom_80_percent: products.slice(Math.ceil(products.length * 0.2))
        .reduce((sum, p) => sum + p.total_revenue, 0)
    },
    average_product_performance: {
      average_revenue_per_product: round(totalRev / products.length, 2),
      average_quantity_per_product: round(totalQty / products.length, 2)
    }
  };
};

/**
 * Growth and trend indicators
 */
export const calculateGrowthMetrics = (currentPeriod, previousPeriod) => {
  const current = performanceDashboard(currentPeriod);
  const previous = performanceDashboard(previousPeriod);
  
  return {
    revenue_growth: percentageChange(previous.revenue.total, current.revenue.total),
    order_growth: percentageChange(previous.orders.total_orders, current.orders.total_orders),
    aov_growth: percentageChange(previous.revenue.average_order_value, current.revenue.average_order_value),
    quantity_growth: percentageChange(previous.inventory.total_quantity, current.inventory.total_quantity),
    product_growth: percentageChange(previous.inventory.unique_products, current.inventory.unique_products),
    
    // Compound metrics
    efficiency_change: {
      revenue_per_order: percentageChange(
        previous.revenue.total / previous.orders.total_orders,
        current.revenue.total / current.orders.total_orders
      ),
      items_per_order: percentageChange(
        previous.orders.conversion_metrics.items_per_order,
        current.orders.conversion_metrics.items_per_order
      )
    }
  };
};