// Maps a dimension id → key function used to group rows
// Uses the raw CSV headers "Product Name", "Color", "Size" for now.
// We can switch to normalized helpers from data/keys.js later.

export const dimensionKey = {
  product: (r) => String(r["Product Name"] ?? "").trim(),
  product_color: (r) => {
    const name = String(r["Product Name"] ?? "").trim();
    const color = String(r["Color"] ?? "").trim();
    return `${name}|${color}`;
  },
  product_size: (r) => {
    const name = String(r["Product Name"] ?? "").trim();
    const size = String(r["Size"] ?? "").trim();
    return `${name}|${size}`;
  },
  product_color_size: (r) => {
    const name = String(r["Product Name"] ?? "").trim();
    const color = String(r["Color"] ?? "").trim();
    const size = String(r["Size"] ?? "").trim();
    return `${name}|${color}|${size}`;
  },
};