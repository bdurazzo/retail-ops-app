// ProductVerificationService.js
// Handles checkpoint filtering and user verification for discovered products

export class ProductVerificationService {
  constructor() {
    // Cache user decisions for discovered products
    this.userDecisions = new Map(); // productName -> boolean
    this.loadCachedDecisions();
  }

  /**
   * Main checkpoint function called after orders repository search
   * @param {Array} orderResults - Raw results from orders repository
   * @param {Array} originalCatalogResults - Products found in initial catalog search
   * @param {Array} userSelectedProducts - Products user checked in ProductSearch
   * @param {Array} searchTerms - Original search terms used
   * @returns {Object} { approvedResults, discoveredProducts, needsVerification }
   */
  async filterAndVerifyResults(orderResults, originalCatalogResults, userSelectedProducts, searchTerms) {
    console.log('🔍 ProductVerification: Starting checkpoint filtering');
    console.log('  - Order results count:', orderResults.length);
    console.log('  - Original catalog results:', originalCatalogResults.map(p => p.title || p.name));
    console.log('  - User selected:', userSelectedProducts.map(p => p.title || p.name));
    console.log('  - Search terms:', searchTerms);

    // Group order results by product name
    const orderProductGroups = this.groupOrdersByProductName(orderResults);
    const orderProductNames = Array.from(orderProductGroups.keys());
    
    // Create lookup sets for fast checking
    const catalogProductNames = new Set(originalCatalogResults.map(p => p.title || p.name));
    const userSelectedNames = new Set(userSelectedProducts.map(p => p.title || p.name));
    
    console.log('  - Order product names found:', orderProductNames);
    console.log('  - Catalog product names:', Array.from(catalogProductNames));
    console.log('  - User selected names:', Array.from(userSelectedNames));

    const approvedResults = [];
    const discoveredProducts = [];

    for (const productName of orderProductNames) {
      const productOrders = orderProductGroups.get(productName);
      
      // Check if this product contains all search terms
      const containsAllTerms = this.containsAllSearchTerms(productName, searchTerms);
      
      if (!containsAllTerms) {
        // Product doesn't match search criteria, skip
        console.log(`  - Skipping "${productName}" (doesn't contain all search terms)`);
        continue;
      }

      if (userSelectedNames.has(productName) || userSelectedNames.size === 0) {
        // User explicitly selected this product OR no specific selections made - include
        console.log(`  - ✅ Including "${productName}" (selected or no filter)`);
        approvedResults.push(...productOrders);
      } 
      else if (catalogProductNames.has(productName)) {
        // Product was in catalog but user did NOT select it - filter out
        console.log(`  - ❌ Filtering out "${productName}" (was in catalog but not selected)`);
        // Do not include in results
      }
      else {
        // EXCEPTION: Product found in orders but was NOT in original catalog
        console.log(`  - ⚠️ Discovered "${productName}" (not in catalog, needs verification)`);
        
        // ALWAYS add to verification popup - no caching, verify every single time
        console.log(`  - 🆕 Adding "${productName}" to verification popup`);
        discoveredProducts.push({
          name: productName,
          orderCount: productOrders.length,
          totalQuantity: productOrders.reduce((sum, order) => sum + (Number(order["Quantity Sold"]) || 1), 0),
          orders: productOrders
        });
      }
    }

    // ALWAYS show verification popup when there are discovered products
    const needsVerification = discoveredProducts.length > 0;
    
    console.log('🔍 ProductVerification: Checkpoint complete');
    console.log('  - Approved results:', approvedResults.length);
    console.log('  - Discovered products needing verification:', discoveredProducts.length);
    console.log('  - Needs verification popup:', needsVerification);

    return {
      approvedResults,
      discoveredProducts,
      needsVerification
    };
  }

  /**
   * Process user verification choices from popup
   * @param {Array} discoveredProducts - Products that need verification 
   * @param {Object} userChoices - Map of productName -> boolean (approved/rejected)
   * @param {boolean} rememberChoices - Whether to cache decisions for future searches
   * @returns {Array} Additional results to include based on user choices
   */
  processUserVerification(discoveredProducts, userChoices, rememberChoices = true) {
    console.log('✅ ProductVerification: Processing user choices (no caching)', { userChoices });
    
    const additionalResults = [];
    
    for (const product of discoveredProducts) {
      const approved = userChoices[product.name] || false;
      
      if (approved) {
        console.log(`  - ✅ User approved "${product.name}", adding ${product.orders.length} orders`);
        additionalResults.push(...product.orders);
      } else {
        console.log(`  - ❌ User rejected "${product.name}"`);
      }
    }
    
    return additionalResults;
  }

  /**
   * Group order results by product name for easier processing
   */
  groupOrdersByProductName(orderResults) {
    const groups = new Map();
    
    for (const order of orderResults) {
      const productName = order["Product Name"] || '';
      if (!productName) continue;
      
      if (!groups.has(productName)) {
        groups.set(productName, []);
      }
      groups.get(productName).push(order);
    }
    
    return groups;
  }

  /**
   * Check if product name contains all search terms (case-insensitive)
   */
  containsAllSearchTerms(productName, searchTerms) {
    if (!searchTerms || !searchTerms.length) return true;
    
    const normalizedName = productName.toLowerCase();
    return searchTerms.every(term => normalizedName.includes(term.toLowerCase()));
  }

  /**
   * Load cached user decisions from sessionStorage
   */
  loadCachedDecisions() {
    try {
      const cached = sessionStorage.getItem('productVerificationDecisions');
      if (cached) {
        const decisions = JSON.parse(cached);
        this.userDecisions = new Map(Object.entries(decisions));
        console.log('📋 Loaded cached product decisions:', decisions);
      }
    } catch (e) {
      console.warn('Failed to load cached product decisions:', e);
    }
  }

  /**
   * Save user decisions to sessionStorage for future use
   */
  saveCachedDecisions() {
    try {
      const decisions = Object.fromEntries(this.userDecisions);
      sessionStorage.setItem('productVerificationDecisions', JSON.stringify(decisions));
      console.log('💾 Saved product decisions to cache:', decisions);
    } catch (e) {
      console.warn('Failed to save product decisions:', e);
    }
  }

  /**
   * Clear cached decisions (for testing or reset)
   */
  clearCachedDecisions() {
    this.userDecisions.clear();
    try {
      sessionStorage.removeItem('productVerificationDecisions');
      console.log('🗑️ Cleared cached product decisions');
    } catch (e) {
      console.warn('Failed to clear cached decisions:', e);
    }
  }
}

// Export singleton instance
export const productVerificationService = new ProductVerificationService();

// Debug helper: expose cache clearing to window for testing
if (typeof window !== 'undefined') {
  window.clearProductVerificationCache = () => {
    console.log('🔍 Cache before clearing:', sessionStorage.getItem('productVerificationDecisions'));
    productVerificationService.clearCachedDecisions();
    console.log('🔍 Cache after clearing:', sessionStorage.getItem('productVerificationDecisions'));
    console.log('✅ Product verification cache cleared');
  };
  
  window.checkProductVerificationCache = () => {
    console.log('🔍 Current cache:', sessionStorage.getItem('productVerificationDecisions'));
    console.log('🔍 Service cache:', Object.fromEntries(productVerificationService.userDecisions));
  };
  
  // Keyboard shortcut: Ctrl+Shift+P to clear cache
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      window.clearProductVerificationCache();
    }
  });
}