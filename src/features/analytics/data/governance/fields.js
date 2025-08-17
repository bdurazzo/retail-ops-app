// Canonical field names used everywhere AFTER normalization.
// UI labels stay in KPI presets (columns.rename). These keys are internal.
export const FIELDS = {
  ORDER_ID:       "order_id",
  STATUS:         "status",
  PRODUCT_NAME:   "product_name",
  COLOR:          "color",
  SIZE:           "size",
  QTY:            "qty",
  NET:            "net",          // line net revenue
};

// Aliases seen in your CSV exports (add as needed).
const ALIASES = {
  [FIELDS.ORDER_ID]:     ["Order ID", "OrderId", "order_id", "ORDER_ID"],
  [FIELDS.STATUS]:       ["Status", "Order Status", "Line Status"],
  [FIELDS.PRODUCT_NAME]: ["Product Name", "Item Name", "Name", "Product"],
  [FIELDS.COLOR]:        ["Color", "variation_color_value", "Variant Color"],
  [FIELDS.SIZE]:         ["Size", "variation_size_value", "Variant Size"],
  [FIELDS.QTY]:          ["Item Qty.", "Quantity", "Item Quantity", "Qty", "QTY"],
  [FIELDS.NET]:          ["Product Net", "Line Net", "Net", "Net Amount", "Net ($)"],
};

// util: numeric parsing for money/qty
function toNumber(v) {
  if (v === "" || v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// util: pick the first present alias
function pick(row, key) {
  if (row[key] !== undefined) return row[key];
  for (const a of ALIASES[key] || []) {
    if (row[a] !== undefined) return row[a];
  }
  return undefined;
}

// Normalize ONE raw CSV row into canonical keys.
export function normalizeRow(raw) {
  const norm = {};
  norm[FIELDS.ORDER_ID]     = String(pick(raw, FIELDS.ORDER_ID) ?? "").trim();
  norm[FIELDS.STATUS]       = String(pick(raw, FIELDS.STATUS) ?? "").trim();
  norm[FIELDS.PRODUCT_NAME] = String(pick(raw, FIELDS.PRODUCT_NAME) ?? "").trim();
  norm[FIELDS.COLOR]        = String(pick(raw, FIELDS.COLOR) ?? "").trim();
  norm[FIELDS.SIZE]         = String(pick(raw, FIELDS.SIZE) ?? "").trim();

  const qty = pick(raw, FIELDS.QTY);
  const qn  = toNumber(qty);
  norm[FIELDS.QTY]          = qn > 0 ? qn : 1;  // blank/0 → treat as 1 line item

  const net = pick(raw, FIELDS.NET);
  norm[FIELDS.NET]          = toNumber(net);

  return norm;
}

// Normalize MANY rows at once.
export function normalizeRows(rows) {
  return (rows || []).map(normalizeRow);
}