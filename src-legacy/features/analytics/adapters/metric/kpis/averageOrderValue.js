import { KPI_OPERATIONS, extractFieldValues } from '../utils/kpiUtils.js';

export function averageOrderValue(rows) {
  const operation = KPI_OPERATIONS.average;
  const values = extractFieldValues(rows, operation.field);
  
  return {
    requiresGrouping: operation.requiresGrouping,
    aggregateOnly: operation.aggregateOnly,
    total: operation.fn(values),
    byProduct: null, // AOV doesn't make sense per product
    byDate: groupByDateAOV(rows)
  };
}

function groupByDateAOV(rows) {
  const grouped = {};
  rows.forEach(row => {
    const date = row.order_datetime_normalized?.slice(0, 10);
    const revenue = row["Product Net"] || 0;
    if (date) {
      if (!grouped[date]) {
        grouped[date] = { total: 0, count: 0 };
      }
      grouped[date].total += revenue;
      grouped[date].count += 1;
    }
  });
  
  // Convert to averages
  Object.keys(grouped).forEach(date => {
    grouped[date] = grouped[date].total / grouped[date].count;
  });
  
  return grouped;
}