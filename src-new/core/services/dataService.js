// Simple data service for loading retail CSV data
// Replaces mock useAnalyticsQueryWithVerification with real data loading

import { loadCSVData, toTable } from '../config/tableConfig.js';

/**
 * Load line items data for a specific month
 */
export async function loadLineItemsData(year, month) {
  if (!year || !month) {
    console.error('loadLineItemsData: Missing year or month:', { year, month });
    return [];
  }

  const paddedMonth = month.padStart(2, '0');
  const filePath = `/data/retail/orders/${year}/${year}-${paddedMonth}/line_items.csv`;
  
  try {
    console.log(`loadLineItemsData: Loading from ${filePath} (year=${year}, month=${month})`);
    const rawData = await loadCSVData(filePath);
    console.log(`loadLineItemsData: Loaded ${rawData.length} line items from ${year}-${paddedMonth}`);
    
    // Debug: show first item to verify structure
    if (rawData.length > 0) {
      console.log(`loadLineItemsData: First item structure:`, rawData[0]);
      console.log(`loadLineItemsData: Product name field:`, rawData[0].product_name);
    }
    
    return rawData;
  } catch (error) {
    console.error(`loadLineItemsData: Failed to load from ${filePath}:`, error);
    return [];
  }
}

/**
 * Load orders data for a specific month (if needed)
 */
export async function loadOrdersData(year, month) {
  if (!year || !month) {
    console.error('loadOrdersData: Missing year or month:', { year, month });
    return [];
  }

  const paddedMonth = month.padStart(2, '0');
  const filePath = `/data/retail/orders/${year}/${year}-${paddedMonth}/orders.csv`;
  
  try {
    console.log(`loadOrdersData: Loading from ${filePath} (year=${year}, month=${month})`);
    const rawData = await loadCSVData(filePath);
    console.log(`loadOrdersData: Loaded ${rawData.length} orders from ${year}-${paddedMonth}`);
    return rawData;
  } catch (error) {
    console.error(`loadOrdersData: Failed to load from ${filePath}:`, error);
    return [];
  }
}

/**
 * Transform query parameters into data loading configuration
 */
