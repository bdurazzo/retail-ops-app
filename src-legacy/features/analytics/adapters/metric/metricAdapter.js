import * as KPIs from './kpis/index.js';
import { kpiService } from '../../services/KpiService.js';

export async function applyMetric(rows, metricConfig, queryContext = null) {
  if (!metricConfig || !rows?.length) return rows;
  
  const kpiResults = {};
  let requiresGrouping = false;
  let groupByField = null;
  
  // Calculate KPIs - handle advanced vs simple KPIs differently
  for (const kpiName of metricConfig) {
    if (kpiService.constructor.requiresAdvancedCalculation(kpiName) && queryContext) {
      // Advanced KPI - use KpiService with full query context
      if (kpiName === 'attachRate') {
        const dateRange = { 
          start: queryContext.time?.start, 
          end: queryContext.time?.end 
        };
        const products = extractProductNames(rows);
        kpiResults[kpiName] = await kpiService.getAttachRates(dateRange, products);
      }
      // Add other advanced KPIs here as needed
    } else if (KPIs[kpiName]) {
      // Simple KPI - use existing calculation on filtered rows
      kpiResults[kpiName] = KPIs[kpiName](rows);
      if (kpiResults[kpiName].requiresGrouping) {
        requiresGrouping = true;
        groupByField = kpiResults[kpiName].groupBy;
      }
    }
  }
  
  if (requiresGrouping && groupByField) {
    return createGroupedRows(rows, groupByField, kpiResults);
  } else {
    return rows.map(row => ({
      ...row,
      __kpis: kpiResults
    }));
  }
}

function createGroupedRows(rows, groupByField, kpiResults) {
  const grouped = {};
  
  rows.forEach(row => {
    let key;
    
    if (groupByField === 'ProductVariant') {
      // Custom grouping for product variants: "Product Name - Color - Size"
      const product = row["Product Name"] || '';
      const color = row["Color"] || '';
      const size = row["Size"] || '';
      key = [product, color, size].filter(Boolean).join(' - ');
    } else {
      // Standard single-field grouping
      key = row[groupByField];
    }
    
    if (!grouped[key]) {
      // Use first occurrence for base data
      grouped[key] = {
        ...row,
        __kpis: kpiResults,
        __groupCount: 0,
        __groupedRevenue: 0
      };
      
      // For ProductVariant grouping, update the Product Name to show the full variant
      if (groupByField === 'ProductVariant') {
        grouped[key]["Product Name"] = key;
      }
    }
    grouped[key].__groupCount++;
    grouped[key].__groupedRevenue += (row["Product Net"] || 0);
  });
  
  // Update the Product Net to show grouped total
  Object.values(grouped).forEach(row => {
    row["Product Net"] = row.__groupedRevenue;
  });
  
  return Object.values(grouped);
}

/**
 * Extract unique product names from rows
 * @param {Array} rows 
 * @returns {Array} Unique product names
 */
function extractProductNames(rows) {
  const productNames = new Set();
  rows.forEach(row => {
    const productName = row["Product Name"];
    if (productName) {
      productNames.add(productName);
    }
  });
  return Array.from(productNames);
}