// Data grouping configuration and strategies
// Extracted from VariantGroup.jsx for reusability across components

// Grouping strategy definitions
export const GROUP_STRATEGIES = {
  product_variants: {
    id: 'product_variants',
    name: 'Product Variants',
    description: 'Group by product name, then by color variants',
    groupBy: ['product_name'],
    nestedBy: ['color'],
    displayFields: ['color', 'size', 'quantity', 'discounted_price'],
    aggregation: 'sum',
    defaultExpanded: false,
    allowCollapse: true,
    sortBy: 'quantity',
    sortDirection: 'desc'
  },
  
  product_performance: {
    id: 'product_performance', 
    name: 'Product Performance',
    description: 'Group by product with all variants combined',
    groupBy: ['product_name'],
    nestedBy: [],
    displayFields: ['quantity', 'discounted_price', 'unit_price'],
    aggregation: 'sum',
    defaultExpanded: true,
    allowCollapse: false,
    sortBy: 'discounted_price',
    sortDirection: 'desc'
  },
  
  color_analysis: {
    id: 'color_analysis',
    name: 'Color Analysis', 
    description: 'Group by color across all products',
    groupBy: ['color'],
    nestedBy: ['product_name'],
    displayFields: ['product_name', 'size', 'quantity', 'discounted_price'],
    aggregation: 'sum',
    defaultExpanded: false,
    allowCollapse: true,
    sortBy: 'quantity',
    sortDirection: 'desc'
  }
};

/**
 * Auto-detect the best grouping strategy for given data
 */
export function detectBestGrouping(rows) {
  if (!rows?.length) return 'product_performance';
  
  // Check if Product Name contains variant patterns (e.g., "Product - Color - Size")
  const productNames = rows.map(r => r["Product Name"] || r.product_name || '').filter(Boolean);
  
  // Look for consistent " - " patterns indicating variants
  const hasVariantPattern = productNames.some(name => 
    (name.match(/ - /g) || []).length >= 2
  );
  
  if (hasVariantPattern) {
    return 'product_variants'; // Group by product and color, show size variations
  }
  
  return 'product_variants'; // Default to product variant grouping
}

/**
 * Create grouping configuration with custom options
 */
export function createGroupingConfig(strategyId, customOptions = {}) {
  const baseStrategy = GROUP_STRATEGIES[strategyId] || GROUP_STRATEGIES.product_variants;
  
  return {
    ...baseStrategy,
    ...customOptions,
    // Ensure arrays are properly merged
    displayFields: customOptions.displayFields || baseStrategy.displayFields,
    groupBy: customOptions.groupBy || baseStrategy.groupBy,
    nestedBy: customOptions.nestedBy || baseStrategy.nestedBy
  };
}

/**
 * Group rows by product and color for variant display
 * Extracted from VariantGroup.jsx
 */
export function groupRowsByProductColor(rows) {
  const groups = new Map();
  
  rows.forEach((row, index) => {
    // Handle both legacy and new field names
    const fullProductName = row["Product Name"] || row.product_name || '';
    const color = row["Color"] || row.color || 'Default';
    
    // Extract base product name by removing variant suffix
    const productBase = fullProductName.split(' - ')[0] || fullProductName;
    
    const groupKey = `${productBase} - ${color}`;
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: groupKey,
        productName: productBase,
        color: color,
        displayName: groupKey,
        upc: row["UPC"] || row.upc || '',
        rows: []
      });
    }
    
    groups.get(groupKey).rows.push(row);
  });
  
  // Sort groups by total quantity/revenue (descending)
  return Array.from(groups.values()).sort((a, b) => {
    const aTotal = a.rows.reduce((sum, row) => 
      sum + (Number(row["Quantity Sold"] || row.quantity) || 1), 0
    );
    const bTotal = b.rows.reduce((sum, row) => 
      sum + (Number(row["Quantity Sold"] || row.quantity) || 1), 0
    );
    return bTotal - aTotal;
  });
}

/**
 * Generate product configuration from table data
 * Extracted and simplified from VariantGroup.jsx
 */
