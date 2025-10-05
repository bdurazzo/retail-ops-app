// Order grouping configuration and strategies  
// Date range grouping for OrderGroup.jsx

// Date range grouping strategy definitions
export const DATE_RANGE_STRATEGIES = {
  daily: {
    id: 'daily',
    name: 'Daily Groups',
    description: 'Group orders by individual days',
    groupBy: 'day',
    labelFormat: 'MMM DD, YYYY',
    sortDirection: 'desc' // Most recent first
  },
  
  weekly: {
    id: 'weekly', 
    name: 'Weekly Groups',
    description: 'Group orders by calendar weeks',
    groupBy: 'week',
    labelFormat: 'Week of MMM DD',
    sortDirection: 'desc'
  },
  
  monthly: {
    id: 'monthly',
    name: 'Monthly Groups', 
    description: 'Group orders by calendar months',
    groupBy: 'month',
    labelFormat: 'MMMM YYYY',
    sortDirection: 'desc'
  },
  
  quarterly: {
    id: 'quarterly',
    name: 'Quarterly Groups',
    description: 'Group orders by calendar quarters', 
    groupBy: 'quarter',
    labelFormat: 'Q# YYYY',
    sortDirection: 'desc'
  }
};

/**
 * Auto-detect the best date grouping strategy for given order data
 */
export function detectBestDateGrouping(rows) {
  if (!rows?.length) return 'weekly';
  
  // Extract date field from orders - use actual CSV field name 'date_time'
  const dates = rows
    .map(r => r.date_time)
    .filter(Boolean)
    .map(dateStr => new Date(dateStr))
    .filter(date => !isNaN(date.getTime()));
  
  if (!dates.length) return 'weekly'; // Default fallback
  
  // Calculate date range span
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const daySpan = (maxDate - minDate) / (1000 * 60 * 60 * 24);
  
  // Choose grouping strategy based on data span
  if (daySpan <= 7) {
    return 'daily';    // 1 week or less -> daily groups
  } else if (daySpan <= 60) {
    return 'weekly';   // 2 months or less -> weekly groups  
  } else if (daySpan <= 365) {
    return 'monthly';  // 1 year or less -> monthly groups
  } else {
    return 'quarterly'; // More than 1 year -> quarterly groups
  }
}

/**
 * Create date range configuration with custom options
 */
export function createDateRangeConfig(strategyId, customOptions = {}) {
  const baseStrategy = DATE_RANGE_STRATEGIES[strategyId] || DATE_RANGE_STRATEGIES.weekly;
  
  return {
    ...baseStrategy,
    ...customOptions
  };
}

/**
 * Generate order configuration from table data
 * Groups orders by date ranges and calculates metrics
 */
export function generateOrderConfig(table, groupingConfig) {
  const { rows = [] } = table;
  
  if (!rows.length) {
    return { dateRanges: [] };
  }

  console.log('🔍 generateOrderConfig: Processing', rows.length, 'rows with strategy:', groupingConfig.id);

  // Group orders by date ranges
  const dateRangeGroups = groupOrdersByDateRange(rows, groupingConfig);
  
  // Transform groups into date range objects with metrics
  const dateRanges = dateRangeGroups.map(group => ({
    key: group.key,
    label: group.label,
    startDate: group.startDate,
    endDate: group.endDate,
    orders: group.orders.map(order => ({
      id: order.order_id || 'Unknown',
      date: formatOrderDate(order.date_time),
      itemCount: calculateItemCount(order),
      totalValue: calculateOrderValue(order),
      customer: order.customer_name || 'Unknown',
      status: order.status || 'Unknown',
      lineItems: extractLineItems(order),
      lineItemTotals: calculateLineItemTotals(extractLineItems(order))
    })),
    metrics: calculateDateRangeMetrics(group.orders)
  }));

  console.log('🔍 generateOrderConfig: Generated', dateRanges.length, 'date ranges');

  return { dateRanges };
}

/**
 * Group order rows by date ranges based on strategy
 */
function groupOrdersByDateRange(rows, groupingConfig) {
  const { groupBy, labelFormat, sortDirection } = groupingConfig;
  const groups = new Map();
  
  rows.forEach(row => {
    // Extract date from row - use actual CSV field name 'date_time'
    const dateStr = row.date_time;
    if (!dateStr) {
      console.warn('orderConfig: Row missing date_time field:', row);
      return; // Skip rows without dates
    }
    
    const orderDate = new Date(dateStr);
    if (isNaN(orderDate.getTime())) return; // Skip invalid dates
    
    // Generate grouping key based on strategy
    const groupKey = generateDateGroupKey(orderDate, groupBy);
    const groupLabel = generateDateGroupLabel(orderDate, groupBy, labelFormat);
    
    if (!groups.has(groupKey)) {
      const { startDate, endDate } = getDateRangeBounds(orderDate, groupBy);
      
      groups.set(groupKey, {
        key: groupKey,
        label: groupLabel,
        startDate,
        endDate,
        orders: []
      });
    }
    
    groups.get(groupKey).orders.push(row);
  });

  // Convert to array and sort by date
  const sortedGroups = Array.from(groups.values()).sort((a, b) => {
    const dateA = a.startDate;
    const dateB = b.startDate;
    return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
  });

  console.log('🔍 groupOrdersByDateRange: Created', sortedGroups.length, 'groups');
  
  return sortedGroups;
}

