// AttachRateService: Specialized service for attach rate calculations
import { OrdersRepository } from '../repositories/OrdersRepository.js';

export class AttachRateService {
  constructor() {
    this.monthlyCache = new Map(); // Cache monthly calculations
  }

  /**
   * Get attach rates for a date range by aggregating monthly data
   * @param {string} startDate - 'YYYY-MM-DD'
   * @param {string} endDate - 'YYYY-MM-DD' 
   * @param {Array} products - Product names to filter (null for all)
   * @returns {Object} Aggregated attach rate data
   */
  async getAttachRatesForRange(startDate, endDate, products = null) {
    const months = this.getMonthsInRange(startDate, endDate);
    const aggregated = {};

    // Get monthly data for each month in range
    for (const { yyyy, mm } of months) {
      const monthKey = `${yyyy}-${mm}`;
      
      // Get cached or calculate monthly attach rates
      if (!this.monthlyCache.has(monthKey)) {
        const monthlyData = await this.calculateMonthlyAttachRates(yyyy, mm);
        this.monthlyCache.set(monthKey, monthlyData);
      }
      
      const monthlyRates = this.monthlyCache.get(monthKey);
      this.aggregateMonthlyData(aggregated, monthlyRates, products);
    }

    // Convert aggregated counts to percentages
    return this.convertToPercentages(aggregated);
  }

  /**
   * Calculate attach rates for a single month
   * @param {string} yyyy - Year
   * @param {string} mm - Month (zero-padded)
   * @returns {Object} Monthly attach rate counts
   */
  async calculateMonthlyAttachRates(yyyy, mm) {
    console.log(`📊 Calculating attach rates for ${yyyy}-${mm}`);
    
    // Get raw line items for the month
    const { rows } = await OrdersRepository.findByMonthRange({ 
      start: `${yyyy}-${mm}-01`, 
      end: `${yyyy}-${mm}-31` 
    });

    if (!rows || rows.length === 0) {
      return {};
    }

    // Group by product variants and calculate attach rates
    return this.calculateAttachRatesFromLineItems(rows);
  }

  /**
   * Calculate attach rates from raw line items
   * @param {Array} lineItems - Raw line item data
   * @returns {Object} Attach rate counts by variant
   */
  calculateAttachRatesFromLineItems(lineItems) {
    const variantStats = {};

    // Group line items by variant (product + color + size)
    lineItems.forEach(item => {
      const productName = item["Product Name"];
      const color = item["Color"] || 'Default';
      const size = item["Size"] || 'One Size';
      const orderId = item["Order Number"];
      const lineNumber = parseInt(item["Line Number"]) || 1;

      if (!productName || !orderId) return;

      // Create variant key
      const variantKey = `${productName} - ${color} - ${size}`;
      
      if (!variantStats[variantKey]) {
        variantStats[variantKey] = {
          productName,
          color,
          size,
          orderIds: new Set(),
          attachOrderIds: new Set() // Orders where line_number > 1
        };
      }

      const variant = variantStats[variantKey];
      variant.orderIds.add(orderId);
      
      // If line_number > 1, this is an attach (not the primary item)
      if (lineNumber > 1) {
        variant.attachOrderIds.add(orderId);
      }
    });

    // Convert Sets to counts
    const results = {};
    Object.keys(variantStats).forEach(variantKey => {
      const variant = variantStats[variantKey];
      results[variantKey] = {
        productName: variant.productName,
        color: variant.color,
        size: variant.size,
        totalOrders: variant.orderIds.size,
        attachOrders: variant.attachOrderIds.size
      };
    });

    console.log(`📊 Calculated attach rates for ${Object.keys(results).length} variants`);
    return results;
  }

