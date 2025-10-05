// Main calculations export
// Central access point for all calculation functions

// Math layer - Pure mathematical functions
export * from './math/basic.js';
export * from './math/statistical.js';
export * from './math/financial.js';

// Operations layer - Data manipulation and aggregation
export * from './operations/aggregations.js';

// Business layer - Domain-specific calculations
export * from './business/revenue.js';
export * from './business/inventory.js';
export * from './business/orders.js';

// KPI layer - High-level performance metrics
export * from './kpis/performance.js';
export * from './kpis/efficiency.js';

// Convenience function to get all available calculation categories
export const getCalculationCategories = () => ({
  math: {
    basic: 'Basic arithmetic and percentage calculations',
    statistical: 'Statistical functions like mean, median, variance',
    financial: 'Financial calculations including margins and discounts'
  },
  operations: {
    aggregations: 'Data grouping, filtering, and aggregation functions'
  },
  business: {
    revenue: 'Revenue analysis and calculations',
    inventory: 'Inventory and product performance metrics',
    orders: 'Order analysis and customer behavior'
  },
  kpis: {
    performance: 'High-level performance dashboards and metrics',
    efficiency: 'Operational efficiency and productivity metrics'
  }
});

// Quick access to commonly used calculation sets
export const commonCalculations = {
  // Basic retail metrics
  getBasicMetrics: (lineItems) => ({
    totalRevenue: require('./business/revenue.js').totalRevenue(lineItems),
    totalOrders: require('./business/orders.js').totalOrders(lineItems),
    totalQuantity: require('./business/inventory.js').totalQuantitySold(lineItems),
    averageOrderValue: require('./business/revenue.js').averageOrderValue(lineItems)
  }),
  
  // Performance dashboard
  getPerformanceDashboard: (lineItems, comparison = null) => 
    require('./kpis/performance.js').performanceDashboard(lineItems, comparison),
  
  // Efficiency metrics
  getEfficiencyMetrics: (lineItems) => 
    require('./kpis/efficiency.js').overallEfficiencyScore(lineItems)
};