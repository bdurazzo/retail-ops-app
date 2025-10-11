// KpiService: Advanced metric calculations with caching strategy
import { AttachRateService } from './AttachRateService.js';

export class KpiService {
  constructor() {
    this.attachRateService = new AttachRateService();
  }

  /**
   * Get attach rates for products across a date range
   * @param {Object} dateRange - { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
   * @param {Array} products - Array of product names to calculate for
   * @returns {Object} Attach rates by product and variant
   */
  async getAttachRates(dateRange, products = null) {
    return await this.attachRateService.getAttachRatesForRange(
      dateRange.start, 
      dateRange.end, 
      products
    );
  }

  /**
   * Get average order value for date range and products
   * @param {Object} dateRange 
   * @param {Array} products 
   * @returns {Object} AOV data
   */
  async getAverageOrderValue(dateRange, products = null) {
    // TODO: Implement AOV calculation
    throw new Error('AOV calculation not yet implemented');
  }

  /**
   * Get top selling products for date range
   * @param {Object} dateRange 
   * @param {number} limit 
   * @returns {Array} Top products by sales
   */
  async getTopSellingProducts(dateRange, limit = 10) {
    // TODO: Implement top sellers calculation
    throw new Error('Top sellers calculation not yet implemented');
  }

  /**
   * Check if a KPI requires advanced calculation (vs simple aggregation)
   * @param {string} kpiName 
   * @returns {boolean}
   */
  static requiresAdvancedCalculation(kpiName) {
    const advancedKpis = ['attachRate', 'averageOrderValue', 'customerLifetimeValue'];
    return advancedKpis.includes(kpiName);
  }
}

// Export singleton instance
export const kpiService = new KpiService();