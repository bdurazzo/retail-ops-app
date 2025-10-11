import { useEffect, useState, useRef } from "react";
import { AnalyticsService } from "../services/AnalyticsService";
import { normalizeQuery } from "../dtos/QueryDTO";
import { toTableDTO } from "../feeders/tableFeeder";

// Extract search terms from query for verification context
function extractSearchTermsFromQuery(query) {
  const terms = [];
  
  // Extract from product text search
  if (query.product?.text) {
    const words = query.product.text.toLowerCase().split(/\s+/).filter(Boolean);
    terms.push(...words);
  }
  
  // Extract from product IDs (these are catalog search terms)
  if (query.product?.ids && Array.isArray(query.product.ids)) {
    query.product.ids.forEach(id => {
      const words = id.toLowerCase().split(/\s+/).filter(Boolean);
      terms.push(...words);
    });
  }
  
  return [...new Set(terms)]; // Remove duplicates
}

// Build verification context from query and panel state
function buildVerificationContext(query, panelState) {
  console.log('🔧 buildVerificationContext called with:', { query, panelState });
  
  // Try to get selected products from panelState OR extract from query
  let userSelectedProducts = [];
  
  if (panelState?.selectedProducts && Array.isArray(panelState.selectedProducts)) {
    userSelectedProducts = panelState.selectedProducts;
    console.log('✅ Found selectedProducts in panelState:', userSelectedProducts);
  } else if (query.product?.ids && Array.isArray(query.product.ids)) {
    // Fallback: extract from query.product.ids 
    userSelectedProducts = query.product.ids.map(id => ({ title: id }));
    console.log('✅ Extracted selectedProducts from query.product.ids:', userSelectedProducts);
  } else {
    console.log('❌ No selectedProducts found in panelState or query');
    return null;
  }
  
  // For now, we'll need to reconstruct original catalog results from session storage
  // In a real implementation, this should be passed through from ProductSearch
  let originalCatalogResults = [];
  try {
    const catalogCandidates = sessionStorage.getItem('productSearchCandidates');
    if (catalogCandidates) {
      const candidates = JSON.parse(catalogCandidates);
      originalCatalogResults = candidates.map(c => ({ title: c.title }));
    }
  } catch (e) {
    console.warn('Could not load catalog candidates for verification:', e);
  }
  
  const searchTerms = extractSearchTermsFromQuery(query);
  
  if (originalCatalogResults.length === 0 || searchTerms.length === 0) {
    return null; // No verification context available
  }
  
  return {
    originalCatalogResults,
    userSelectedProducts,
    searchTerms
  };
}

export function useAnalyticsQueryWithVerification(inputQuery, panelState = null) {
  const [state, setState] = useState({ 
    table: null,
    rawData: null,
    loading: false, 
    error: null, 
    meta: null,
    // Verification state
    needsVerification: false,
    discoveredProducts: [],
    verificationContext: null
  });
  
  
  const currentRequestRef = useRef(null);

  useEffect(() => {
    const q = normalizeQuery(inputQuery);
    if (!q.time) {
      setState({ 
        table: null,
        rawData: null,
        loading: false, 
        error: null, 
        meta: null,
        needsVerification: false,
        discoveredProducts: [],
        verificationContext: null
      });
      return;
    }

    // Cancel any previous request
    if (currentRequestRef.current) {
      currentRequestRef.current.cancelled = true;
    }

    const requestContext = { cancelled: false };
    currentRequestRef.current = requestContext;

    setState(prev => ({ 
      ...prev,
      loading: true, 
      error: null,
      needsVerification: false,
      discoveredProducts: []
    }));

    // Always enable verification for product searches that have text or selections
    const hasProductSearch = q.product && (q.product.text || q.product.ids?.length > 0 || panelState?.selectedProducts?.length > 0);
    const verificationContext = hasProductSearch ? {
      originalCatalogResults: panelState?.selectedProducts || [],
      userSelectedProducts: panelState?.selectedProducts || [],
      searchTerms: q.product?.text ? q.product.text.split(/\s+/).filter(Boolean) : []
    } : null;
    
    console.log('🔍 useAnalyticsQueryWithVerification: Built context:', verificationContext);

    AnalyticsService.getOrdersForQuery(q, verificationContext)
      .then((res) => {
        if (requestContext.cancelled) return;
        
        if (res.needsVerification) {
          // Show verification popup
          console.log('⚠️ useAnalyticsQueryWithVerification: Verification needed');
          setState(prev => ({
            ...prev,
            loading: false,
            needsVerification: true,
            discoveredProducts: res.discoveredProducts,
            verificationContext: res
          }));
        } else {
          // Normal flow - display table
          const table = toTableDTO(res.rows);
          setState(prev => ({
            ...prev,
            table, 
            rawData: res.rawData || res.rows, // Use pre-grouping raw data if available
            loading: false, 
            meta: { missing: res.missing },
            needsVerification: false,
            discoveredProducts: [],
            verificationContext: null
          }));
        }
      })
      .catch((err) => {
        if (requestContext.cancelled) return;
        console.error('🚨 useAnalyticsQueryWithVerification: Error:', err);
        setState(prev => ({
          ...prev,
          table: null, 
          loading: false, 
          error: err, 
          meta: null,
          needsVerification: false,
          discoveredProducts: [],
          verificationContext: null
        }));
      });

    return () => { 
      requestContext.cancelled = true; 
    };
  }, [JSON.stringify(inputQuery), JSON.stringify(panelState?.selectedProducts)]);

  // Method to handle user verification response
  const processVerification = async (userChoices, rememberChoices = true) => {
    if (!state.verificationContext) {
      console.error('No verification context available');
      return;
    }

    console.log('✅ Processing user verification:', { userChoices, rememberChoices });
    
    setState(prev => ({ ...prev, loading: true, needsVerification: false }));

    try {
      const q = normalizeQuery(inputQuery);
      const res = await AnalyticsService.processVerificationAndContinue(
        state.verificationContext,
        state.discoveredProducts,
        userChoices,
        q,
        rememberChoices
      );

      const table = toTableDTO(res.rows);
      setState(prev => ({
        ...prev,
        table,
        rawData: res.rawData || res.rows, // Use pre-grouping raw data if available
        loading: false,
        meta: { missing: res.missing },
        verificationContext: null,
        discoveredProducts: []
      }));
    } catch (err) {
      console.error('🚨 Error processing verification:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err,
        verificationContext: null,
        discoveredProducts: []
      }));
    }
  };

  // Method to cancel verification and go back
  const cancelVerification = () => {
    setState(prev => ({
      ...prev,
      needsVerification: false,
      discoveredProducts: [],
      verificationContext: null
    }));
  };

  return {
    ...state,
    processVerification,
    cancelVerification
  };
}