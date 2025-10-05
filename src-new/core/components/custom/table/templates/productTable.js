/**
 * Product Table Template
 *
 * Transforms line item data into product-focused table presentation
 * Uses dataConfig calculations for all aggregations
 */

import { calculateTotals, groupDataBy, sumField } from '../dataConfig.js';
import { DEFAULT_STYLES, DEFAULT_LAYOUT } from '../tableProps.js';
import { getViewModeColumns, getStandardColumnLabels, getTotalableColumns } from '../tableConfig.js';

/**
 * Transform functions for different view modes
 */
function transformSummaryView(rawData) {
  const productName = rawData[0]?.product_name || 'Unknown Product';
  const totalQuantity = sumField(rawData, 'quantity');
  const totalDiscountedPrice = rawData.reduce((sum, item) => {
    const price = parseFloat(item.discounted_price) || 0;
    const qty = parseFloat(item.quantity) || 0;
    return sum + (price * qty);
  }, 0);

  return [{
    'product_name': productName,
    'color': 'All Variants',
    'size': 'All Sizes',
    'quantity': totalQuantity,
    'discounted_price': totalDiscountedPrice,
    'line_items': rawData.length
  }];
}

function transformByColorView(rawData) {
  const colorGroups = new Map();

  rawData.forEach(item => {
    const color = item.color || 'Unknown';
    if (!colorGroups.has(color)) {
      colorGroups.set(color, []);
    }
    colorGroups.get(color).push(item);
  });

  return Array.from(colorGroups.entries()).map(([color, items]) => {
    const productName = items[0]?.product_name || 'Unknown';
    const totalQuantity = sumField(items, 'quantity');
    const totalDiscountedPrice = items.reduce((sum, item) => {
      const price = parseFloat(item.discounted_price) || 0;
      const qty = parseFloat(item.quantity) || 0;
      return sum + (price * qty);
    }, 0);

    return {
      'product_name': productName,
      'color': color,
      'size': '—',
      'quantity': totalQuantity,
      'discounted_price': totalDiscountedPrice,
      'line_items': items.length
    };
  });
}

function transformBySizeView(rawData) {
  const sizeGroups = new Map();

  rawData.forEach(item => {
    const size = item.size || 'Unknown';
    if (!sizeGroups.has(size)) {
      sizeGroups.set(size, []);
    }
    sizeGroups.get(size).push(item);
  });

  return Array.from(sizeGroups.entries()).map(([size, items]) => {
    const productName = items[0]?.product_name || 'Unknown';
    const totalQuantity = sumField(items, 'quantity');
    const totalDiscountedPrice = items.reduce((sum, item) => {
      const price = parseFloat(item.discounted_price) || 0;
      const qty = parseFloat(item.quantity) || 0;
      return sum + (price * qty);
    }, 0);

    return {
      'product_name': productName,
      'color': '—',
      'size': size,
      'quantity': totalQuantity,
      'discounted_price': totalDiscountedPrice,
      'line_items': items.length
    };
  });
}

function transformByVariantView(rawData) {
  const variantGroups = new Map();

  rawData.forEach(item => {
    const color = item.color || 'Unknown';
    const size = item.size || 'Unknown';
    const key = `${color}-${size}`;

    if (!variantGroups.has(key)) {
      variantGroups.set(key, []);
    }
    variantGroups.get(key).push(item);
  });

  return Array.from(variantGroups.entries()).map(([variant, items]) => {
    const [color, size] = variant.split('-');
    const productName = items[0]?.product_name || 'Unknown';
    const totalQuantity = sumField(items, 'quantity');
    const totalDiscountedPrice = items.reduce((sum, item) => {
      const price = parseFloat(item.discounted_price) || 0;
      const qty = parseFloat(item.quantity) || 0;
      return sum + (price * qty);
    }, 0);

    return {
      'product_name': productName,
      'color': color,
      'size': size,
      'quantity': totalQuantity,
      'discounted_price': totalDiscountedPrice,
      'line_items': items.length
    };
  });
}

export function productTable(rawData = [], options = {}) {
  const {
    // Layout dimensions - using DEFAULT_LAYOUT
    headerHeight = DEFAULT_LAYOUT.headerHeight,
    rowHeight = DEFAULT_LAYOUT.rowHeight,
    footerHeight = DEFAULT_LAYOUT.footerHeight,
    firstColWidth = DEFAULT_LAYOUT.firstColWidth,
    metricColWidth = DEFAULT_LAYOUT.metricColWidth,

    // View mode configuration
    viewMode = 'summary',  // 'summary' | 'by-color' | 'by-size' | 'by-variant'

    // Display mode for labels
    displayMode = 'short'  // 'default' | 'short' | 'verbose'
  } = options;

  // Get column configuration from tableConfig based on view mode
  const columnKeys = getViewModeColumns(viewMode);
  const columnLabels = getStandardColumnLabels(columnKeys, 'retail_line_items', displayMode);

  // Handle empty data
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return {
      rows: [],
      totals: {},
      columnKeys,
      columnLabels,
      styles: DEFAULT_STYLES,
      layout: {
        firstColWidth,
        metricColWidth,
        headerHeight,
        rowHeight,
        footerHeight
      }
    };
  }

  console.log('📊 productTable rawData sample:', rawData[0]);
  console.log('📊 productTable available fields:', Object.keys(rawData[0] || {}));
  console.log('📊 productTable total line items:', rawData.length);
  console.log('📊 productTable viewMode:', viewMode);

  // Dispatch to appropriate transform function based on viewMode
  const viewTransforms = {
    'summary': transformSummaryView,
    'by-color': transformByColorView,
    'by-size': transformBySizeView,
    'by-variant': transformByVariantView
  };

  const transform = viewTransforms[viewMode] || transformSummaryView;
  const rows = transform(rawData);

  console.log('📊 productTable generated rows:', rows.length);
  console.log('📊 productTable sample row:', rows[0]);

  // Calculate totals using dataConfig and tableConfig
  const totalableColumns = getTotalableColumns(columnKeys, 'retail_line_items');
  const totals = calculateTotals(rows, totalableColumns);

  // Add label for first column
  if (columnKeys.length > 0) {
    totals[columnKeys[0]] = 'Total';
  }

  return {
    rows,
    totals,
    columnKeys,
    columnLabels,
    styles: DEFAULT_STYLES,
    layout: {
      firstColWidth,
      metricColWidth,
      headerHeight,
      rowHeight,
      footerHeight
    }
  };
}

export default productTable;
