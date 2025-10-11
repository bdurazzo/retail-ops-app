import React, { useState, useMemo } from 'react';
import Table from '../tables/Table.jsx';
import Toolbar from '../../../../components/Toolbar.jsx';
import { IconTableDown, IconFoldUp, IconLayoutNavbarExpand, IconLayoutBottombarExpand, IconLayoutSidebarLeftExpand, IconLayoutSidebarLeftCollapse, IconLayoutNavbarCollapseFilled, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
// Attach rate now calculated via KpiService in metric adapter

// VariantGroup: Pure component that generates variant tables based on configuration
// Receives variant configuration and generates the appropriate number of tables with toolbars
export default function VariantGroup({ 
  table, 
  placeholderRows, 
  placeholderCols,
  groupBy = 'auto',
  // Style props for headers and footers
  headerClasses,
  footerClasses,
  variantSpacing,
  // Style props for all table sections
  a1Classes, // Header left (Product Name column header)
  a2Classes, // Body left (Product Name column cells)
  a3Classes, // Footer left (Total label)
  b1Classes, // Header right (Metric column headers)
  b2Classes, // Body right (Metric column cells)
  b3Classes, // Footer right (Metric totals)
  ...otherProps 
}) {
  // Process table data into product configuration (grouped by product name)
  const productConfig = useMemo(() => {
    console.log('🔍 VariantGroup: Processing table data:', table);
    if (!table?.rows?.length) {
      console.log('🔍 VariantGroup: No table data available');
      return { products: [] };
    }
    
    
    return generateProductConfig(table, groupBy);
  }, [table, groupBy]);

  // Manage which products are expanded
  const [expandedProducts, setExpandedProducts] = useState(() => {
    // Default to first 3 products expanded
    const autoExpand = productConfig.products
      .slice(0, 3)
      .map(p => p.key);
    
    return new Set(autoExpand);
  });

  const toggleProduct = (productKey) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productKey)) {
        next.delete(productKey);
      } else {
        next.add(productKey);
      }
      return next;
    });
  };

  // If no products detected, show message or placeholder
  if (!productConfig.products.length) {
    // If we have placeholder rows but no real data, show placeholder structure
    if (placeholderRows && placeholderRows > 0) {
      return (
        <div className="h-full flex flex-col overflow-hidden">
          <div className="flex-none p-2 bg-gray-50 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-900">
              Loading variants...
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {Array.from({ length: Math.min(3, placeholderRows) }).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded">
                  <div className="h-12 bg-gray-100 animate-pulse rounded-t"></div>
                  <div className="h-20 bg-gray-50 animate-pulse rounded-b"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded">
        <span className="text-gray-500">No variants detected in current data</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Global Controls */}
      <div className="flex-none p-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-900">
            {productConfig.products.length} products
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const allExpanded = productConfig.products.every(p => expandedProducts.has(p.key));
                if (allExpanded) {
                  setExpandedProducts(new Set()); // Collapse all
                } else {
                  setExpandedProducts(new Set(productConfig.products.map(p => p.key))); // Expand all
                }
              }}
              className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded"
            >
              {productConfig.products.every(p => expandedProducts.has(p.key)) ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        </div>
      </div>

      {/* Product Tables */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1">
          {productConfig.products.map((product) => {
            const isExpanded = expandedProducts.has(product.key);
            
            return (
              <ProductSection
                key={product.key}
                product={product}
                isExpanded={isExpanded}
                onToggle={() => toggleProduct(product.key)}
                placeholderRows={placeholderRows}
                placeholderCols={placeholderCols}
                headerClasses={headerClasses}
                footerClasses={footerClasses}
                variantSpacing={variantSpacing}
                a1Classes={a1Classes}
                a2Classes={a2Classes}
                a3Classes={a3Classes}
                b1Classes={b1Classes}
                b2Classes={b2Classes}
                b3Classes={b3Classes}
                {...otherProps}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ProductSection: Shows one toolbar per product name with variants stacked underneath
function ProductSection({ 
  product, 
  isExpanded, 
  onToggle, 
  placeholderRows, 
  placeholderCols,
  // Style customization props
  headerClasses = "bg-gradient-to-t from-gray-200 via-gray-50 to-gray-300",
  footerClasses = "bg-gradient-to-t from-gray-50 via-white to-gray-50",
  variantSpacing = "space-y-0",
  // Individual section styling
  a1Classes = "border-b border-gray-300",
  a2Classes = "",
  a3Classes = "border-t border-gray-300",
  b1Classes = "border border-gray-300",
  b2Classes,
  b3Classes = "border-t border-gray-300",
  ...otherProps 
}) {
  if (!product) return null;

  const leftContent = (
    <button
      onClick={onToggle}
      className="flex rounded hover:bg-gray-900 hover:text-white"
      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${product.name}`}
    >
      {isExpanded ? (
        <IconChevronDown size={18} stroke={1.5} />
      ) : (
        <IconChevronRight size={18} stroke={1.5} />
      )}
    </button>
  );

  const centerContent = (
    <div className="flex items-center justify-start">
      <div className="text-[13px] font-medium text-gray-900">
        {product.name} ({product.variants.length} colors)
      </div>
    </div>
  );

  return (
    <div className="bg-white border" style={{ borderRadius: 0 }}>
      {/* Product Toolbar */}
      <Toolbar 
        leftContent={leftContent}
        centerContent={centerContent}
        centerJustify="start"
        rightContent={null}
        height={8}
        borderWidth={1}
        shadowSize="xl"
        paddingX={2}
        centerPaddingX={2}
        rounded=""
      />
      
      {/* Variant Tables */}
      {isExpanded ? (
        // Expanded: Show each variant as full table (header + body + footer)
        <div className={variantSpacing}>
          {product.variants.map((variant) => (
            <div key={variant.key} className="bg-gray-50">
              <Table
                table={variant.table}
                placeholderRows={0}
                placeholderCols={0}
                height="auto"
                firstColWidth={90}
                metricColWidth={70}
                headerHeight={28}
                rowHeight={32}
                footerHeight={28}
                containerBorder="border-0"
                containerShadow=""
                containerRounded="rounded-none"
                containerClasses="w-full h-full border-0 flex flex-col overflow-hidden rounded-none"
                a1Rounded="rounded-none"
                a3Rounded="rounded-none"
                b1Rounded="rounded-none"
                b3Rounded="rounded-none"
                headerClasses={headerClasses}
                footerClasses={footerClasses}
                a1Classes={a1Classes}
                a2Classes={a2Classes}
                a3Classes={a3Classes}
                b1Classes={b1Classes}
                b2Classes={b2Classes}
                b3Classes={b3Classes}
                {...otherProps}
              />
            </div>
          ))}
        </div>
      ) : (
        // Collapsed: Show header once + stacked variant footers
        <div className="bg-white">
          {/* Single header */}
          {product.variants.length > 0 && (
            <Table
              table={product.variants[0].table}
              placeholderRows={0}
              placeholderCols={0}
              height="auto"
              firstColWidth={90}
              metricColWidth={90}
              headerHeight={28}
              rowHeight={0} // Hide body
              footerHeight={0} // Hide footer for header-only table
              containerBorder=""
              containerShadow=""
              containerRounded="rounded-none"
              containerClasses="w-full h-auto flex flex-col overflow-hidden rounded-none"
              a1Rounded="rounded-none"
              a3Rounded="rounded-none"
              b1Rounded="rounded-none"
              b3Rounded="rounded-none"
              headerClasses={headerClasses}
              a1Classes={a1Classes}
              a2Classes={a2Classes}
              a3Classes={a3Classes}
              b1Classes={b1Classes}
              b2Classes={b2Classes}
              b3Classes={b3Classes}
              {...otherProps}
            />
          )}
          
          {/* Stacked variant footers */}
          <div className={variantSpacing}>
            {product.variants.map((variant) => (
              <div key={variant.key} className="bg-white">
                <Table
                  table={variant.table}
                  placeholderRows={0}
                  placeholderCols={0}
                  height="auto"
                  firstColWidth={90}
                  metricColWidth={90}
                  headerHeight={0} // Hide header
                  rowHeight={0} // Hide body
                  footerHeight={28} // Show only footer
                  containerBorder=""
                  containerShadow=""
                  containerRounded="rounded-none"
                  containerClasses="w-full h-auto flex flex-col overflow-hidden rounded-none"
                  a1Rounded="rounded-none"
                  a3Rounded="rounded-none"
                  b1Rounded="rounded-none"
                  b3Rounded="rounded-none"
                  footerClasses={footerClasses}
                  a1Classes={a1Classes}
                  a2Classes={a2Classes}
                  a3Classes={a3Classes}
                  b1Classes={b1Classes}
                  b2Classes={b2Classes}
                  b3Classes={b3Classes}
                  {...otherProps}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Generate product configuration from table data
function generateProductConfig(table, groupBy) {
  const { rows = [] } = table;
  
  if (!rows.length) {
    return { products: [] };
  }

  // Auto-detect grouping strategy
  let groupingStrategy = groupBy;
  if (groupBy === 'auto') {
    groupingStrategy = detectBestGrouping(rows);
  }

  if (!groupingStrategy || groupingStrategy === 'none') {
    return { products: [] };
  }

  // First group by product name, then by color within each product
  const variantGroups = groupRowsByProductColor(rows, groupingStrategy);
  
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
        columnKeys: ['Color', 'Size', 'Units', 'Net', 'Attach Rate'],
        rows: transformRowsForVariantTable(group.rows, rows), // Pass all data for attach rate calculation
        totals: calculateVariantTotals(group.rows, rows), // Pass all data for attach rate calculation
        rowCount: group.rows.length,
        columnCount: 5
      }
    });
  });

  return { products: Array.from(productMap.values()) };
}

// Auto-detect the best grouping strategy based on data patterns
function detectBestGrouping(rows) {
  // Check if Product Name contains variant patterns (e.g., "Product - Color - Size")
  const productNames = rows.map(r => r["Product Name"] || '').filter(Boolean);
  
  // Look for consistent " - " patterns indicating variants
  const hasVariantPattern = productNames.some(name => 
    (name.match(/ - /g) || []).length >= 2
  );
  
  if (hasVariantPattern) {
    return 'product-color'; // Group by product and color, show size variations
  }
  
  return 'product-color'; // Default to product-color grouping
}

// Group rows by product and color for variant display  
function groupRowsByProductColor(rows) {
  const groups = new Map();
  
  
  rows.forEach((row, index) => {
    // Extract product name without variant info (remove " - Color - Size" suffix)
    const fullProductName = row["Product Name"] || '';
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
        upc: row["UPC"] || '',
        rows: []
      });
    }
    
    groups.get(groupKey).rows.push(row);
  });
  
  // Sort groups by total quantity/revenue (descending)
  return Array.from(groups.values()).sort((a, b) => {
    const aTotal = a.rows.reduce((sum, row) => sum + (Number(row["Quantity Sold"]) || 1), 0);
    const bTotal = b.rows.reduce((sum, row) => sum + (Number(row["Quantity Sold"]) || 1), 0);
    return bTotal - aTotal;
  });
}

// Transform rows to match variant table format: Color, Size, Units, Net
function transformRowsForVariantTable(rows, allData) {
  // Step 1: Find all orders that have multiple line items (attach behavior)
  // allData contains all rows to determine which orders had multiple items
  
  // Build map of orders that had multiple line items (attach orders)
  const attachOrders = new Set();
  
  allData.forEach(row => {
    const orderId = row["Order ID"];
    const lineNumber = Number(row["Line Number"] || row["line_number"] || row.line_number) || 1;
    
    if (orderId && lineNumber >= 2) {
      attachOrders.add(orderId);
    }
  });
  
  // Step 2: Group by size and sum quantities (color is already grouped at parent level)
  const sizeGroups = new Map();
  
  rows.forEach(row => {
    const color = row["Color"] || row.color || 'Default';
    const size = row["Size"] || row.size || 'One Size';
    const quantity = Number(row["Quantity Sold"] || row.quantity) || 1;
    const revenue = Number(row["Product Net"] || row.discounted_price) || 0;
    
    if (!sizeGroups.has(size)) {
      sizeGroups.set(size, {
        color: normalizeColorName(color),
        size: size,
        units: 0,
        net: 0,
        orderIds: new Set() // Track unique orders that bought this variant
      });
    }
    
    const group = sizeGroups.get(size);
    group.units += quantity;
    group.net += revenue;
    
    // Track order IDs for this variant
    const orderId = row["Order ID"];
    if (orderId) {
      group.orderIds.add(orderId);
    }
  });
  
  // Step 3: Calculate attach rate for each size
  return Array.from(sizeGroups.values()).map(group => {
    let attachRateValue = 0;
    
    if (group.orderIds && group.orderIds.size > 0) {
      // Count how many orders for this variant were also attach orders
      let attachCount = 0;
      group.orderIds.forEach(orderId => {
        if (attachOrders.has(orderId)) {
          attachCount++;
        }
      });
      
      const totalOrders = group.orderIds.size;
      attachRateValue = (attachCount / totalOrders) * 100;
      
    }
    
    // Create row object that maps to the column keys
    const rowData = {};
    rowData["Color"] = group.color;
    rowData["Size"] = group.size;
    rowData["Units"] = group.units;
    rowData["Net"] = group.net;
    rowData["Attach Rate"] = attachRateValue.toFixed(1) + '%';
    
    return rowData;
  });
}

// Normalize color names by adding spaces between words
function normalizeColorName(colorName) {
  if (!colorName) return '';
  
  // Add spaces before uppercase letters that follow lowercase letters
  // e.g., "LightBlue" -> "Light Blue", "NavyBlue" -> "Navy Blue"
  return colorName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

// Calculate totals for variant table
function calculateVariantTotals(rows, allData) {
  // Get the color from the first row's Color column (all rows in a variant should have the same color)
  const rawColorName = rows.length > 0 ? (rows[0].Color || rows[0].color || 'Default') : '';
  const normalizedColor = normalizeColorName(rawColorName);
  
  // Calculate overall attach rate for all rows in this variant using correct logic
  let attachRateValue = 0;
  try {
    // Step 1: Find all orders that have multiple line items (attach behavior)
    const attachOrders = new Set();
    allData.forEach(row => {
      const orderId = row["Order ID"];
      const lineNumber = Number(row["Line Number"] || row["line_number"] || row.line_number) || 1;
      
      if (orderId && lineNumber >= 2) {
        attachOrders.add(orderId);
      }
    });
    
    // Step 2: Find all orders for this variant and check if they were attach orders
    const variantOrderIds = new Set();
    rows.forEach(row => {
      const orderId = row["Order ID"];
      if (orderId) {
        variantOrderIds.add(orderId);
      }
    });
    
    // Step 3: Count how many variant orders were also attach orders
    let attachCount = 0;
    variantOrderIds.forEach(orderId => {
      if (attachOrders.has(orderId)) {
        attachCount++;
      }
    });
    
    if (variantOrderIds.size > 0) {
      attachRateValue = (attachCount / variantOrderIds.size) * 100;
    }
  } catch (error) {
    console.warn('Error calculating attach rate for totals:', error);
    attachRateValue = 0;
  }
  
  // Create totals object that maps to the column keys
  const totalsData = {};
  totalsData["Color"] = normalizedColor;
  totalsData["Size"] = 'All Sizes';
  totalsData["Units"] = rows.reduce((sum, row) => sum + (Number(row["Quantity Sold"]) || 1), 0);
  totalsData["Net"] = rows.reduce((sum, row) => sum + (Number(row["Product Net"]) || 0), 0);
  totalsData["Attach Rate"] = attachRateValue.toFixed(1) + '%';
  
  return totalsData;
}