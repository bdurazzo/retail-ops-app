// ---------------------------------------------------------
// SearchProductFilter.jsx – Logic-only search logic for product name matching
// ---------------------------------------------------------

// Define the key used in the registry and TabDropPanel
export const filterKey = "product";

// Logic-only matching function to find products by query string
export const matchProducts = (query, allProducts) => {
  if (!query) return [];
  return allProducts.filter((name) =>
    name.toLowerCase().includes(query.toLowerCase())
  );
};

// This filter does not render anything — all layout handled in TabDropPanel
export default function SearchProductFilter() {
  return null;
}