import React, { useState, useMemo, useEffect } from 'react';
import Table from '../../../components/Table.jsx';
import Toolbar from '../../../components/Toolbar.jsx';
import SortToolbar from '../SortToolbar.jsx';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { generateProductConfig, createGroupingConfig, detectBestGrouping, createCollapsedTable, createExpandedTable, getSortableColumns } from '../../config/dataConfig.js';

// TableGroup: Reusable component that generates grouped tables based on configuration
// Uses dataConfig.js for grouping logic and Table.jsx for display
export default function ProductGroup({ 
  table, 
  placeholderRows, 
  placeholderCols,
  groupBy = 'auto',
  productFilter = null, // Filter criteria from ProductSearch
  selectedProducts = [], // Currently selected products from filter
  onProductToggle = null, // Callback for product selection toggle
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
    console.log('🔍 ProductGroup: Processing table data:', table);
    console.log('🔍 ProductGroup: Product filter:', productFilter);
    
    if (!table?.rows?.length) {
      console.log('🔍 ProductGroup: No table data available');
      return { products: [] };
    }
    
    let filteredTable = table;
    
    // Apply product filter if provided
    if (productFilter?.ids && Array.isArray(productFilter.ids) && productFilter.ids.length > 0) {
      console.log('🔍 ProductGroup: Applying product filter for:', productFilter.ids);
      
      const filteredRows = table.rows.filter(row => {
        const fullProductName = row["Product Name"] || row.product_name || '';
        const productBase = fullProductName.split(' - ')[0] || fullProductName;
        
        // Check if this product matches any of the selected product names
        const matches = productFilter.ids.some(filterName => {
          const normalizedFilter = filterName.toLowerCase().trim();
          const normalizedProduct = productBase.toLowerCase().trim();
          return normalizedProduct === normalizedFilter;
        });
        
        return matches;
      });
      
      console.log(`🔍 ProductGroup: Product filter reduced ${table.rows.length} rows to ${filteredRows.length}`);
      
      filteredTable = {
        ...table,
        rows: filteredRows
      };
    }
    
    // Create grouping configuration
    const strategy = groupBy === 'auto' ? detectBestGrouping(filteredTable.rows) : groupBy;
    const groupingConfig = createGroupingConfig(strategy);
    
    const config = generateProductConfig(filteredTable, groupingConfig);
    console.log('🔍 ProductGroup: Generated product config:', config);
    
    return config;
  }, [table, groupBy, productFilter]);

  // Manage which products are expanded
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  // Manage sort column per product for collapsed view
  const [productSortColumns, setProductSortColumns] = useState(new Map()); // Map of productKey -> sortColumn

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

  // Helper functions for per-product sort management
  const getProductSortColumn = (productKey) => {
    return productSortColumns.get(productKey) || 'Color'; // Default to Color
  };

  const setProductSortColumn = (productKey, sortColumn) => {
    setProductSortColumns(prev => {
      const next = new Map(prev);
      next.set(productKey, sortColumn);
      return next;
    });
  };

  // Limit products for performance (show top 20 by default)
  const maxProducts = 20;
  const displayedProducts = productConfig.products.slice(0, maxProducts);
  const hasMoreProducts = productConfig.products.length > maxProducts;

  // Set initial expanded state when products change
  useEffect(() => {
    if (displayedProducts.length > 0) {
      const autoExpand = displayedProducts
        .slice(0, 3)
        .map(p => p.key);
      setExpandedProducts(new Set(autoExpand));
    }
  }, [displayedProducts.length]); // Only run when number of displayed products changes

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
      <div className="flex-none p-2 bg-gray-50 border-b border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-900">
            {displayedProducts.length} of {productConfig.products.length} products
            {hasMoreProducts && <span className="text-gray-500 ml-1">(showing top {maxProducts})</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const anyExpanded = displayedProducts.some(p => expandedProducts.has(p.key));
                if (anyExpanded) {
                  setExpandedProducts(new Set()); // Collapse all
                } else {
                  setExpandedProducts(new Set(displayedProducts.map(p => p.key))); // Expand all
                }
              }}
              className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded"
            >
              {displayedProducts.some(p => expandedProducts.has(p.key)) ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        </div>
      </div>

      {/* Product Tables */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1">
          {displayedProducts.map((product) => {
            const isExpanded = expandedProducts.has(product.key);
            
            const isProductSelected = selectedProducts.some(p => 
              (p.title || p.product_id || p.sku) === product.name
            );
            
            return (
              <ProductSection
                key={product.key}
                product={product}
                isExpanded={isExpanded}
                onToggle={() => toggleProduct(product.key)}
                sortColumn={getProductSortColumn(product.key)}
                onSortChange={(sortCol) => setProductSortColumn(product.key, sortCol)}
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
                isSelected={isProductSelected}
                onProductToggle={onProductToggle}
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
  sortColumn,
  onSortChange,
  placeholderRows, 
  placeholderCols,
  isSelected = false,
  onProductToggle = null,
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
        {product.name}
      </div>
    </div>
  );

  const rightContent = onProductToggle ? (
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => onProductToggle(product.name)}
      className="cursor-pointer"
      title={`${isSelected ? 'Unselect' : 'Select'} ${product.name}`}
    />
  ) : null;

  return (
    <div className="bg-white border" style={{ borderRadius: 0 }}>
      {/* Product Toolbar */}
      <Toolbar 
        leftContent={leftContent}
        centerContent={centerContent}
        centerJustify="start"
        rightContent={rightContent}
        height={8}
        borderWidth={1}
        shadowSize="xl"
        paddingX={2}
        centerPaddingX={2}
        rounded=""
      />
      
      {/* Variant Tables */}
      {isExpanded ? (
        // Expanded: Show SortToolbar + full table with all variant data rows
        <div className="bg-white">
          <SortToolbar
            availableColumns={getSortableColumns()}
            currentSortColumn={sortColumn}
            onSortChange={onSortChange}
          />
          <Table
            table={(() => {
              console.log('🔍 Creating expanded table for product:', product.name, 'variants:', product.variants, 'sortColumn:', sortColumn);
              const expandedTable = createCollapsedTable(product.variants, sortColumn);
              console.log('🔍 Expanded table result:', expandedTable);
              return expandedTable;
            })()}
            placeholderRows={0}
            placeholderCols={0}
            height="auto"
            firstColWidth={90}
            metricColWidth={90}
            headerHeight={28}
            rowHeight={28}
            footerHeight={28}
            containerBorder=""
            containerShadow=""
            containerRounded="rounded-none"
            containerClasses="w-full h-auto flex flex-col overflow-hidden rounded-none"
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
      ) : (
        // Collapsed: Show unified table with header + variant footers as rows (no SortToolbar)
        <div className="bg-white">
          <Table
            table={(() => {
              console.log('🔍 Creating collapsed table for product:', product.name, 'variants:', product.variants, 'sortColumn:', sortColumn);
              const collapsedTable = createExpandedTable(product.variants, sortColumn);
              console.log('🔍 Collapsed table result:', collapsedTable);
              return collapsedTable;
            })()}
            placeholderRows={0}
            placeholderCols={0}
            height="auto"
            firstColWidth={90}
            metricColWidth={90}
            headerHeight={28}
            rowHeight={0} // Hide body rows - show only header and footer
            footerHeight={28}
            containerBorder=""
            containerShadow=""
            containerRounded="rounded-none"
            containerClasses="w-full h-auto flex flex-col overflow-hidden rounded-none"
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
      )}
    </div>
  );
}