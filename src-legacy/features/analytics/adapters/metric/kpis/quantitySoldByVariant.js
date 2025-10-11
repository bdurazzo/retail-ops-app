import { KPI_OPERATIONS, extractFieldValues } from '../utils/kpiUtils.js';

export function quantitySoldByVariant(rows) {
  return {
    requiresGrouping: true,
    groupBy: 'ProductVariant', // Custom grouping key
    aggregateOnly: false,
    total: rows.length,
    byVariant: groupByVariant(rows),
    byProduct: groupByProduct(rows),
    byDate: groupByDate(rows)
  };
}

function groupByVariant(rows) {
  const grouped = {};
  rows.forEach(row => {
    const product = row["Product Name"] || '';
    const color = row["Color"] || '';
    const size = row["Size"] || '';
    // Create compound key: "Product Name - Color - Size"
    const variantKey = [product, color, size].filter(Boolean).join(' - ');
    if (variantKey) {
      grouped[variantKey] = (grouped[variantKey] || 0) + 1;
    }
  });
  return grouped;
}

function groupByProduct(rows) {
  const grouped = {};
  rows.forEach(row => {
    const product = row["Product Name"];
    if (product) {
      grouped[product] = (grouped[product] || 0) + 1;
    }
  });
  return grouped;
}

function groupByDate(rows) {
  const grouped = {};
  rows.forEach(row => {
    const date = row.order_datetime_normalized?.slice(0, 10);
    if (date) {
      grouped[date] = (grouped[date] || 0) + 1;
    }
  });
  return grouped;
}