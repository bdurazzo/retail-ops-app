// Order-specific business calculations
// Builds on math and operations for order analysis

import { groupBy, countField, sumField, filterByValue } from '../operations/aggregations.js';
import { toNumber, round } from '../math/basic.js';
import { totalRevenue } from './revenue.js';
import { totalQuantitySold } from './inventory.js';

/**
 * Order summary calculations
 */
export const orderSummary = (lineItems) => {
  const orderGroups = groupBy(lineItems, 'order_id');
  const results = [];
  
  orderGroups.forEach((items, orderId) => {
    const firstItem = items[0];
    
    results.push({
      order_id: orderId,
      customer_name: firstItem.customer_name || '',
      associate: firstItem.associate || '',
      date_time: firstItem.date_time || firstItem.date || '',
      channel: firstItem.channel || '',
      location: firstItem.demand_location || firstItem.location || '',
      item_count: items.length,
      total_quantity: totalQuantitySold(items),
      total_revenue: totalRevenue(items),
      unique_products: new Set(items.map(item => item.product_name)).size,
      status: firstItem.status || 'Unknown'
    });
  });
  
  return results.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
};

/**
 * Order metrics
 */
export const totalOrders = (lineItems) => {
  return new Set(lineItems.map(item => item.order_id)).size;
};

export const averageOrderSize = (lineItems) => {
  const orders = orderSummary(lineItems);
  const totalItems = orders.reduce((sum, order) => sum + order.item_count, 0);
  
  return orders.length > 0 ? round(totalItems / orders.length, 2) : 0;
};

export const averageOrderQuantity = (lineItems) => {
  const orders = orderSummary(lineItems);
  const totalQty = orders.reduce((sum, order) => sum + order.total_quantity, 0);
  
  return orders.length > 0 ? round(totalQty / orders.length, 2) : 0;
};

/**
 * Order value analysis
 */
export const ordersByValue = (lineItems) => {
  const orders = orderSummary(lineItems);
  
  // Define value tiers
  const tiers = [
    { name: '$0-$50', min: 0, max: 50 },
    { name: '$51-$100', min: 51, max: 100 },
    { name: '$101-$250', min: 101, max: 250 },
    { name: '$251-$500', min: 251, max: 500 },
    { name: '$500+', min: 501, max: Infinity }
  ];
  
  const results = tiers.map(tier => ({
    tier: tier.name,
    order_count: orders.filter(order => 
      order.total_revenue >= tier.min && order.total_revenue <= tier.max
    ).length,
    total_revenue: orders
      .filter(order => order.total_revenue >= tier.min && order.total_revenue <= tier.max)
      .reduce((sum, order) => sum + order.total_revenue, 0)
  }));
  
  return results;
};

/**
 * Channel and location analysis
 */
export const ordersByChannel = (lineItems) => {
  const orders = orderSummary(lineItems);
  const channelGroups = groupBy(orders, 'channel');
  const results = [];
  
  channelGroups.forEach((channelOrders, channel) => {
    results.push({
      channel: channel || 'Unknown',
      order_count: channelOrders.length,
      total_revenue: channelOrders.reduce((sum, order) => sum + order.total_revenue, 0),
      average_order_value: round(
        channelOrders.reduce((sum, order) => sum + order.total_revenue, 0) / channelOrders.length, 2
      )
    });
  });
  
  return results.sort((a, b) => b.order_count - a.order_count);
};

export const ordersByLocation = (lineItems) => {
  const orders = orderSummary(lineItems);
  const locationGroups = groupBy(orders, 'location');
  const results = [];
  
  locationGroups.forEach((locationOrders, location) => {
    results.push({
      location: location || 'Unknown',
      order_count: locationOrders.length,
      total_revenue: locationOrders.reduce((sum, order) => sum + order.total_revenue, 0),
      average_order_value: round(
        locationOrders.reduce((sum, order) => sum + order.total_revenue, 0) / locationOrders.length, 2
      )
    });
  });
  
  return results.sort((a, b) => b.order_count - a.order_count);
};

/**
 * Associate performance
 */
export const ordersByAssociate = (lineItems) => {
  const orders = orderSummary(lineItems);
  const associateGroups = groupBy(orders, 'associate');
  const results = [];
  
  associateGroups.forEach((associateOrders, associate) => {
    results.push({
      associate: associate || 'Unknown',
      order_count: associateOrders.length,
      total_revenue: associateOrders.reduce((sum, order) => sum + order.total_revenue, 0),
      average_order_value: round(
        associateOrders.reduce((sum, order) => sum + order.total_revenue, 0) / associateOrders.length, 2
      ),
      total_items: associateOrders.reduce((sum, order) => sum + order.item_count, 0)
    });
  });
  
  return results.sort((a, b) => b.total_revenue - a.total_revenue);
};

/**
 * Time-based order analysis
 */
export const ordersByTimeFrame = (lineItems, timeField = 'date_time') => {
  const orders = orderSummary(lineItems);
  
  // Extract date from datetime
  const ordersWithDate = orders.map(order => ({
    ...order,
    date: order[timeField] ? order[timeField].split('T')[0] : 'Unknown'
  }));
  
  const dateGroups = groupBy(ordersWithDate, 'date');
  const results = [];
  
  dateGroups.forEach((dateOrders, date) => {
    results.push({
      date: date,
      order_count: dateOrders.length,
      total_revenue: dateOrders.reduce((sum, order) => sum + order.total_revenue, 0),
      total_items: dateOrders.reduce((sum, order) => sum + order.item_count, 0),
      average_order_value: round(
        dateOrders.reduce((sum, order) => sum + order.total_revenue, 0) / dateOrders.length, 2
      )
    });
  });
  
  return results.sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Order status analysis
 */
export const ordersByStatus = (lineItems) => {
  const orders = orderSummary(lineItems);
  const statusGroups = groupBy(orders, 'status');
  const results = [];
  
  statusGroups.forEach((statusOrders, status) => {
    results.push({
      status: status || 'Unknown',
      order_count: statusOrders.length,
      total_revenue: statusOrders.reduce((sum, order) => sum + order.total_revenue, 0),
      percentage: round((statusOrders.length / orders.length) * 100, 2)
    });
  });
  
  return results.sort((a, b) => b.order_count - a.order_count);
};