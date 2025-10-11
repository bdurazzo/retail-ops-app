export const KPI_OPERATIONS = {
  sum: {
    fn: (values) => values.reduce((a, b) => a + b, 0),
    field: 'Product Net',
    requiresGrouping: false,
    aggregateOnly: false
  },
  
  count: {
    fn: (values) => values.length,
    field: null, // operates on row count
    requiresGrouping: true,
    groupBy: 'Product Name',
    aggregateOnly: false
  },
  
  average: {
    fn: (values) => values.reduce((a, b) => a + b, 0) / values.length,
    field: 'Product Net',
    requiresGrouping: false,
    aggregateOnly: true
  },
  
  median: {
    fn: (values) => {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 
        ? (sorted[mid - 1] + sorted[mid]) / 2 
        : sorted[mid];
    },
    field: 'Product Net',
    requiresGrouping: false,
    aggregateOnly: true
  }
};

// Helper function to extract field values from rows
export function extractFieldValues(rows, field) {
  if (!field) return rows; // For count operations
  return rows.map(row => row[field]).filter(val => val != null);
}