function queryToDataConfig(query, currentView = 'orders') {
  // Extract useful parameters from query
  const {
    timeRange = null, // No default time range
    time = null,                // New time filter format
    scope = currentView, // Use currentView to determine data scope
    groupBy = false,
    columns = null
  } = query;
  
  console.log('dataService queryToDataConfig:', { query, currentView, time });
  
  // Convert time filter to year/month format for data loading
  // Don't default to any specific month - require explicit time filter
  let year = timeRange?.[0];
  let month = timeRange?.[1];
  let monthsToLoad = [];
  
  // If new time filter format is provided, use it instead
  if (time && time.startDate && time.endDate) {
    console.log('dataService using date range:', time.startDate, 'to', time.endDate);
    
    // Generate all months between start and end dates
    const startDate = new Date(time.startDate);
    const endDate = new Date(time.endDate);
    
    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    while (currentDate <= endDate) {
      const yearStr = currentDate.getFullYear().toString();
      const monthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      monthsToLoad.push({ year: yearStr, month: monthStr });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    console.log('dataService months to load:', monthsToLoad);
    
    // Use first month for legacy single-month logic
    if (monthsToLoad.length > 0) {
      year = monthsToLoad[0].year;
      month = monthsToLoad[0].month;
    }
  } else if (time && (time.start || time.startDate)) {
    console.log('dataService using time filter:', time);
    // Use start date for primary loading
    if (time.start) {
      // Format: "YYYY-MM"
      const [startYear, startMonth] = time.start.split('-');
      year = startYear;
      month = startMonth;
      console.log('dataService extracted from time.start:', { year, month });
    } else if (time.startDate) {
      // Format: "YYYY-MM-DD" 
      const startDate = new Date(time.startDate);
      year = startDate.getFullYear().toString();
      month = (startDate.getMonth() + 1).toString().padStart(2, '0');
      console.log('dataService extracted from time.startDate:', { year, month });
    }
  }
  
  // Map view types to data scopes and configurations
  const viewConfigs = {
    'orders': {
      scope: 'orders',
      groupBy: false,
      aggregation: 'none'
    },
    'line_items': {
      scope: 'line_items',
      groupBy: ['product_name', 'color', 'size'], // Group by product variants
      aggregation: 'sum'       // Sum quantities and revenue
    },
    'grouped': {
      scope: 'line_items',
      groupBy: groupBy || false, // User-configurable grouping
      aggregation: groupBy ? 'sum' : 'none'
    },
    'chart': {
      scope: 'line_items',
      groupBy: false,
      aggregation: 'none'
    }
  };
  
  const viewConfig = viewConfigs[currentView] || viewConfigs['orders'];
  
  const config = {
    year: year,
    month: month,
    monthsToLoad: monthsToLoad.length > 0 ? monthsToLoad : [{ year, month }],
    scope: viewConfig.scope,
    tableOptions: {
      scope: viewConfig.scope,
      groupBy: viewConfig.groupBy,
      columns: columns || viewConfig.scope, // Use scope as preset if no columns specified
      aggregation: viewConfig.aggregation
    }
  };
  
  console.log('dataService final config:', config);
  return config;
}

/**
 * Main data loading function that replaces useAnalyticsQueryWithVerification
 */
export async function loadAnalyticsData(query = {}, panelState = {}, currentView = 'orders') {
  const config = queryToDataConfig(query, currentView);
  
  try {
    // Check if we have valid year/month to load data
    if (!config.year || !config.month) {
      console.log('loadAnalyticsData: No year/month specified, returning empty data');
      return {
        table: null,
        rawData: [],
        loading: false,
        error: null,
        meta: { message: 'No time range selected' },
        needsVerification: false,
        discoveredProducts: [],
        processVerification: () => {},
        cancelVerification: () => {}
      };
    }

    // Load raw data based on scope
    let rawData = [];
    
    if (config.scope === 'orders') {
      // Load orders from all months in the date range
      rawData = [];
      for (const monthConfig of config.monthsToLoad) {
        if (monthConfig.year && monthConfig.month) {
          const monthData = await loadOrdersData(monthConfig.year, monthConfig.month);
          rawData.push(...monthData);
        }
      }
      console.log(`dataService: Loaded ${rawData.length} total orders from ${config.monthsToLoad.length} months`);
      
      // Filter orders by date range
      if (query.time && query.time.startDate && query.time.endDate) {
        console.log('dataService: Filtering orders by date range:', query.time.startDate, 'to', query.time.endDate);
        const startDate = new Date(query.time.startDate + 'T00:00:00.000-07:00'); // PDT timezone
        const endDate = new Date(query.time.endDate + 'T23:59:59.999-07:00'); // PDT timezone
        
        console.log('dataService: Date range objects:', { startDate, endDate });
        
        let matchCount = 0;
        let totalCount = 0;
        rawData = rawData.filter(row => {
          totalCount++;
          const dateStr = row.date_time;
          if (!dateStr) {
            console.log(`dataService: Row ${totalCount}: No date_time field`);
            return false;
          }
          
          // Parse date like "Aug 1, 2025, 5:24 PM PDT"
          const rowDate = new Date(dateStr);
          if (isNaN(rowDate)) {
            console.log(`dataService: Row ${totalCount}: Failed to parse date:`, dateStr);
            return false;
          }
          
          const inRange = rowDate >= startDate && rowDate <= endDate;
          if (inRange) {
            matchCount++;
            console.log(`dataService: Row ${totalCount}: MATCH - ${dateStr} -> ${rowDate}`);
          } else if (totalCount <= 10) {
            // Only log first 10 non-matches to avoid spam
            console.log(`dataService: Row ${totalCount}: Out of range - ${dateStr} -> ${rowDate} (need: ${startDate} to ${endDate})`);
          }
          return inRange;
        });
        
        console.log(`dataService: Date filtering complete: ${matchCount}/${totalCount} rows matched`);
        
        console.log(`dataService: Filtered orders from full month to ${rawData.length} records in date range`);
      }
    } else {
      // For line_items with date filtering: ORDERS FIRST, THEN LINE ITEMS
      if (query.time && query.time.startDate && query.time.endDate) {
        console.log('dataService: Loading orders first to filter by date range:', query.time.startDate, 'to', query.time.endDate);
        
        // Step 1: Load orders from all months and filter by date range
        let allOrders = [];
        for (const monthConfig of config.monthsToLoad) {
          if (monthConfig.year && monthConfig.month) {
            const monthData = await loadOrdersData(monthConfig.year, monthConfig.month);
            allOrders.push(...monthData);
          }
        }
        console.log(`dataService: Loaded ${allOrders.length} total orders from ${config.monthsToLoad.length} months`);
        
        const startDate = new Date(query.time.startDate + 'T00:00:00.000-07:00'); // PDT timezone
        const endDate = new Date(query.time.endDate + 'T23:59:59.999-07:00'); // PDT timezone
        
        console.log('dataService: Line items date range objects:', { startDate, endDate });
        
        let matchCount = 0;
        let totalCount = 0;
        const filteredOrders = allOrders.filter(order => {
          totalCount++;
          const dateStr = order.date_time;
          if (!dateStr) {
            console.log(`dataService: Order ${totalCount}: No date_time field`);
            return false;
          }
          
          const rowDate = new Date(dateStr);
          if (isNaN(rowDate)) {
            console.log(`dataService: Order ${totalCount}: Failed to parse date:`, dateStr);
            return false;
          }
          
          const inRange = rowDate >= startDate && rowDate <= endDate;
          if (inRange) {
            matchCount++;
            console.log(`dataService: Order ${totalCount}: MATCH - ${dateStr} -> ${rowDate}`);
          } else if (totalCount <= 10) {
            // Only log first 10 non-matches to avoid spam
            console.log(`dataService: Order ${totalCount}: Out of range - ${dateStr} -> ${rowDate} (need: ${startDate} to ${endDate})`);
          }
          return inRange;
        });
        
        console.log(`dataService: Order filtering complete: ${matchCount}/${totalCount} orders matched`);
        
        console.log(`dataService: Filtered to ${filteredOrders.length} orders in date range`);
        
        // Step 2: Get order IDs from filtered orders
        const orderIds = new Set(filteredOrders.map(order => order.order_id));
        console.log(`dataService: Looking for line items in ${orderIds.size} orders`);
        
        // Step 3: Load line items from all months and filter by order IDs
        let allLineItems = [];
        for (const monthConfig of config.monthsToLoad) {
          if (monthConfig.year && monthConfig.month) {
            const monthData = await loadLineItemsData(monthConfig.year, monthConfig.month);
            allLineItems.push(...monthData);
          }
        }
        console.log(`dataService: Loaded ${allLineItems.length} total line items from ${config.monthsToLoad.length} months`);
        
        rawData = allLineItems.filter(item => orderIds.has(item.order_id));
        console.log(`dataService: Filtered to ${rawData.length} line items for orders in date range`);

        // Step 4: Enrich line items with order data (date_time, customer, etc.)
        const ordersMap = new Map(filteredOrders.map(order => [order.order_id, order]));
        rawData = rawData.map(lineItem => {
          const order = ordersMap.get(lineItem.order_id);
          if (order) {
            return {
              ...lineItem,
              date_time: order.date_time,
              customer_name: order.customer_name,
              associate: order.associate,
              channel: order.channel,
              fulfillment_location: order.fulfillment_location
            };
          }
          return lineItem;
        });
        console.log(`dataService: Enriched ${rawData.length} line items with order data`);
        
      } else {
        // No date filter - load ALL time data and enrich with orders
        console.log('dataService: No date filter - loading all available data');

        // Step 1: Load all orders from all available months
        let allOrders = [];
        for (const yearInfo of AVAILABLE_MONTHS) {
          for (const month of yearInfo.months) {
            try {
              const monthData = await loadOrdersData(yearInfo.year, month);
              if (monthData && monthData.length > 0) {
                allOrders.push(...monthData);
              }
            } catch (error) {
              console.warn(`dataService: Failed to load orders for ${yearInfo.year}-${month}:`, error);
            }
          }
        }
        console.log(`dataService: Loaded ${allOrders.length} total orders from all time`);

        // Step 2: Load all line items from all available months
        let allLineItems = [];
        for (const yearInfo of AVAILABLE_MONTHS) {
          for (const month of yearInfo.months) {
            try {
              const monthData = await loadLineItemsData(yearInfo.year, month);
              if (monthData && monthData.length > 0) {
                allLineItems.push(...monthData);
              }
            } catch (error) {
              console.warn(`dataService: Failed to load line items for ${yearInfo.year}-${month}:`, error);
            }
          }
        }
        console.log(`dataService: Loaded ${allLineItems.length} total line items from all time`);

        // Step 3: Enrich line items with order data
        const ordersMap = new Map(allOrders.map(order => [order.order_id, order]));
        rawData = allLineItems.map(lineItem => {
          const order = ordersMap.get(lineItem.order_id);
          if (order) {
            return {
              ...lineItem,
              date_time: order.date_time,
              customer_name: order.customer_name,
              associate: order.associate,
              channel: order.channel,
              fulfillment_location: order.fulfillment_location
            };
          }
          return lineItem;
        });
        console.log(`dataService: Enriched ${rawData.length} line items with order data (all time)`);
      }
    }
    
    // Transform to table format using our enhanced tableConfig
    const table = toTable(rawData, config.tableOptions);
    
    return {
      table,
      rawData,
      loading: false,
      error: null,
      meta: table.meta,
      needsVerification: false,
      discoveredProducts: [],
      processVerification: () => {},
      cancelVerification: () => {}
    };
    
  } catch (error) {
    console.error('Analytics data loading failed:', error);
    
    return {
      table: null,
      rawData: null,
      loading: false,
      error: error.message,
      meta: null,
      needsVerification: false,
      discoveredProducts: [],
      processVerification: () => {},
      cancelVerification: () => {}
    };
  }
}

/**
 * Available data months (from the index.json we saw earlier)
 */
export const AVAILABLE_MONTHS = [
  { year: '2023', months: ['10', '11', '12'] },
  { year: '2024', months: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] },
  { year: '2025', months: ['01', '02', '03', '04', '05', '06', '07', '08'] }
];