export function generateProductConfig(table, groupingConfig) {
  const { rows = [] } = table;
  
  if (!rows.length) {
    return { products: [] };
  }

  // Use the grouping strategy
  const strategy = groupingConfig.id || 'product_variants';
  
  if (strategy === 'none') {
    return { products: [] };
  }

  // Group by product and color
  const variantGroups = groupRowsByProductColor(rows);
  
  // Group variants by product name
  const productMap = new Map();
  
  variantGroups.forEach(group => {
    if (!productMap.has(group.productName)) {
      productMap.set(group.productName, {
        key: group.productName,
        name: group.productName,
        variants: []
      });
    }
    
    // Add this color variant to the product
    productMap.get(group.productName).variants.push({
      key: group.key,
      productName: group.productName,
      color: group.color,
      displayName: group.displayName,
      upc: group.upc,
      table: {
        columnKeys: ['Color', 'Size', 'Units', 'Net'],
        rows: transformRowsForVariantTable(group.rows),
        totals: calculateVariantTotals(group.rows),
        rowCount: group.rows.length,
        columnCount: 4
      }
    });
  });
  
  // Sort products by total units sold (descending)
  const products = Array.from(productMap.values()).sort((a, b) => {
    const aTotalUnits = a.variants.reduce((sum, variant) => 
      sum + (variant.table.totals['Units'] || 0), 0
    );
    const bTotalUnits = b.variants.reduce((sum, variant) => 
      sum + (variant.table.totals['Units'] || 0), 0
    );
    return bTotalUnits - aTotalUnits;
  });

  return { products };
}

/**
 * Transform rows to match variant table format: Color, Size, Units, Net
 * Simplified from VariantGroup.jsx (removed attach rate calculation for now)
 */
function transformRowsForVariantTable(rows) {
  // Group by size and sum quantities
  const sizeGroups = new Map();
  
  rows.forEach(row => {
    const color = row["Color"] || row.color || 'Default';
    const size = row["Size"] || row.size || 'One Size';
    const quantity = Number(row["Quantity Sold"] || row.quantity) || 1;
    const revenue = Number(row["Product Net"] || row.discounted_price) || 0;
    
    if (!sizeGroups.has(size)) {
      sizeGroups.set(size, {
        color,
        size,
        quantity: 0,
        revenue: 0
      });
    }
    
    const group = sizeGroups.get(size);
    group.quantity += quantity;
    group.revenue += revenue;
  });
  
  // Convert to array and create table rows
  return Array.from(sizeGroups.values()).map((group, index) => ({
    "#": index + 1,
    "Color": group.color,
    "Size": group.size,
    "Units": group.quantity,
    "Net": group.revenue
  }));
}

/**
 * Calculate totals for variant table
 */
function calculateVariantTotals(rows) {
  const totalQuantity = rows.reduce((sum, row) => 
    sum + (Number(row["Quantity Sold"] || row.quantity) || 1), 0
  );
  const totalRevenue = rows.reduce((sum, row) => 
    sum + (Number(row["Product Net"] || row.discounted_price) || 0), 0
  );
  
  // Get the color from the first row for display in footer
  const color = rows.length > 0 ? (rows[0]["Color"] || rows[0].color || 'Default') : 'Default';
  
  return {
    "Color": color,  // Display color in A3 position for collapsed view
    "Size": "All Sizes",  // Display "All Sizes" for collapsed view
    "Units": totalQuantity,
    "Net": totalRevenue
  };
}

/**
 * Get available grouping strategies
 */
export function getAvailableStrategies() {
  return Object.values(GROUP_STRATEGIES);
}

/**
 * Create a unified table for collapsed view with header + variant footers
 * Can optionally reorder/reorganize data based on sortColumn
 */
export function createCollapsedTable(variants, sortColumn = null) {
  if (!variants?.length) {
    return {
      columnKeys: ['Color', 'Size', 'Units', 'Net'],
      rows: [],
      totals: {},
      rowCount: 0,
      columnCount: 4
    };
  }

  // Default behavior: show variants as rows (Color-first grouping)
  if (!sortColumn || sortColumn === 'Color') {
    return createColorFirstTable(variants);
  }

  // Size-first grouping: reorganize data by size, then color
  if (sortColumn === 'Size') {
    return createSizeFirstTable(variants);
  }

  // Fallback to default
  return createColorFirstTable(variants);
}

/**
 * Create table with Color as primary grouping (default behavior)
 */
function createColorFirstTable(variants) {
  const columnKeys = ['Color', 'Size', 'Units', 'Net'];

  // Create rows from variant totals (each variant = one row)
  const rows = variants.map((variant, index) => ({
    "#": index + 1,
    ...variant.table.totals
  }));

  // Calculate grand totals across all variants - Color is first column
  const grandTotals = {
    "Color": 'All Colors',     // First column gets "All Colors" when Color is primary
    "Size": 'All Sizes',      // Second column gets "All Sizes"
    "Units": variants.reduce((sum, variant) => sum + (variant.table.totals['Units'] || 0), 0),
    "Net": variants.reduce((sum, variant) => sum + (variant.table.totals['Net'] || 0), 0)
  };

  console.log('🔍 createColorFirstTable columnKeys:', columnKeys);
  console.log('🔍 createColorFirstTable totals:', grandTotals);

  return {
    columnKeys,
    rows,
    totals: grandTotals,
    rowCount: rows.length,
    columnCount: columnKeys.length
  };
}

/**
 * Normalize and order sizes logically
 */