/**
 * Generate grouping key for date based on strategy
 */
function generateDateGroupKey(date, groupBy) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  switch (groupBy) {
    case 'day':
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    case 'week':
      const weekStart = getWeekStart(date);
      return `${weekStart.getFullYear()}-W${getWeekNumber(weekStart)}`;
    case 'month':
      return `${year}-${String(month + 1).padStart(2, '0')}`;
    case 'quarter':
      const quarter = Math.floor(month / 3) + 1;
      return `${year}-Q${quarter}`;
    default:
      return `${year}-${String(month + 1).padStart(2, '0')}`;
  }
}

/**
 * Generate human-readable label for date group
 */
function generateDateGroupLabel(date, groupBy, labelFormat) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  switch (groupBy) {
    case 'day':
      return `${months[month]} ${day}, ${year}`;
    case 'week':
      const weekStart = getWeekStart(date);
      return `Week of ${months[weekStart.getMonth()]} ${weekStart.getDate()}`;
    case 'month':
      return `${months[month]} ${year}`;
    case 'quarter':
      const quarter = Math.floor(month / 3) + 1;
      return `Q${quarter} ${year}`;
    default:
      return `${months[month]} ${year}`;
  }
}

/**
 * Get start and end dates for a date range period
 */
function getDateRangeBounds(date, groupBy) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  switch (groupBy) {
    case 'day':
      const startOfDay = new Date(year, month, day);
      const endOfDay = new Date(year, month, day, 23, 59, 59);
      return { startDate: startOfDay, endDate: endOfDay };
      
    case 'week':
      const weekStart = getWeekStart(date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59);
      return { startDate: weekStart, endDate: weekEnd };
      
    case 'month':
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
      return { startDate: monthStart, endDate: monthEnd };
      
    case 'quarter':
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const quarterStart = new Date(year, quarterStartMonth, 1);
      const quarterEnd = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59);
      return { startDate: quarterStart, endDate: quarterEnd };
      
    default:
      return { startDate: date, endDate: date };
  }
}

/**
 * Get the start of the week (Sunday) for a given date
 */