/**
 * Load all available line items data across all months for product search
 * Used by Discovery page to enable 'all time' product searches
 */
export async function loadAllTimeLineItemsData() {
  console.log('loadAllTimeLineItemsData: Loading all available line items for search');
  
  let allData = [];
  let loadedMonths = 0;
  let failedMonths = 0;
  
  // Load ALL available months for true all-time data
  for (const yearInfo of AVAILABLE_MONTHS) {
    for (const month of yearInfo.months) {
      try {
        console.log(`loadAllTimeLineItemsData: Attempting to load ${yearInfo.year}-${month}`);
        const monthData = await loadLineItemsData(yearInfo.year, month);
        console.log(`loadAllTimeLineItemsData: Got response for ${yearInfo.year}-${month}:`, monthData?.length, 'items');
        
        if (monthData && monthData.length > 0) {
          allData.push(...monthData);
          loadedMonths++;
          console.log(`loadAllTimeLineItemsData: Successfully loaded ${monthData.length} items from ${yearInfo.year}-${month}`);
        } else {
          console.warn(`loadAllTimeLineItemsData: No data returned for ${yearInfo.year}-${month}`);
        }
      } catch (error) {
        failedMonths++;
        console.error(`loadAllTimeLineItemsData: Failed to load ${yearInfo.year}-${month}:`, error);
      }
    }
  }
  
  console.log(`loadAllTimeLineItemsData: Complete. Loaded ${allData.length} total items from ${loadedMonths} months (${failedMonths} failed)`);
  return allData;
}

