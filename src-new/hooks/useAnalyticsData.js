// React hook for loading analytics data
// Replaces the mock useAnalyticsQueryWithVerification with real data

import { useState, useEffect } from 'react';
import { loadAnalyticsData } from '../core/services/dataService.js';

/**
 * React hook for loading and managing analytics data
 * 
 * @param {Object} query - Query parameters (timeRange, scope, etc.)
 * @param {Object} panelState - Panel state for context
 * @param {string} currentView - Current view type (orders, line_items, grouped, chart)
 * @returns {Object} - Data state matching the original mock interface
 */
export function useAnalyticsData(query = {}, panelState = {}, currentView = 'orders') {
  const [state, setState] = useState({
    table: null,
    rawData: null,
    loading: true,
    error: null,
    meta: null,
    needsVerification: false,
    discoveredProducts: [],
    processVerification: () => {},
    cancelVerification: () => {}
  });

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      console.log('useAnalyticsData loadData triggered with query:', query);
      console.log('useAnalyticsData currentView:', currentView);
      
      // Remove the stupid blocking validation - let the data service handle it

      // Set loading state
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Load data using our data service
        const result = await loadAnalyticsData(query, panelState, currentView);
        
        // Only update state if the effect hasn't been cancelled
        if (!isCancelled) {
          setState(prev => ({
            ...prev,
            ...result,
            loading: false
          }));
        }
      } catch (error) {
        if (!isCancelled) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error.message,
            table: null,
            rawData: null
          }));
        }
      }
    }

    loadData();

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [JSON.stringify(query), JSON.stringify(panelState), currentView]); // Re-run when query, panelState, or currentView changes

  return state;
}

// For backward compatibility, export with the original name
export { useAnalyticsData as useAnalyticsQueryWithVerification };