function getWeekStart(date) {
  const weekStart = new Date(date);
  const dayOfWeek = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Get week number for a date
 */
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Format order date for display
 */
function formatOrderDate(dateStr) {
  if (!dateStr) return 'Unknown Date';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Calculate item count for an order (placeholder logic)
 * Note: orders.csv doesn't contain line item count, this would need line-items.csv
 */
function calculateItemCount(order) {
  // For now, return 1 since orders.csv doesn't have item counts
  // TODO: Need to join with line-items.csv to get actual count
  return '?'; // Show unknown until we implement line items joining
}

/**
 * Calculate total value for an order
 */
function calculateOrderValue(order) {
  // Use actual field name 'total' from orders.csv
  const value = order.total || 0;
  // Remove $ sign and convert to number
  const numericValue = typeof value === 'string' ? 
    parseFloat(value.replace(/[$,]/g, '')) || 0 : 
    Number(value) || 0;
  return `$${numericValue.toFixed(2)}`;
}

/**
 * Extract line items from order data (placeholder logic)
 * Note: orders.csv doesn't contain line items, need to join with line-items.csv
 */
function extractLineItems(order) {
  // TODO: Need to join orders with line-items.csv by order_id
  // For now, return placeholder indicating line items not available
  const placeholderLineItems = [
    {
      "#": 1,
      "Product": "Line items not loaded",
      "Size": "-",
      "Color": "-", 
      "Price": "Need line-items.csv"
    }
  ];
  
  return placeholderLineItems;
}

/**
 * Calculate totals for line items table
 */
function calculateLineItemTotals(lineItems) {
  if (!lineItems?.length) {
    return {
      "#": "",
      "Product": "Total",
      "Size": "",
      "Color": "",
      "Price": "0.00"
    };
  }
  
  const totalPrice = lineItems.reduce((sum, item) => {
    const price = Number(item.Price) || 0;
    return sum + price;
  }, 0);
  
  return {
    "#": "",
    "Product": `Total (${lineItems.length} items)`,
    "Size": "",
    "Color": "",
    "Price": totalPrice.toFixed(2)
  };
}

/**
 * Calculate metrics for a date range using actual order data
 */
function calculateDateRangeMetrics(orders) {
  if (!orders?.length) {
    return {
      "Orders": 0,
      "Velocity": '0.0/day',
      "UPT": 'N/A', 
      "AOV": '$0.00'
    };
  }
  
  const orderCount = orders.length;
  
  // Calculate total revenue from actual order totals
  let totalRevenue = 0;
  orders.forEach(order => {
    const value = order.total || 0;
    const numericValue = typeof value === 'string' ? 
      parseFloat(value.replace(/[$,]/g, '')) || 0 : 
      Number(value) || 0;
    totalRevenue += numericValue;
  });
  
  // Velocity: Orders per day (assuming 7 day period for now)
  const velocity = (orderCount / 7).toFixed(1) + '/day';
  
  // UPT: Units per transaction - can't calculate without line items
  const upt = 'N/A*'; // Need line-items.csv
  
  // AOV: Average order value 
  const aov = orderCount > 0 ? `$${(totalRevenue / orderCount).toFixed(2)}` : '$0.00';
  
  return {
    "Orders": orderCount,
    "Velocity": velocity,
    "UPT": upt,
    "AOV": aov
  };
}

/**
 * Get available date range strategies
 */
export function getAvailableDateStrategies() {
  return Object.values(DATE_RANGE_STRATEGIES);
}

/**
 * Create table for date range orders (collapsed view) 
 * Shows order summary rows that can be expanded
 */
export function createDateRangeTable(orders, sortColumn = null) {
  if (!orders?.length) {
    return {
      columnKeys: ['Order ID', 'Date', 'Items', 'Value'],
      rows: [],
      totals: {},
      rowCount: 0,
      columnCount: 4
    };
  }

  // Create rows from orders (each order = one row)
  const rows = orders.map((order, index) => ({
    "#": index + 1,
    "Order ID": order.id,
    "Date": order.date,
    "Items": order.itemCount,
    "Value": order.totalValue
  }));

  // Calculate totals
  let totalValue = 0;
  orders.forEach(order => {
    const value = order.totalValue || '$0.00';
    const numericValue = typeof value === 'string' ? 
      parseFloat(value.replace(/[$,]/g, '')) || 0 : 
      Number(value) || 0;
    totalValue += numericValue;
  });

  const totals = {
    "Order ID": `${orders.length} orders`,
    "Date": 'All dates',
    "Items": 'Total items',
    "Value": `$${totalValue.toFixed(2)}`
  };

  return {
    columnKeys: ['Order ID', 'Date', 'Items', 'Value'],
    rows,
    totals,
    rowCount: rows.length,
    columnCount: 4
  };
}

/**
 * Create table for line items (expanded order view)
 * Shows product details for a specific order
 */
export function createLineItemsTable(lineItems, sortColumn = null) {
  if (!lineItems?.length) {
    return {
      columnKeys: ['#', 'Product', 'Size', 'Color', 'Price'],
      rows: [],
      totals: {},
      rowCount: 0,
      columnCount: 5
    };
  }

  // Use line items as rows
  const rows = lineItems.map((item, index) => ({
    "#": index + 1,
    "Product": item.Product || item.product || 'Unknown',
    "Size": item.Size || item.size || '-',
    "Color": item.Color || item.color || '-',
    "Price": item.Price || item.price || '$0.00'
  }));

  // Calculate totals  
  let totalPrice = 0;
  lineItems.forEach(item => {
    const price = item.Price || item.price || '$0.00';
    const numericValue = typeof price === 'string' ? 
      parseFloat(price.replace(/[$,]/g, '')) || 0 : 
      Number(price) || 0;
    totalPrice += numericValue;
  });

  const totals = {
    "#": '',
    "Product": `${lineItems.length} items`,
    "Size": '',
    "Color": '',
    "Price": `$${totalPrice.toFixed(2)}`
  };

  return {
    columnKeys: ['#', 'Product', 'Size', 'Color', 'Price'],
    rows,
    totals,
    rowCount: rows.length,
    columnCount: 5
  };
}

/**
 * Get sortable columns for order tables
 */
export function getOrderSortableColumns() {
  return [
    { key: 'Order ID', label: 'Order ID' },
    { key: 'Date', label: 'Date' }, 
    { key: 'Value', label: 'Value' }
  ];
}

/**
 * Get sortable columns for line item tables
 */  
export function getLineItemSortableColumns() {
  return [
    { key: 'Product', label: 'Product' },
    { key: 'Size', label: 'Size' },
    { key: 'Color', label: 'Color' },
    { key: 'Price', label: 'Price' }
  ];
}

/**
 * Validate date range configuration
 */
export function validateDateRangeConfig(config) {
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  const required = ['id', 'groupBy', 'labelFormat'];
  return required.every(field => config.hasOwnProperty(field));
}