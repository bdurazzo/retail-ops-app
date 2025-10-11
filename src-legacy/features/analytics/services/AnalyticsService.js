// src/features/analytics/services/AnalyticsService.js
// Business logic layer: orchestrates repository + adapters.

import { OrdersRepository } from "../repositories/OrdersRepository.js";
import { applyTime } from "../adapters/time/timeAdapter.js";
import { applyProduct } from "../adapters/product/productAdapter.js";
import { applyMetric } from "../adapters/metric/metricAdapter.js";
import { productVerificationService } from "./ProductVerificationService.js";

export const AnalyticsService = {
  async getOrdersForQuery(query, verificationContext = null) {
    const { rows, present, missing } = await OrdersRepository.findByMonthRange(query.time);

    let scoped = applyTime(rows, query.time);
    
    // CHECKPOINT: Product verification filtering if context provided
    if (verificationContext) {
      console.log('🔍 AnalyticsService: Applying product verification checkpoint');
      const verificationResult = await productVerificationService.filterAndVerifyResults(
        scoped, // Post-time filtered results
        verificationContext.originalCatalogResults,
        verificationContext.userSelectedProducts,
        verificationContext.searchTerms
      );
      
      if (verificationResult.needsVerification) {
        // Return special response indicating verification needed
        return {
          needsVerification: true,
          discoveredProducts: verificationResult.discoveredProducts,
          approvedResults: verificationResult.approvedResults,
          rawData: verificationResult.approvedResults, // Same as approved for verification
          present,
          missing,
          verificationContext
        };
      } else {
        // No verification needed, use approved results
        scoped = verificationResult.approvedResults;
      }
    } else {
      // No verification context, apply normal product filtering
      scoped = applyProduct(scoped, query.product);
    }
    
    // Store pre-metric data for components that need ungrouped data (like VariantGroup)
    const preMetricRows = [...scoped]; // Clone before metric processing
    
    
    scoped = await applyMetric(scoped, query.metric, query);

    return { 
      rows: scoped, 
      rawData: preMetricRows, // Pre-grouping data for VariantGroup 
      present, 
      missing 
    };
  },

  // New method for handling user verification response
  async processVerificationAndContinue(verificationContext, discoveredProducts, userChoices, query, rememberChoices = true) {
    console.log('✅ AnalyticsService: Processing user verification');
    
    // Get additional results based on user choices
    const additionalResults = productVerificationService.processUserVerification(
      discoveredProducts, 
      userChoices,
      rememberChoices
    );
    
    // Combine approved results with user-approved additional results
    let scoped = [...verificationContext.approvedResults, ...additionalResults];
    console.log(`🔍 AnalyticsService: Combined results - approved: ${verificationContext.approvedResults.length}, additional: ${additionalResults.length}, total: ${scoped.length}`);
    
    // Store pre-metric data for components that need ungrouped data (like VariantGroup)
    const preMetricRows = [...scoped]; // Clone before metric processing
    
    
    // Skip product filtering since verification already handled product selection
    // Only apply metric filtering on the verified results
    scoped = await applyMetric(scoped, query.metric, query);
    console.log(`🔍 AnalyticsService: After metric filtering: ${scoped.length} rows`);
    
    return { 
      rows: scoped,
      rawData: preMetricRows, // Pre-grouping data for VariantGroup
      present: verificationContext.present, 
      missing: verificationContext.missing 
    };
  }
};