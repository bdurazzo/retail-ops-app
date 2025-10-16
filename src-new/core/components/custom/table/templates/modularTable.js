/**
 * Modular Table Template
 *
 * Loads top products by revenue and displays in modular table format
 * Uses dataService for data loading and calculations for aggregations
 */

import { MODULE_STYLES, MODULE_LAYOUT } from '../tableProps.js';
import { loadAllTimeLineItemsData } from '../../../../services/dataService.js';
import { groupBy, sumField } from '../../../../calculations/index.js';
import { calculateTotals } from '../dataConfig.js';
import { getStandardColumnLabels, getTotalableColumns } from '../tableConfig.js';

export async function modularTable(rawData = [], options = {}) {
  const {
    headerHeight = MODULE_LAYOUT.headerHeight,
    rowHeight = MODULE_LAYOUT.rowHeight,
    footerHeight = MODULE_LAYOUT.footerHeight,
    firstColWidth = MODULE_LAYOUT.firstColWidth,
    metricColWidth = MODULE_LAYOUT.metricColWidth
  } = options;

  // Load all-time line items data
  console.log('modularTable: Loading all-time line items data');
  const allLineItems = await loadAllTimeLineItemsData();
  console.log('modularTable: Loaded', allLineItems.length, 'line items');

  
  // Group by product_name
  const productGroups = groupBy(allLineItems, 'product_name');
  console.log('modularTable: Grouped into', productGroups.size, 'products');

  // Calculate total revenue for each product
  const productRevenues = [];
  productGroups.forEach((items, productName) => {
    // Calculate total revenue: sum of (quantity * discounted_price)
    const totalRevenue = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.discounted_price) || 0;
      return sum + (qty * price);
    }, 0);

    // Calculate total quantity
    const totalQuantity = sumField(items, 'quantity');

    productRevenues.push({
      product_name: productName,
      quantity: totalQuantity,
      discounted_price: totalRevenue,
      upc: items[0]?.upc || '',
      sku: items[0]?.sku || ''
    });
  });

  console.log('modularTable: Calculated revenue for', productRevenues.length, 'products');

  // Sort by revenue descending and take top 10
  const topProducts = productRevenues
    .sort((a, b) => b.discounted_price - a.discounted_price)
    .slice(0, 10);

  console.log('modularTable: Top 10 products by revenue:', topProducts);
  

  // Define column configuration
  const columnKeys = ['product_name', 'quantity', 'discounted_price', 'upc', 'sku'];
  const columnLabels = getStandardColumnLabels(columnKeys, 'retail_line_items', 'short');

    console.log('modularTable: Column labels:', columnLabels);
  // Split into fixed (first column) and scrolling (rest)
  const fixedColumns = [columnKeys[0]];
  const scrollingColumns = columnKeys.slice(1);

  console.log('modularTable: scrollingColumns:', scrollingColumns);

  // Generate column widths
  const columnWidths = {};
  columnKeys.forEach((key, i) => {
    columnWidths[key] = i === 0 ? firstColWidth : metricColWidth;
  });

  // Build rows with _rowId
  const rows = topProducts.map((product, index) => ({
    _rowId: `product_${index}`,
    product_name: product.product_name,
    quantity: product.quantity,
    discounted_price: product.discounted_price,
    upc: product.upc,
    sku: product.sku
  }));

  console.log('modularTable: First row mapped:', rows[0]);

  // Calculate totals
  const totalableColumns = getTotalableColumns(columnKeys, 'retail_line_items');
  const totals = calculateTotals(rows, totalableColumns);
  totals[columnKeys[0]] = 'Total';

  console.log('modularTable: Generated', rows.length, 'rows with totals:', totals);
  console.log('modularTable: RETURNING scrollingColumns:', scrollingColumns);
  console.log('modularTable: RETURNING fixedColumns:', fixedColumns);

  return {
    rows,
    totals,
    columnKeys,
    columnLabels,
    columnWidths,
    fixedColumns,
    scrollingColumns,
    styles: MODULE_STYLES,
    layout: {
      firstColWidth,
      metricColWidth,
      headerHeight,
      rowHeight,
      footerHeight
    }
  };
}

export default modularTable;