function getSizeOrder(size) {
  const sizeMap = {
    'XXS': 0, 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6, '3XL': 7, '4XL': 8, '5XL': 9,
    // Numeric sizes
    '0': 10, '2': 11, '4': 12, '6': 13, '8': 14, '10': 15, '12': 16, '14': 17, '16': 18, '18': 19, '20': 20,
    // Special cases
    'One Size': 100, 'OS': 100, 'Free Size': 100, 'Universal': 100
  };
  
  // Try exact match first
  if (sizeMap.hasOwnProperty(size)) {
    return sizeMap[size];
  }
  
  // Check for pant sizes with inseam (waist x inseam format)
  const pantMatch = size.match(/^(\d+)\s*[xX]\s*(\d+)$/);
  if (pantMatch) {
    const waist = parseInt(pantMatch[1]);
    const inseam = parseInt(pantMatch[2]);
    // Sort by waist first (multiply by 1000), then by inseam
    // This gives us: 30x30=30000+30=30030, 30x32=30032, 32x30=32030, etc.
    return (waist * 1000) + inseam + 50000; // Add 50000 to put pant sizes after other categories
  }
  
  // Check for waist-only pant sizes (24, 25, 26, etc.)
  const waistSize = parseInt(size);
  if (!isNaN(waistSize) && waistSize >= 24 && waistSize <= 50) {
    return waistSize + 30000; // Put waist-only sizes before waist x inseam
  }
  
  // Try numeric conversion for other unlisted numeric sizes
  if (!isNaN(waistSize)) {
    return waistSize + 70000; // Put unknown numeric sizes at end
  }
  
  // Unknown sizes go to the very end
  return 99999;
}

/**
 * Create table with Size as primary grouping
 * Each size gets a row, with colors as secondary dimension
 */
function createSizeFirstTable(variants) {
  const columnKeys = ['Size', 'Color', 'Units', 'Net'];
  
  // Safety check
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    console.warn('createSizeFirstTable: no variants provided');
    return {
      columnKeys,
      rows: [],
      totals: { "Size": 'All Sizes', "Color": 'All Colors', "Units": 0, "Net": 0 },
      rowCount: 0,
      columnCount: columnKeys.length
    };
  }

  // Collect all raw data from variants to reorganize by size
  const allRawData = [];
  variants.forEach(variant => {
    // Safety check: ensure variant has table and rows
    if (!variant?.table?.rows) {
      console.warn('createSizeFirstTable: variant missing table.rows', variant);
      return;
    }
    
    // Get the raw rows from each variant (before they were grouped by color)
    variant.table.rows.forEach(row => {
      if (!row) {
        console.warn('createSizeFirstTable: empty row in variant', variant);
        return;
      }
      
      allRawData.push({
        color: row.Color || row.color || 'Default',
        size: row.Size || row.size || 'One Size',
        units: Number(row.Units || row.units) || 0,
        net: Number(row.Net || row.net) || 0
      });
    });
  });

  // Handle case where no valid data was collected
  if (allRawData.length === 0) {
    console.warn('createSizeFirstTable: no valid row data found in variants');
    return {
      columnKeys,
      rows: [],
      totals: { "Size": 'All Sizes', "Color": 'All Colors', "Units": 0, "Net": 0 },
      rowCount: 0,
      columnCount: columnKeys.length
    };
  }

  // Group by size first, then aggregate colors within each size
  const sizeGroups = new Map();
  
  allRawData.forEach(item => {
    const sizeKey = item.size || 'One Size';
    
    if (!sizeGroups.has(sizeKey)) {
      sizeGroups.set(sizeKey, {
        size: sizeKey,
        colors: new Map(),
        totalUnits: 0,
        totalNet: 0
      });
    }
    
    const sizeGroup = sizeGroups.get(sizeKey);
    const colorKey = item.color || 'Default';
    
    if (!sizeGroup.colors.has(colorKey)) {
      sizeGroup.colors.set(colorKey, { units: 0, net: 0 });
    }
    
    sizeGroup.colors.get(colorKey).units += item.units;
    sizeGroup.colors.get(colorKey).net += item.net;
    sizeGroup.totalUnits += item.units;
    sizeGroup.totalNet += item.net;
  });

  // Create rows: each size gets a row with "All Colors" in color column
  // Sort sizes logically before creating rows
  const sortedSizeGroups = Array.from(sizeGroups.values()).sort((a, b) => {
    return getSizeOrder(a.size) - getSizeOrder(b.size);
  });

  const rows = sortedSizeGroups.map((sizeGroup, index) => ({
    "#": index + 1,
    "Size": sizeGroup.size,        // Show actual size (S, M, L, etc.)
    "Color": "All Colors",         // Always show "All Colors" for each size
    "Units": sizeGroup.totalUnits,
    "Net": sizeGroup.totalNet
  }));

  // Calculate grand totals - Size is first column, so "All Sizes" goes there
  const grandTotals = {
    "Size": 'All Sizes',        // First column gets "All Sizes" when Size is primary
    "Color": 'All Colors',      // Second column gets "All Colors" 
    "Units": sortedSizeGroups.reduce((sum, group) => sum + group.totalUnits, 0),
    "Net": sortedSizeGroups.reduce((sum, group) => sum + group.totalNet, 0)
  };

  console.log('🔍 createSizeFirstTable columnKeys:', columnKeys);
  console.log('🔍 createSizeFirstTable totals:', grandTotals);

  return {
    columnKeys,
    rows,
    totals: grandTotals,
    rowCount: rows.length,
    columnCount: columnKeys.length
  };
}

