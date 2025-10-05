/**
 * Table Props and Utilities
 *
 * Central place for all table helper functions, defaults, and utilities
 * Templates can import what they need from here
 */

/**
 * Get alignment CSS classes
 */
export function getAlignmentClasses(alignment = 'center') {
  switch (alignment) {
    case 'left':
      return 'justify-start text-left';
    case 'right':
      return 'justify-end text-right';
    case 'center':
    default:
      return 'justify-center text-center';
  }
}

/**
 * Default layout dimensions
 */
export const DEFAULT_LAYOUT = {
  firstColWidth: 100,
  metricColWidth: 70,
  headerHeight: 35,
  rowHeight: 35,
  footerHeight: 35,
  placeholderRows: 3,
  placeholderCols: 4
};

/**
 * Default style classes for all sections
 */
export const DEFAULT_STYLES = {
  // Fixed column headers (A1, C1)
  a1: {
    base: "flex-none px-3 flex items-center text-xs shadow-lg shadow-gray-300 text-gray-600 font-semibold relative z-50 transition-colors",
    sortable: "hover:bg-gradient-to-b from-gray-200 via-gray-50 to-gray-100 hover:text-gray-900 cursor-pointer",
    nonSortable: "text-gray-200"
  },

  // Fixed column body (A2, C2)
  a2: {
    cell: "flex-none px-3 flex items-center text-sm border-r border-gray-100 relative z-10"
  },

  // Fixed column footer (A3, C3)
  a3: {
    cell: "flex items-center border-r border-gray-100 text-xs font-medium text-gray-700 h-full whitespace-nowrap tabular-nums relative z-50 bg-gradient-to-t from-gray-50 via-white to-gray-100"
  },

  // Scrolling headers (B1, D1)
  b1: {
    cell: "flex items-center border-r border-gray-100 px-3 text-xs text-gray-600 font-semibold relative z-50",
    sortable: "hover:bg-gradient-to-b from-gray-200 via-gray-50 to-gray-200 hover:text-gray-900 cursor-pointer"
  },

  // Scrolling body (B2, D2)
  b2: {
    cell: "flex items-center border-r border-gray-100 px-2 text-sm relative z-0"
  },

  // Scrolling footer (B3, D3)
  b3: {
    cell: "flex items-center border-r border-gray-100 text-xs font-medium text-gray-700 h-full whitespace-nowrap tabular-nums relative z-50 bg-gradient-to-t from-gray-50 via-white to-gray-100"
  },

  // CD table uses same styles
  c1: {
    base: "flex-none px-3 flex items-center text-xs shadow-lg shadow-gray-300 text-gray-600 font-semibold relative z-50 transition-colors",
    sortable: "hover:bg-gradient-to-b from-gray-200 via-gray-50 to-gray-200 hover:text-gray-900 cursor-pointer",
    nonSortable: "text-gray-200"
  },

  c2: {
    cell: "flex-none px-3 flex items-center text-[11px] border-r border-gray-100 relative z-10"
  },

  c3: {
    cell: "flex items-center border-r border-gray-100 text-xs font-medium text-gray-700 h-full whitespace-nowrap tabular-nums relative z-50 bg-gradient-to-t from-gray-50 via-white to-gray-100"
  },

  d1: {
    cell: "flex items-center border-r border-gray-100 px-3 text-xs text-gray-600 font-semibold relative z-50",
    sortable: "hover:bg-gradient-to-b from-gray-200 via-gray-50 to-gray-200 hover:text-gray-900 cursor-pointer"
  },

  d2: {
    cell: "flex items-center border-r border-gray-100 px-2 text-[11px] relative z-0"
  },

  d3: {
    cell: "flex items-center border-r border-gray-100 text-xs font-medium text-gray-700 h-full whitespace-nowrap tabular-nums relative z-50 bg-gradient-to-t from-gray-50 via-white to-gray-100"
  }
};

/**
 * Format numeric values for display
 */
export function formatValue(key, value) {
  if (value == null || value === "") return "";
  if (typeof value !== "number") return String(value);

  const k = String(key);
  if (k.includes("UPT") || k.includes("Attach Rate")) {
    return value.toFixed(2);
  }
  if (k.includes("Revenue") || k.includes("Net") || k.includes("AOV")) {
    return `$${Math.round(value).toLocaleString()}`;
  }
  return Math.round(value).toLocaleString();
}

/**
 * Default column labels mapping
 */
export const DEFAULT_COLUMN_LABELS = {
  product_name: "Product",
  upc: "UPC",
  color: "Color",
  size: "Size",
  quantity: "Units",
  discounted_price: "Revenue",
  unit_price: "Unit Price",
  line_discount: "Discount"
};
