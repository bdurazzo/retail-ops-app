#!/usr/bin/env node
import fs from 'fs';
import Papa from 'papaparse';

// Load retail line items
const retailText = fs.readFileSync('/Users/benjamindurazzo/retail-ops-app/dist/data/retail/orders/2025/2025-06/line_items.csv', 'utf8');
const retailData = Papa.parse(retailText, { header: true }).data;

// Load catalog data  
const catalogText = fs.readFileSync('/Users/benjamindurazzo/retail-ops-app/public/data/newstore/catalog/2025/2025-09/2025-09-15_storefront-catalog-en-us.csv', 'utf8');
const catalogData = Papa.parse(catalogText, { header: true, delimiter: '\t' }).data;

// Extract unique products from retail data
const retailProducts = new Map();
for (const row of retailData) {
  if (!row.ax_item_number || !row.product_name) continue;
  const key = row.ax_item_number;
  if (!retailProducts.has(key)) {
    retailProducts.set(key, {
      ax_item_number: key,
      product_name: row.product_name,
      source: 'retail'
    });
  }
}

// Extract products from catalog data
const catalogProducts = new Map();
for (const row of catalogData) {
  if (!row.title) continue;
  
  // Parse external_identifiers JSON to get ax_item_number
  let axItemNumber = null;
  try {
    const identifiers = JSON.parse(row.external_identifiers || '[]');
    const axItem = identifiers.find(id => id.type === 'ax_item_number');
    axItemNumber = axItem?.value;
  } catch (e) {
    // Try extended_attributes as fallback
    try {
      const attributes = JSON.parse(row.extended_attributes || '[]');
      const axAttr = attributes.find(attr => attr.name === 'ax_item_number');
      axItemNumber = axAttr?.value;
    } catch (e2) {
      // Skip if can't parse either
      continue;
    }
  }
  
  if (!axItemNumber) continue;
  
  const key = axItemNumber;
  if (!catalogProducts.has(key)) {
    catalogProducts.set(key, {
      ax_item_number: key,
      product_name: row.title,
      source: 'catalog'
    });
  }
}

console.log('=== PRODUCT NAME COMPARISON ===');
console.log(`Retail products: ${retailProducts.size}`);
console.log(`Catalog products: ${catalogProducts.size}`);
console.log('');

// Compare products with same ax_item_number
const comparisons = [];
for (const [axNum, retailProduct] of retailProducts) {
  const catalogProduct = catalogProducts.get(axNum);
  if (catalogProduct) {
    const match = retailProduct.product_name === catalogProduct.product_name;
    comparisons.push({
      ax_item_number: axNum,
      retail_name: retailProduct.product_name,
      catalog_name: catalogProduct.product_name,
      names_match: match
    });
  } else {
    comparisons.push({
      ax_item_number: axNum,
      retail_name: retailProduct.product_name,
      catalog_name: 'NOT FOUND',
      names_match: false
    });
  }
}

// Show mismatches first
const mismatches = comparisons.filter(c => !c.names_match);
const matches = comparisons.filter(c => c.names_match);

console.log('=== NAME MISMATCHES ===');
for (const mismatch of mismatches.slice(0, 10)) {
  console.log(`AX: ${mismatch.ax_item_number}`);
  console.log(`  Retail:  "${mismatch.retail_name}"`);
  console.log(`  Catalog: "${mismatch.catalog_name}"`);
  console.log('');
}

console.log(`\nTotal mismatches: ${mismatches.length}/${comparisons.length}`);
console.log(`Total matches: ${matches.length}/${comparisons.length}`);

// Look specifically for cruiser products
console.log('\n=== CRUISER PRODUCTS ===');
const cruiserComparisons = comparisons.filter(c => 
  c.retail_name.toLowerCase().includes('cruiser') || 
  c.catalog_name.toLowerCase().includes('cruiser')
);

for (const cruiser of cruiserComparisons) {
  console.log(`AX: ${cruiser.ax_item_number}`);
  console.log(`  Retail:  "${cruiser.retail_name}"`);
  console.log(`  Catalog: "${cruiser.catalog_name}"`);
  console.log(`  Match: ${cruiser.names_match}`);
  console.log('');
}