/**
 * Create table for expanded view - shows only headers and footers
 * When Size is selected, each size becomes a footer row with "All Colors"
 */
export function createExpandedTable(variants, sortColumn = null) {
  if (!variants?.length) {
    return {
      columnKeys: ['Color', 'Size', 'Units', 'Net'],
      rows: [],
      totals: {},
      rowCount: 0,
      columnCount: 4
    };
  }

  // For expanded view, we want header + footer only (no body rows)
  // The "rows" will actually be footer-like summary rows
  
  if (sortColumn === 'Size') {
    return createExpandedSizeFirstTable(variants);
  } else {
    return createExpandedColorFirstTable(variants);
  }
}

/**
 * Expanded view with Color-first: Show each color as a footer row
 */
function createExpandedColorFirstTable(variants) {
  const columnKeys = ['Color', 'Size', 'Units', 'Net'];
  
  // Each variant becomes a "footer" row
  const rows = variants.map((variant, index) => ({
    "#": index + 1,
    ...variant.table.totals
  }));

  // Grand total footer
  const grandTotals = {
    "Color": 'All Colors',
    "Size": 'All Sizes',
    "Units": variants.reduce((sum, variant) => sum + (variant.table.totals['Units'] || 0), 0),
    "Net": variants.reduce((sum, variant) => sum + (variant.table.totals['Net'] || 0), 0)
  };

  return {
    columnKeys,
    rows,
    totals: grandTotals,
    rowCount: rows.length,
    columnCount: columnKeys.length
  };
}

/**
 * Expanded view with Size-first: Show each size as a footer row with "All Colors"
 * First column shows Size, second column shows "All Colors"
 */
function createExpandedSizeFirstTable(variants) {
  const columnKeys = ['Size', 'Color', 'Units', 'Net']; // Size first, then Color

  // Collect all raw data and group by size
  const allRawData = [];
  variants.forEach(variant => {
    if (!variant?.table?.rows) return;
    
    variant.table.rows.forEach(row => {
      if (!row) return;
      
      allRawData.push({
        color: row.Color || row.color || 'Default',
        size: row.Size || row.size || 'One Size',
        units: Number(row.Units || row.units) || 0,
        net: Number(row.Net || row.net) || 0
      });
    });
  });

  // Group by size
  const sizeGroups = new Map();
  
  allRawData.forEach(item => {
    const sizeKey = item.size || 'One Size';
    
    if (!sizeGroups.has(sizeKey)) {
      sizeGroups.set(sizeKey, {
        size: sizeKey,
        totalUnits: 0,
        totalNet: 0
      });
    }
    
    const sizeGroup = sizeGroups.get(sizeKey);
    sizeGroup.totalUnits += item.units;
    sizeGroup.totalNet += item.net;
  });

  // Create footer rows: each size in first column, "All Colors" in second column
  const rows = Array.from(sizeGroups.values()).map((sizeGroup, index) => ({
    "#": index + 1,
    "Size": sizeGroup.size,        // First column: actual size (S, M, L, etc.)
    "Color": "All Colors",         // Second column: "All Colors" for each size
    "Units": sizeGroup.totalUnits,
    "Net": sizeGroup.totalNet
  }));

  // Grand totals
  const grandTotals = {
    "Size": 'All Sizes',          // Total row shows "All Sizes" in first column
    "Color": 'All Colors',        // Total row shows "All Colors" in second column
    "Units": Array.from(sizeGroups.values()).reduce((sum, group) => sum + group.totalUnits, 0),
    "Net": Array.from(sizeGroups.values()).reduce((sum, group) => sum + group.totalNet, 0)
  };

  return {
    columnKeys,
    rows,
    totals: grandTotals,
    rowCount: rows.length,
    columnCount: columnKeys.length
  };
}

/**
 * Get sortable columns for SortToolbar
 */
export function getSortableColumns() {
  return [
    { key: 'Color', label: 'color' },
    { key: 'Size', label: 'size' }
  ];
}

/**
 * Validate grouping configuration
 */
export function validateGroupingConfig(config) {
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  const required = ['id', 'groupBy', 'displayFields'];
  return required.every(field => config.hasOwnProperty(field));
}