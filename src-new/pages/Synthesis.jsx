import React, { useState, useEffect, useMemo } from "react";
import ProductSearch from "../features/discovery/components/ProductSearch.jsx";
import { loadAllTimeLineItemsData, loadAllTimeProductData } from "../core/services/dataService.js";
import TableWorkspace from "../core/components/custom/table/TableWorkspace.jsx";

export function Synthesis() {
  // Load all-time line items data for search functionality
  const [allTimeData, setAllTimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  // Load all available line items data on component mount
  useEffect(() => {
    let isCancelled = false;
    
    async function loadSearchData() {
      try {
        setLoading(true);
        const data = await loadAllTimeLineItemsData();
        
        if (!isCancelled) {
          setAllTimeData(data);
        }
      } catch (err) {
        console.error('Synthesis: Failed to load all-time data:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }
    
    loadSearchData();
    
    return () => {
      isCancelled = true;
    };
  }, []);

  // Handle product selection from search - loads data through pipeline
  const handleProductsSelected = async (products) => {
    console.log('🔍 SYNTHESIS: Products selected:', products);
    console.log('🔍 SYNTHESIS: Product titles being requested:', products.map(p => p.title));

    // Load full product data for each selected product
    const productsWithData = await Promise.all(
      products.map(async (product) => {
        try {
          console.log(`🔍 SYNTHESIS: Loading data for EXACT product: "${product.title}"`);
          const productData = await loadAllTimeProductData([product.title]);
          console.log(`🔍 SYNTHESIS: Loaded ${productData.length} items for "${product.title}"`);
          return {
            title: product.title,
            items: productData
          };
        } catch (err) {
          console.error(`Failed to load data for ${product.title}:`, err);
          return {
            title: product.title,
            items: []
          };
        }
      })
    );

    setSelectedProducts(productsWithData);
  };

  return (
    <div className="h-[680px] flex flex-col">
      {/* Page Header */}
      <div className="flex-none px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900">Synthesis</h1>
        <p className="text-sm text-gray-600 mt-1">Search for products and explore with nested tables</p>
        {loading && <p className="text-xs text-blue-600 mt-1">Loading product data...</p>}
      </div>

      {/* ProductSearch Component */}
      <div className="flex-none px-4 mb-4">
        <div className="w-full">
          <ProductSearch
            rawData={allTimeData}
            onProductsSelected={handleProductsSelected}
            selectedProducts={selectedProducts}
            placeholder={loading ? "Loading product data..." : "Search products..."}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 px-4 pb-6">
        <div className="h-full bg-gray-50 rounded p-2">
          <div className="h-96">
            <TableWorkspace />
          </div>
        </div>
      </div>
    </div>
  );
}