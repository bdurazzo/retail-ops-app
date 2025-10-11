// src/features/analytics/adapters/productAdapter.js
// Applies product-level filters to order rows.
// Supported keys (all optional):
// - text: substring match against Product Name (case-insensitive)
// - skus: array of SKU strings (matches row.sku)
// - ids: array of names to match against Product Name (legacy title matching)
// - ax_item_numbers: array of ax_item_number strings for ID bridging (preferred)
// - colors: array of Color values
// - sizes: array of Size values
export function applyProduct(rows, product) {
  if (!product) return rows;
  const text = typeof product.text === 'string' ? product.text.trim() : '';
  const textLow = text ? text.toLowerCase() : '';
  const skus = Array.isArray(product.skus) ? product.skus.filter(Boolean) : null;
  const ids = Array.isArray(product.ids) ? product.ids.filter(Boolean) : null;
  const axItemNumbers = Array.isArray(product.ax_item_numbers) ? product.ax_item_numbers.filter(Boolean) : null;
  const colors = Array.isArray(product.colors) ? product.colors.filter(Boolean) : null;
  const sizes = Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : null;

  return rows.filter((r) => {
    const name = String(r["Product Name"] ?? '').toLowerCase();
    const sku = r.sku ?? null;
    // Get ax_item_number from retail data - this is the key field for ID bridging
    const rowAxItemNumber = r.ax_item_number ?? null;

    if (textLow && !name.includes(textLow)) return false;
    if (skus && skus.length > 0 && (!sku || !skus.includes(sku))) return false;
    
    // ID bridging: prefer ax_item_number matching over title matching for accuracy
    if (axItemNumbers && axItemNumbers.length > 0) {
      if (!rowAxItemNumber || !axItemNumbers.includes(rowAxItemNumber)) return false;
    } else if (ids && ids.length > 0) {
      // Fallback to title matching when ax_item_numbers not available
      if (!ids.includes(r["Product Name"])) return false;
    }
    
    if (colors && colors.length > 0 && !colors.includes(r.Color)) return false;
    if (sizes && sizes.length > 0 && !sizes.includes(r.Size)) return false;
    return true;
  });
}
