import { KPI_OPERATIONS, extractFieldValues } from '../utils/kpiUtils.js';

export function quantitySold(rows) {
  const operation = KPI_OPERATIONS.count;
  
  return {
    requiresGrouping: operation.requiresGrouping,
    groupBy: operation.groupBy,
    aggregateOnly: operation.aggregateOnly,
    total: operation.fn(rows),
    byProduct: groupByProduct(rows),
    byDate: groupByDate(rows)
  };
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