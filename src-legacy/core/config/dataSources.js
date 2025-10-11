// src/core/config/dataSources.js [EXTEND]
// Add catalog configuration to your existing DATA_SOURCES

export const DATA_SOURCES = {
  // Switch active orders source: 'public' | 'retail'
  ordersActive: 'retail',

  // New scraper-backed retail orders source
  ordersRetail: {
    manifestUrl: "/data/retail/orders/index.json",
    baseDir: "/data/retail/orders",
    monthFilePatterns: [
      "${baseDir}/${yyyy}/${yyyy}-${mm}/line_items.csv",
    ],
  },

  ordersInStore: {
    manifestUrl: "/data/newstore/orders/index.json",
    baseDir: "/data/newstore/orders",
    monthFilePatterns: [
      "${baseDir}/${yyyy}/${yyyy}-${mm}/${yyyy}-${mm}_orders_in_store.csv",
    ],
  },
  
  // [NEW] Catalog configuration
  catalog: {
    manifestUrl: "/data/newstore/catalog/index.json",
    baseDir: "/data/newstore/catalog",
    currentFile: "${baseDir}/storefront-catalog-en-us.csv",
    testFile: "${baseDir}/test-catalog-sample.csv",  // [TEST ONLY]
    archivePattern: "${baseDir}/archive/${yyyy}-${mm}-storefront-catalog-en-us.csv",
    // Optional dev override to force a specific file (if present).
    // Set to null or remove once manifest or daily publishing is stable.
    devOverrideFile: "/data/newstore/catalog/2025/2025-09/2025-09-15_storefront-catalog-en-us.csv"
  }
};
