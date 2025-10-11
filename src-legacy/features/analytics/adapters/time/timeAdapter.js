// src/features/analytics/adapters/timeAdapter.js
import dayjs from 'dayjs';

/**
 * Apply time-based filtering and transformations to data rows
 * Repository handles month-level loading, this handles precise filtering
 */
export function applyTime(rows, timeConfig) {
  console.log('🕐 timeAdapter called with:', { rowCount: rows?.length, timeConfig });

  if (!timeConfig || !rows?.length) {
    console.log('🕐 timeAdapter: No config or no rows, returning original data');
    return rows;
  }

  // Apply date range filtering
  const filtered = applyDateRange(rows, timeConfig);
  console.log('🕐 timeAdapter: Filtered from', rows.length, 'to', filtered.length, 'rows');

  return filtered;
}

function applyDateRange(rows, timeConfig) {
  const { startDate, endDate } = timeConfig;
  
  if (!startDate || !endDate) {
    return rows;
  }

  const filtered = rows.filter(row => {
    const orderDateTime = row.order_datetime_normalized;
    if (!orderDateTime) {
      return true; // Keep rows with missing dates
    }
    
    // Extract just the date part (YYYY-MM-DD) from the datetime string
    const orderDateStr = orderDateTime.slice(0, 10);
    
    // Simple string comparison - no dayjs parsing needed
    return orderDateStr >= startDate && orderDateStr <= endDate;
  });

  return filtered;
}