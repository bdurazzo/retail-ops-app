// Tiny helpers to group rows and compute measures for Top Performers.
// Updated to enforce orders-first rules: include shipped/delivered, subtract returns.

export function groupBy(rows, keyFn) {
  const map = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  }
  return map; // Map<key, row[]>
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function sum(rows, field) {
  let s = 0;
  for (const r of rows) s += num(r[field]);
  return s;
}

export function countDistinct(rows, field) {
  const set = new Set();
  for (const r of rows) set.add(r[field]);
  return set.size;
}

// Internal helpers for consistent rules across KPIs
function toLower(x) {
  return String(x ?? "").toLowerCase();
}

function isIncludedStatus(status) {
  const s = toLower(status);
  // Only count real fulfilled sales in base measures
  return s === "shipped" || s === "delivered";
}

function isReturnStatus(status) {
  const s = toLower(status);
  return s.includes("return") || s.includes("refund");
}

function sumQty(rows) {
  // Prefer explicit quantity fields; fallback to 1 per line item
  // Columns seen in data: "Item Qty.", "Quantity"
  let q = 0;
  for (const r of rows) {
    const q1 = num(r["Item Qty."]);
    const q2 = num(r["Quantity"]);
    q += q1 || q2 || 1;
  }
  return q;
}

function sumNet(rows) {
  // Net revenue from orders = sum(Product Net). Fallback to Product Subtotal if missing.
  return (
    sum(rows, "Product Net") ||
    sum(rows, "Product Subtotal")
  );
}

// Compute standard measures used by our KPIs
// metric: "aov" | "units_sold" | "net_revenue" | "attach_rate" (TBD)
export function computeMeasures(metric, bucketRows) {
  const rows = Array.isArray(bucketRows) ? bucketRows : [];

  // 1) Split rows by status according to locked rules
  const included = rows.filter(r => isIncludedStatus(r["Status"]));
  const returns  = rows.filter(r => isReturnStatus(r["Status"]));

  // 2) Base measures from included rows only
  const orders = countDistinct(included, "Order ID");
  const unitsBase = sumQty(included);
  const netBase = sumNet(included);

  // 3) Subtract returns measured from orders rows marked as returns
  const returnsUnits = sumQty(returns);
  const returnsNet = sumNet(returns);

  const units = Math.max(0, unitsBase - returnsUnits);
  const net_revenue = Math.max(0, netBase - returnsNet);

  // 4) Derived measures
  const aov = orders > 0 ? net_revenue / orders : 0;
  const attach_rate = orders > 0 ? units / orders : 0; // available when needed

  switch (metric) {
    case "aov":
    case "units_sold":
    case "net_revenue":
      return { orders, units, net_revenue, aov };
    case "attach_rate":
      return { orders, units, net_revenue, aov, attach_rate };
    default:
      return { orders, units, net_revenue, aov };
  }
}