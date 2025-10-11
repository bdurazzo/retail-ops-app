export const COLUMN_CONFIGS = {
  // Base columns always shown
  base: ["Product Name"],
  
  // Conditional columns based on KPI type
  individual_items: ["UPC", "Color", "Size", "Order Date/Time"],
  grouped_products: ["Product Net"],
  aggregate_only: [],
  
  // KPI-specific column rules
  kpi_columns: {
    quantitySold: "Quantity Sold",
    quantitySoldByVariant: "Quantity Sold",
    totalRevenue: "Total Revenue",
    averageOrderValue: "Average Order Value",
    attachRate: "Attach Rate"
  }
};

export const KPI_COLUMN_RULES = {
  quantitySold: {
    show: ["Product Name", "UPC", "Quantity Sold", "Product Net"],
    hide: ["Color", "Size", "Order Date/Time"] // noise when grouped
  },
  
  quantitySoldByVariant: {
    show: ["Product Name", "UPC", "Quantity Sold", "Product Net"],
    hide: ["Color", "Size", "Order Date/Time"] // included in Product Name for variants
  },
  
  // Future KPIs
  totalRevenue: {
    show: ["Product Name", "UPC", "Product Net", "Total Revenue"],
    hide: ["Color", "Size", "Order Date/Time"]
  },
  
  averageOrderValue: {
    show: ["Product Name", "UPC", "Product Net"],
    hide: ["Color", "Size", "Product Net", "Order Date/Time"] // might need individual detail
  },
  
  attachRate: {
    show: ["Product Name", "UPC", "Color", "Size", "Attach Rate", "Product Net", "Order ID", "Line Number"],
    hide: ["Order Date/Time"] // keep variant fields, only hide date for cleaner display  
  }
};

export function getVisibleColumns(kpiResults) {
  const activeKPIs = Object.keys(kpiResults);
  
  if (activeKPIs.length === 0) {
    // No KPIs - show all base columns
    return ["Product Name", "UPC", "Color", "Size", "Order Date/Time", "Product Net"];
  }
  
  // Start with base columns
  let visibleColumns = new Set(COLUMN_CONFIGS.base);
  let hiddenColumns = new Set();
  
  // Apply rules for each active KPI
  activeKPIs.forEach(kpiName => {
    const rules = KPI_COLUMN_RULES[kpiName];
    if (rules) {
      rules.show.forEach(col => visibleColumns.add(col));
      rules.hide.forEach(col => hiddenColumns.add(col));
    }
    
    // Add KPI-specific columns
    if (COLUMN_CONFIGS.kpi_columns[kpiName]) {
      visibleColumns.add(COLUMN_CONFIGS.kpi_columns[kpiName]);
    }
  });
  
  // Remove hidden columns
  hiddenColumns.forEach(col => visibleColumns.delete(col));
  
  return Array.from(visibleColumns);
}