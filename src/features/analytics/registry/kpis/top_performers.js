// Single-file Top Performers program generator
// --------------------------------------------
// Produces 16 KPI program objects (4 dimensions × 4 metrics) without duplicating files.
// No JSX, no UI changes, no data logic here — just config objects your registry reads.

const DIMENSIONS = [
  { key: "product",             scope: "both", suffix: "prod" },
  { key: "product_color",       scope: "full", suffix: "prod_color" },
  { key: "product_size",        scope: "full", suffix: "prod_size" },
  { key: "product_color_size",  scope: "full", suffix: "prod_color_size" },
];

// Column presets per metric (edit here once, all 4 dimensions inherit)
const COLUMN_PRESETS = {
  units_sold: {
    selectColumns: ["Product Name","Orders","Units","Net Revenue","AOV"],
    // keep headers plain; we render $ in cells (TableBody/Footer)
    rename: { "Net Revenue": "Net Revenue", "AOV": "AOV" },
    numericKeys: ["Orders","Units","Net Revenue","AOV"],
    sortBy: { key: "Units", dir: "desc" },
    limit: 50,
    format: {
      currencyKeys: ["Net Revenue","AOV"], // value-level formatting only
      integerKeys: ["Orders","Units"],
      emptyDisplay: "—",
    },
    totals: {
      sumKeys: ["Orders","Units","Net Revenue"],
      // Weighted AOV total = sum(Net Revenue) / sum(Orders)
      weighted: { AOV: { numer: "Net Revenue", denom: "Orders" } },
    },
  },
  net_revenue: {
    selectColumns: ["Product Name","Orders","Units","Net Revenue","AOV"],
    rename: { "Net Revenue": "Net Revenue", "AOV": "AOV" },
    numericKeys: ["Orders","Units","Net Revenue","AOV"],
    sortBy: { key: "Net Revenue", dir: "desc" },
    limit: 50,
    format: {
      currencyKeys: ["Net Revenue","AOV"],
      integerKeys: ["Orders","Units"],
      emptyDisplay: "—",
    },
    totals: {
      sumKeys: ["Orders","Units","Net Revenue"],
      weighted: { AOV: { numer: "Net Revenue", denom: "Orders" } },
    },
  },
  aov: {
    selectColumns: ["Product Name","Orders","Units","Net Revenue","AOV"],
    rename: { "Net Revenue": "Net Revenue", "AOV": "AOV" },
    numericKeys: ["Orders","Units","Net Revenue","AOV"],
    sortBy: { key: "AOV", dir: "desc" },
    limit: 50,
    format: {
      currencyKeys: ["Net Revenue","AOV"],
      integerKeys: ["Orders","Units"],
      emptyDisplay: "—",
    },
    totals: {
      sumKeys: ["Orders","Units","Net Revenue"],
      weighted: { AOV: { numer: "Net Revenue", denom: "Orders" } },
    },
  },
  attach_rate: {
    // attach rate visible alongside sales context
    selectColumns: ["Product Name","Orders","Units","Attach Rate","Net Revenue","AOV"],
    rename: { "Net Revenue": "Net Revenue", "AOV": "AOV" },
    numericKeys: ["Orders","Units","Attach Rate","Net Revenue","AOV"],
    sortBy: { key: "Attach Rate", dir: "desc" },
    limit: 50,
    format: {
      currencyKeys: ["Net Revenue","AOV"],
      integerKeys: ["Orders","Units"],
      emptyDisplay: "—",
    },
    totals: {
      sumKeys: ["Orders","Units","Net Revenue"],
      weighted: { AOV: { numer: "Net Revenue", denom: "Orders" } },
    },
  },
};

// Build one config (IDs match your existing naming)
function makeProgram(metric, dim) {
  return {
    id: `top_${metric}_${dim.suffix}`,   // e.g., top_units_sold_prod
    family: "top_performers",
    metric,                              // units_sold | net_revenue | aov | attach_rate
    dimension: dim.key,                  // product | product_color | product_size | product_color_size
    scope: dim.scope,                    // "both" for product; "full" for color/size variants
    grain: (metric === "units_sold" || metric === "net_revenue") ? "line_item" : "order",
    sources: { orders: true },           // orders = source of truth
    columns: COLUMN_PRESETS[metric],     // single source for columns/sort/totals
    version: 1,
  };
}

// Export all 16 programs as a single array default export
const metrics = ["units_sold","net_revenue","aov","attach_rate"];
const programs = metrics.flatMap(m => DIMENSIONS.map(d => makeProgram(m, d)));

export default programs;