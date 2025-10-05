// Consolidated table configuration and utilities
// Raw-first table utilities for dual view mode system
// Hybrid approach: centralized transformation with flexible options

// Standardized column labels (single source of truth)
export const COLUMN_LABELS = {
  // Raw CSV field mappings - line_items.csv
  "product_name": "Product",
  "upc": "UPC", 
  "color": "Color",
  "size": "Size",
  "discounted_price": "Revenue",
  "unit_price": "Unit Price", 
  "quantity": "Units",
  "line_discount": "Discount",
  "taxes": "Taxes",
  "order_id": "Order ID",
  "sku": "SKU",
  "status": "Status",
  
  // Raw CSV field mappings - orders.csv
  "customer_name": "Customer",
  "associate": "Associate",
  "date_time": "Date",
  "channel_type": "Channel",
  "fulfillment_type": "Fulfillment",
  "total": "Total",
  "discount": "Discount",
  
  // Legacy display field mappings (for backward compatibility)
  "Product Name": "Product",
  "UPC": "UPC",
  "Color": "Color", 
  "Size": "Size",
  "Product Net": "Revenue",
  "Order Date/Time": "Date",
  "Quantity Sold": "Units",
  "Average Order Value": "AOV"
};

// Common column configurations for different use cases
export const COLUMN_PRESETS = {
  // Line items analysis
  line_items: ["product_name", "color", "size", "quantity", "discounted_price"],
  
  // Product performance 
  products: ["product_name", "quantity", "discounted_price", "unit_price"],
  
  // Order analysis (note: this will need order fields from orders.csv)
  orders: ["order_id", "customer_name", "date_time", "total", "status"],
  
  // Inventory view
  inventory: ["product_name", "sku", "upc", "color", "size"],
  
  // Default fallback
  default: ["product_name", "quantity", "discounted_price"]
};

// Numeric fields for aggregation
export const NUMERIC_FIELDS = [
  "quantity", "discounted_price", "unit_price", "line_discount", "taxes", "total"
];

// Groupable fields
export const GROUPABLE_FIELDS = [
  "product_name", "color", "size", "sku", "upc", "order_id", "status"
];

// Helper function to get display label for any column
export const getDisplayLabel = (columnKey) => COLUMN_LABELS[columnKey] || columnKey;

// Enhanced data transformation with flexible options
export function toTable(rawData = [], options = {}) {
  const {
    // Data filtering options
    scope = 'line_items',           // 'line_items' | 'orders' | 'both'
    timeframe = 'all',              // 'daily' | 'weekly' | 'monthly' | 'all' | 'range'
    dateRange = null,               // [startDate, endDate] for range filtering
    
    // Column selection options  
    columns = null,                 // Array of column names | preset key | null (auto-detect)
    excludeColumns = [],            // Columns to exclude
    
    // Grouping options
    groupBy = false,                // false | string | array of strings
    aggregation = 'sum',            // 'sum' | 'count' | 'avg' | 'min' | 'max' | 'none'
    
    // Legacy options (for backward compatibility)
    customColumns = null,
    kpis = {},
    meta = {}
  } = options;

  // Handle empty data
  if (!rawData?.length) {
    const defaultColumns = COLUMN_PRESETS[scope] || COLUMN_PRESETS.default;
    return {
      columnKeys: defaultColumns,
      displayLabels: defaultColumns.map(key => getDisplayLabel(key)),
      rows: [],
      totals: {},
      rowCount: 0,
      columnCount: defaultColumns.length,
      meta: { kpis, scope, timeframe, ...meta }
    };
  }

  // Step 1: Apply data filtering
  let filteredData = filterDataByTimeframe(rawData, timeframe, dateRange);
  
  // Step 2: Determine columns to use
  const availableColumns = Object.keys(filteredData[0] || {});
  let columnKeys;
  
  if (customColumns) {
    // Legacy support
    columnKeys = customColumns;
  } else if (columns && Array.isArray(columns)) {
    // Explicit column list
    columnKeys = columns.filter(col => availableColumns.includes(col));
  } else if (columns && typeof columns === 'string' && COLUMN_PRESETS[columns]) {
    // Preset column configuration
    columnKeys = COLUMN_PRESETS[columns].filter(col => availableColumns.includes(col));
  } else {
    // Auto-detect based on scope
    const preset = COLUMN_PRESETS[scope] || COLUMN_PRESETS.default;
    columnKeys = preset.filter(col => availableColumns.includes(col));
  }
  
  // Apply column exclusions
  columnKeys = columnKeys.filter(col => !excludeColumns.includes(col));
  
  // Step 3: Apply grouping if specified
  let processedData = filteredData;
  if (groupBy) {
    processedData = applyGrouping(filteredData, groupBy, aggregation, columnKeys);
  }
  
  // Step 4: Transform to table format
  const tableRows = processedData.map((row, i) => {
    const tableRow = { "#": i + 1 };
    
    columnKeys.forEach(colKey => {
      tableRow[colKey] = row[colKey] || '';
    });

    return tableRow;
  });

  // Step 5: Calculate totals for numeric columns
  const totals = {};
  columnKeys.forEach(colKey => {
    if (NUMERIC_FIELDS.includes(colKey)) {
      totals[colKey] = tableRows.reduce((sum, row) => {
        const val = parseFloat(row[colKey]) || 0;
        return sum + val;
      }, 0);
    }
  });

  return {
    columnKeys,
    displayLabels: columnKeys.map(key => getDisplayLabel(key)),
    rows: tableRows,
    totals,
    rowCount: tableRows.length,
    columnCount: columnKeys.length,
    meta: { 
      kpis, 
      scope, 
      timeframe, 
      groupBy, 
      aggregation,
      originalRowCount: rawData.length,
      ...meta 
    }
  };
}