  /**
   * Aggregate monthly data into running totals
   * @param {Object} aggregated - Running aggregation
   * @param {Object} monthlyData - Single month's data
   * @param {Array} productFilter - Products to include (null for all)
   */
  aggregateMonthlyData(aggregated, monthlyData, productFilter = null) {
    Object.keys(monthlyData).forEach(variantKey => {
      const monthlyVariant = monthlyData[variantKey];
      
      // Apply product filter if specified
      if (productFilter && !productFilter.includes(monthlyVariant.productName)) {
        return;
      }

      if (!aggregated[variantKey]) {
        aggregated[variantKey] = {
          productName: monthlyVariant.productName,
          color: monthlyVariant.color,
          size: monthlyVariant.size,
          totalOrders: 0,
          attachOrders: 0
        };
      }

      aggregated[variantKey].totalOrders += monthlyVariant.totalOrders;
      aggregated[variantKey].attachOrders += monthlyVariant.attachOrders;
    });
  }

  /**
   * Convert aggregated counts to percentages
   * @param {Object} aggregated - Aggregated count data
   * @returns {Object} Attach rate percentages
   */
  convertToPercentages(aggregated) {
    const results = {
      byVariant: {},
      byProduct: {},
      byColor: {},
      bySize: {},
      overall: { totalOrders: 0, attachOrders: 0, rate: 0 }
    };

    let overallTotalOrders = 0;
    let overallAttachOrders = 0;

    // Calculate variant-level rates
    Object.keys(aggregated).forEach(variantKey => {
      const variant = aggregated[variantKey];
      const rate = variant.totalOrders > 0 ? (variant.attachOrders / variant.totalOrders) * 100 : 0;
      
      results.byVariant[variantKey] = {
        ...variant,
        rate: parseFloat(rate.toFixed(1))
      };

      overallTotalOrders += variant.totalOrders;
      overallAttachOrders += variant.attachOrders;

      // Aggregate by product (all variants)
      if (!results.byProduct[variant.productName]) {
        results.byProduct[variant.productName] = { totalOrders: 0, attachOrders: 0 };
      }
      results.byProduct[variant.productName].totalOrders += variant.totalOrders;
      results.byProduct[variant.productName].attachOrders += variant.attachOrders;

      // Aggregate by color across products
      if (!results.byColor[variant.color]) {
        results.byColor[variant.color] = { totalOrders: 0, attachOrders: 0 };
      }
      results.byColor[variant.color].totalOrders += variant.totalOrders;
      results.byColor[variant.color].attachOrders += variant.attachOrders;

      // Aggregate by size across products
      if (!results.bySize[variant.size]) {
        results.bySize[variant.size] = { totalOrders: 0, attachOrders: 0 };
      }
      results.bySize[variant.size].totalOrders += variant.totalOrders;
      results.bySize[variant.size].attachOrders += variant.attachOrders;
    });

    // Calculate aggregated rates
    Object.keys(results.byProduct).forEach(productName => {
      const product = results.byProduct[productName];
      product.rate = product.totalOrders > 0 ? (product.attachOrders / product.totalOrders) * 100 : 0;
    });

    Object.keys(results.byColor).forEach(color => {
      const colorData = results.byColor[color];
      colorData.rate = colorData.totalOrders > 0 ? (colorData.attachOrders / colorData.totalOrders) * 100 : 0;
    });

    Object.keys(results.bySize).forEach(size => {
      const sizeData = results.bySize[size];
      sizeData.rate = sizeData.totalOrders > 0 ? (sizeData.attachOrders / sizeData.totalOrders) * 100 : 0;
    });

    // Overall rate
    results.overall = {
      totalOrders: overallTotalOrders,
      attachOrders: overallAttachOrders,
      rate: overallTotalOrders > 0 ? (overallAttachOrders / overallTotalOrders) * 100 : 0
    };

    return results;
  }

  /**
   * Get array of months between start and end dates
   * @param {string} startDate 
   * @param {string} endDate 
   * @returns {Array} Array of {yyyy, mm} objects
   */
  getMonthsInRange(startDate, endDate) {
    const months = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
      months.push({
        yyyy: current.getFullYear().toString(),
        mm: (current.getMonth() + 1).toString().padStart(2, '0')
      });
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  /**
   * Clear cache (useful for testing or data updates)
   */
  clearCache() {
    this.monthlyCache.clear();
  }
}