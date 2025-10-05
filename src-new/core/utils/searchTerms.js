// Utility for managing search terms and product data
// Uses same logic as ProductSearch.jsx

/**
 * Normalize text for search comparison (same as ProductSearch)
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
  return String(text || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Search products using same logic as ProductSearch.jsx
 * @param {string} query - The search query
 * @param {Array} rawData - Array of line item data
 * @returns {Array} - Array of product objects with {title, count, score, items}
 */
export function searchProducts(query, rawData = []) {
  console.log('searchProducts called with:', { query, rawDataLength: rawData?.length });
  
  if (!query || query.trim().length < 2) {
    console.log('searchProducts: Query too short');
    return [];
  }
  
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    console.log('searchProducts: No raw data');
    return [];
  }
  
  const queryNorm = normalizeText(query);
  console.log('searchProducts: Normalized query:', queryNorm);
  const productMap = new Map(); // productName -> {count, score, items}
  
  rawData.forEach((row, index) => {
    const fullProductName = row["Product Name"] || row.product_name || '';
    if (!fullProductName) {
      if (index < 3) console.log('searchProducts: No product name for row', index, row);
      return;
    }
    
    // Extract base product name (remove variant suffix like " - Color - Size")
    const productBase = fullProductName.split(' - ')[0] || fullProductName;
    const productNorm = normalizeText(productBase);
    
    if (index < 3) {
      console.log('searchProducts: Processing row', index, {
        fullProductName,
        productBase,
        productNorm,
        queryNorm
      });
    }
    
    let score = 0;
    
    // Exact match gets highest score
    if (productNorm === queryNorm) {
      score = 1000;
    }
    // Starts with query gets high score  
    else if (productNorm.startsWith(queryNorm)) {
      score = 500;
    }
    // Contains all words but not exact/starts-with gets lower score
    else {
      const words = queryNorm.split(' ').filter(Boolean);
      let wordMatches = 0;
      for (const word of words) {
        if (productNorm.includes(word)) wordMatches++;
      }
      // Only include if ALL words match, prioritize shorter titles (more specific)
      if (wordMatches === words.length) {
        score = 100 - productNorm.length; // Shorter titles score higher
      }
    }
    
    if (score > 0) {
      const existing = productMap.get(productBase) || { count: 0, score: -Infinity, items: [] };
      productMap.set(productBase, {
        count: existing.count + 1,
        score: Math.max(existing.score, score),
        items: [...existing.items, row]
      });
    }
  });
  
  // Convert to array and sort by score/count
  const results = Array.from(productMap.entries())
    .map(([title, meta]) => ({ 
      title, 
      count: meta.count, 
      score: meta.score,
      items: meta.items // Keep reference to original line items
    }))
    .sort((a, b) => (b.score !== a.score) ? (b.score - a.score) : (b.count - a.count))
    .slice(0, 100);
    
  return results;
}

/**
 * Convert search results to table format (same as ProductSearch)
 * @param {Array} candidates - Search results
 * @param {Set} selectedTitles - Set of selected product titles
 * @returns {Object} - Table data object
 */
export function createSearchTable(candidates = [], selectedTitles = new Set()) {
  if (!candidates?.length) {
    return {
      columnKeys: ["Select", "Product Name", "Units"],
      displayLabels: ["", "Product Name", "Units"],
      rows: [],
      totals: {},
      rowCount: 0,
      columnCount: 3
    };
  }

  const rows = candidates.map((c, i) => ({
    "#": i + 1,
    "Select": selectedTitles.has(c.title),
    "Product Name": c.title,
    "Units": c.count
  }));

  return {
    columnKeys: ["Select", "Product Name", "Units"],
    displayLabels: ["", "Product Name", "Units"],
    rows,
    totals: { "Units": candidates.reduce((sum, c) => sum + c.count, 0) },
    rowCount: rows.length,
    columnCount: 3
  };
}

/**
 * Convert selected products to GroupTable data format
 * @param {Array} selectedProducts - Array of selected product objects
 * @returns {Object} - Table data for GroupTable
 */
export function createGroupTableData(selectedProducts = []) {
  if (!selectedProducts || selectedProducts.length === 0) {
    return null;
  }
  
  const rows = selectedProducts.flatMap(product => 
    product.items || [] // Use the actual line item data
  );
  
  return {
    columnKeys: ["Product Name", "Color", "Size", "Quantity Sold", "Product Net"],
    rows: rows,
    totals: {},
    rowCount: rows.length,
    columnCount: 5
  };
}