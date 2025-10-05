// Efficiency KPIs
// Operational efficiency and productivity metrics

import { totalRevenue, averageOrderValue } from '../business/revenue.js';
import { totalQuantitySold, averageItemsPerOrder } from '../business/inventory.js';
import { totalOrders, ordersByAssociate, ordersByTimeFrame } from '../business/orders.js';
import { round, divide } from '../math/basic.js';
import { mean, variance } from '../math/statistical.js';

/**
 * Sales efficiency metrics
 */
export const salesEfficiency = (lineItems) => {
  const totalRev = totalRevenue(lineItems);
  const totalOrds = totalOrders(lineItems);
  const totalQty = totalQuantitySold(lineItems);
  const lineItemCount = lineItems.length;
  
  return {
    revenue_per_transaction: divide(totalRev, lineItemCount),
    revenue_per_order: divide(totalRev, totalOrds),
    revenue_per_unit: divide(totalRev, totalQty),
    units_per_transaction: divide(totalQty, lineItemCount),
    transactions_per_order: divide(lineItemCount, totalOrds),
    efficiency_ratio: round(divide(totalRev, lineItemCount) * divide(totalQty, lineItemCount), 2)
  };
};

/**
 * Associate productivity
 */
export const associateProductivity = (lineItems) => {
  const associates = ordersByAssociate(lineItems);
  const totalRev = totalRevenue(lineItems);
  const totalOrds = totalOrders(lineItems);
  
  const productivity = associates.map(associate => ({
    ...associate,
    revenue_share: round(divide(associate.total_revenue, totalRev) * 100, 2),
    order_share: round(divide(associate.order_count, totalOrds) * 100, 2),
    efficiency_score: round(
      (associate.average_order_value / 100) * (associate.order_count / Math.max(totalOrds, 1)), 2
    )
  }));
  
  // Calculate team metrics
  const avgRevenue = mean(associates.map(a => a.total_revenue));
  const avgOrders = mean(associates.map(a => a.order_count));
  const revenueVariance = variance(associates.map(a => a.total_revenue));
  
  return {
    individual_performance: productivity,
    team_metrics: {
      total_associates: associates.length,
      average_revenue_per_associate: round(avgRevenue, 2),
      average_orders_per_associate: round(avgOrders, 2),
      revenue_variance: round(revenueVariance, 2),
      performance_consistency: round(100 - (Math.sqrt(revenueVariance) / avgRevenue * 100), 2)
    }
  };
};

/**
 * Time-based efficiency
 */
export const timeEfficiency = (lineItems) => {
  const dailyData = ordersByTimeFrame(lineItems, 'date_time');
  
  if (dailyData.length === 0) {
    return {
      daily_averages: { revenue: 0, orders: 0, items: 0 },
      peak_performance: { date: '', revenue: 0, orders: 0 },
      consistency_metrics: { revenue_variance: 0, order_variance: 0 }
    };
  }
  
  const avgDailyRevenue = mean(dailyData.map(d => d.total_revenue));
  const avgDailyOrders = mean(dailyData.map(d => d.order_count));
  const avgDailyItems = mean(dailyData.map(d => d.total_items));
  
  const bestDay = dailyData.reduce((best, day) => 
    day.total_revenue > best.total_revenue ? day : best
  );
  
  return {
    daily_averages: {
      revenue: round(avgDailyRevenue, 2),
      orders: round(avgDailyOrders, 2),
      items: round(avgDailyItems, 2)
    },
    peak_performance: {
      date: bestDay.date,
      revenue: bestDay.total_revenue,
      orders: bestDay.order_count
    },
    consistency_metrics: {
      revenue_variance: round(variance(dailyData.map(d => d.total_revenue)), 2),
      order_variance: round(variance(dailyData.map(d => d.order_count)), 2),
      efficiency_trend: calculateEfficiencyTrend(dailyData)
    }
  };
};

/**
 * Product efficiency metrics
 */