/**
 * Load line items data for specific products across all available time periods
 * @param {Array} productNames - Array of product names to search for
 * @returns {Array} - Filtered line items matching the specified products
 */
export async function loadAllTimeProductData(productNames = []) {
  if (!productNames || productNames.length === 0) {
    console.log('loadAllTimeProductData: No products specified, loading all data');
    return await loadAllTimeLineItemsData();
  }
  
  console.log('loadAllTimeProductData: Loading data for products:', productNames);
  
  const allData = await loadAllTimeLineItemsData();
  
  // Filter for EXACT product name matches only - NO SPLITTING, NO FUZZY MATCHING
  const filteredData = allData.filter(row => {
    const fullProductName = row["Product Name"] || row.product_name || '';

    // EXACT match only - checkbox commits to specific product
    return productNames.some(searchName => {
      const normalizedSearch = searchName.toLowerCase().trim();
      const normalizedProduct = fullProductName.toLowerCase().trim();
      return normalizedProduct === normalizedSearch;
    });
  });

  console.log(`loadAllTimeProductData: Filtered ${allData.length} items to ${filteredData.length} items for ${productNames.length} products`);
  console.log(`loadAllTimeProductData: Filter was for EXACT match:`, productNames);
  if (filteredData.length > 0) {
    console.log(`loadAllTimeProductData: Sample filtered item product_name:`, filteredData[0].product_name);
  }
  return filteredData;
}

/**
 * Get the latest available month
 */
export function getLatestMonth() {
  // Return null - let the UI handle defaults if needed
  return null;
}