// Helper functions for data processing

/**
 * Filter data by timeframe and date range
 */
function filterDataByTimeframe(data, timeframe, dateRange) {
  if (timeframe === 'all' && !dateRange) {
    return data;
  }
  
  // For now, return all data - implement date filtering when needed
  // TODO: Add date parsing and filtering logic based on order_date or similar fields
  return data;
}

/**
 * Apply grouping and aggregation to data
 */
function applyGrouping(data, groupBy, aggregation, columnKeys) {
  if (!groupBy || aggregation === 'none') {
    return data;
  }
  
  const groupFields = Array.isArray(groupBy) ? groupBy : [groupBy];
  const numericFields = columnKeys.filter(col => NUMERIC_FIELDS.includes(col));
  
  // Group data by specified fields
  const groups = {};
  
  data.forEach(row => {
    // Create group key from groupBy fields
    const groupKey = groupFields.map(field => row[field] || '').join('|');
    
    if (!groups[groupKey]) {
      // Initialize group with first row
      groups[groupKey] = { ...row };
      
      // Initialize numeric fields for aggregation
      numericFields.forEach(field => {
        groups[groupKey][field] = parseFloat(row[field]) || 0;
      });
    } else {
      // Aggregate numeric fields
      numericFields.forEach(field => {
        const value = parseFloat(row[field]) || 0;
        const existing = parseFloat(groups[groupKey][field]) || 0;
        
        switch (aggregation) {
          case 'sum':
            groups[groupKey][field] = existing + value;
            break;
          case 'count':
            groups[groupKey][field] = existing + 1;
            break;
          case 'avg':
            // Will need count tracking for proper averaging - simplified for now
            groups[groupKey][field] = existing + value;
            break;
          case 'min':
            groups[groupKey][field] = Math.min(existing, value);
            break;
          case 'max':
            groups[groupKey][field] = Math.max(existing, value);
            break;
          default:
            groups[groupKey][field] = existing + value;
        }
      });
    }
  });
  
  return Object.values(groups);
}

/**
 * Simple CSV data loader (for future use)
 */
export async function loadCSVData(filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load ${filePath}: ${response.status}`);
    }
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error loading CSV data:', error);
    return [];
  }
}

/**
 * CSV parser that handles quoted fields with commas
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      row[header] = value;
    });
    
    data.push(row);
  }
  
  return data;
}

/**
 * Parse a single CSV line respecting quoted fields
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

export function applyMetric(data = []) {
  // Simple pass-through for now - metrics will be implemented later
  // Following raw-first strategy: process data using CSV field names
  return data;
}

// Legacy exports for backward compatibility
export { toTable as toTableDTO };
export default toTable;