export const productEfficiency = (lineItems) => {
  const uniqueProducts = new Set(lineItems.map(item => item.product_name));
  const totalRev = totalRevenue(lineItems);
  const totalQty = totalQuantitySold(lineItems);
  const totalOrds = totalOrders(lineItems);
  
  return {
    catalog_efficiency: {
      products_sold: uniqueProducts.size,
      revenue_per_product: round(divide(totalRev, uniqueProducts.size), 2),
      quantity_per_product: round(divide(totalQty, uniqueProducts.size), 2),
      transactions_per_product: round(divide(lineItems.length, uniqueProducts.size), 2)
    },
    product_velocity: {
      average_items_per_order: round(divide(lineItems.length, totalOrds), 2),
      average_products_per_order: round(divide(uniqueProducts.size, totalOrds), 2),
      product_penetration: round((uniqueProducts.size / lineItems.length) * 100, 2)
    }
  };
};

/**
 * Cross-sell and upsell efficiency
 */
export const crossSellEfficiency = (lineItems) => {
  const orders = {};
  
  // Group line items by order
  lineItems.forEach(item => {
    if (!orders[item.order_id]) {
      orders[item.order_id] = [];
    }
    orders[item.order_id].push(item);
  });
  
  const orderData = Object.values(orders);
  const multiItemOrders = orderData.filter(order => order.length > 1);
  
  const avgItemsPerOrder = mean(orderData.map(order => order.length));
  const avgRevenuePerOrder = mean(orderData.map(order => 
    order.reduce((sum, item) => sum + (parseFloat(item.discounted_price) || 0), 0)
  ));
  
  return {
    cross_sell_rate: round((multiItemOrders.length / orderData.length) * 100, 2),
    average_items_per_order: round(avgItemsPerOrder, 2),
    multi_item_orders: multiItemOrders.length,
    single_item_orders: orderData.length - multiItemOrders.length,
    cross_sell_revenue_lift: round(
      mean(multiItemOrders.map(order => 
        order.reduce((sum, item) => sum + (parseFloat(item.discounted_price) || 0), 0)
      )) - 
      mean(orderData.filter(order => order.length === 1).map(order => 
        parseFloat(order[0].discounted_price) || 0
      )), 2
    )
  };
};

/**
 * Helper function to calculate efficiency trend
 */
function calculateEfficiencyTrend(dailyData) {
  if (dailyData.length < 2) return 0;
  
  const sorted = dailyData.sort((a, b) => new Date(a.date) - new Date(b.date));
  const recentHalf = sorted.slice(Math.ceil(sorted.length / 2));
  const earlierHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  
  const recentAvg = mean(recentHalf.map(d => d.average_order_value));
  const earlierAvg = mean(earlierHalf.map(d => d.average_order_value));
  
  return round(((recentAvg - earlierAvg) / earlierAvg) * 100, 2);
}

/**
 * Overall efficiency score
 */
export const overallEfficiencyScore = (lineItems) => {
  const sales = salesEfficiency(lineItems);
  const associates = associateProductivity(lineItems);
  const products = productEfficiency(lineItems);
  const crossSell = crossSellEfficiency(lineItems);
  
  // Weighted efficiency score (0-100)
  const revenueEfficiency = Math.min(sales.revenue_per_order / 100, 1) * 25;
  const teamEfficiency = (associates.team_metrics.performance_consistency / 100) * 25;
  const productEfficiency = Math.min(products.catalog_efficiency.revenue_per_product / 500, 1) * 25;
  const crossSellEfficiency = (crossSell.cross_sell_rate / 100) * 25;
  
  return {
    overall_score: round(revenueEfficiency + teamEfficiency + productEfficiency + crossSellEfficiency, 2),
    component_scores: {
      revenue_efficiency: round(revenueEfficiency, 2),
      team_efficiency: round(teamEfficiency, 2),
      product_efficiency: round(productEfficiency, 2),
      cross_sell_efficiency: round(crossSellEfficiency, 2)
    }
  };
};