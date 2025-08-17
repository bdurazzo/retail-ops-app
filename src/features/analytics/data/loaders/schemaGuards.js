// 📄 data/loaders/schemaGuards.js
// ROLE: Normalize rows so missing fields won’t crash downstream code.

const EXPECTED = [
  "Order ID","Channel","Status","Order Date/Time","Timezone","Product Name",
  "Color","Size","Product Net","Product Subtotal","Currency"
];

export function normalizeOrderRow(row) {
  const out = { ...row };
  for (const k of EXPECTED) if (!(k in out)) out[k] = "";
  return out;
}

// Quick date tests without heavy parsing:
export function matchesExactDay(row, yyyyMmDd) {
  return String(row["Order Date/Time"] || "").startsWith(yyyyMmDd);
}
export function matchesDatePrefix(row, prefix) {
  return String(row["Order Date/Time"] || "").startsWith(prefix);
}