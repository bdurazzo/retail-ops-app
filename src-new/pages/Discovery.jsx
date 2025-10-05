import React, { useState, useEffect, useMemo } from "react";
import ProductSearch from "../features/discovery/components/ProductSearch.jsx";
import { loadAllTimeLineItemsData } from "../core/services/dataService.js";
import GroupTable from "../core/components/visualization/GroupTable.jsx";

export function Discovery() {
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
        console.error('Discovery: Failed to load all-time data:', err);
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
  
  // Sample data for testing if real data isn't available
  const sampleData = [
    { "Product Name": "Classic T-Shirt - Black - S", "Color": "Black", "Size": "S", "Quantity Sold": 15, "Product Net": 25 },
    { "Product Name": "Classic T-Shirt - Black - M", "Color": "Black", "Size": "M", "Quantity Sold": 20, "Product Net": 25 },
    { "Product Name": "Premium Hoodie - Gray - L", "Color": "Gray", "Size": "L", "Quantity Sold": 8, "Product Net": 75 },
    { "Product Name": "Denim Jacket - Blue - M", "Color": "Blue", "Size": "M", "Quantity Sold": 5, "Product Net": 95 },
    { "Product Name": "Running Shoes - White - 9", "Color": "White", "Size": "9", "Quantity Sold": 12, "Product Net": 120 }
  ];

  // Handle product selection from search
  const handleProductsSelected = (products) => {
    console.log('🔍 DISCOVERY: Products selected:', products);
    console.log('🔍 DISCOVERY: Product items:', products.map(p => ({ title: p.title, itemCount: p.items?.length })));
    setSelectedProducts(products);
  };

  // Use all-time data if available, otherwise use sample data for fallback
  const searchData = allTimeData?.length > 0 ? allTimeData : sampleData;
  
  console.log('🔍 DISCOVERY: Final searchData being passed to ProductSearch:', searchData?.length, 'items');
  console.log('🔍 DISCOVERY: Date range in searchData:', searchData?.length ? {
    earliest: Math.min(...searchData.map(r => new Date(r.date || r.Date || '2025-01-01').getTime())),
    latest: Math.max(...searchData.map(r => new Date(r.date || r.Date || '2025-01-01').getTime()))
  } : 'none');

  // Convert selected products to table format for GroupTable
  const selectedTable = useMemo(() => {
    console.log('🔍 DISCOVERY: selectedProducts:', selectedProducts);
    console.log('🔍 DISCOVERY: searchData length:', searchData?.length);
    console.log('🔍 DISCOVERY: searchData sample:', searchData?.slice(0, 3));
    
    if (!selectedProducts.length) return null;
    
    // Get all historical data for the selected products
    const selectedProductNames = selectedProducts.map(p => p.title);
    console.log('🔍 DISCOVERY: selectedProductNames:', selectedProductNames);
    
    // Filter ALL historical data to include only the selected products
    const allHistoricalItems = searchData.filter(row => {
      const fullProductName = row["Product Name"] || row.product_name || '';
      const productBase = fullProductName.split(' - ')[0] || fullProductName;
      
      return selectedProductNames.some(selectedName => {
        const normalizedSelected = selectedName.toLowerCase().trim();
        const normalizedProduct = productBase.toLowerCase().trim();
        return normalizedProduct === normalizedSelected;
      });
    });
    
    console.log('🔍 DISCOVERY: allHistoricalItems length:', allHistoricalItems.length);
    console.log('🔍 DISCOVERY: allHistoricalItems sample:', allHistoricalItems.slice(0, 3));
    
    if (!allHistoricalItems.length) return null;
    
    // Create table structure from ALL historical line items for selected products
    const columnKeys = Object.keys(allHistoricalItems[0] || {});
    const displayLabels = columnKeys;
    
    // Calculate totals for numeric columns from ALL historical data
    const totals = {};
    columnKeys.forEach(key => {
      if (key === 'Product Name' || key === 'Color' || key === 'Size') {
        totals[key] = 'Total'; // Use 'Total' for first non-numeric column
        return;
      }
      
      // Sum numeric values from ALL historical data
      const sum = allHistoricalItems.reduce((acc, item) => {
        const value = parseFloat(item[key]) || 0;
        return acc + value;
      }, 0);
      
      // Format based on column type
      if (key.toLowerCase().includes('net') || key.toLowerCase().includes('price') || key.toLowerCase().includes('revenue')) {
        totals[key] = `$${sum.toFixed(2)}`;
      } else if (key.toLowerCase().includes('quantity') || key.toLowerCase().includes('units') || key.toLowerCase().includes('sold')) {
        totals[key] = sum.toString();
      } else {
        totals[key] = sum.toString();
      }
    });
    
    return {
      columnKeys,
      displayLabels,
      rows: allHistoricalItems,
      totals,
      rowCount: allHistoricalItems.length,
      columnCount: columnKeys.length
    };
  }, [selectedProducts, searchData]);

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="flex-none px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900">Discovery</h1>
        <p className="text-sm text-gray-600 mt-1">Search for products and explore their variants</p>
        {loading && <p className="text-xs text-blue-600 mt-1">Loading product data...</p>}
      </div>

      {/* ProductSearch Component */}
      <div className="flex justify-center px-4 mb-4">
        <div className="w-full max-w-2xl">
          <ProductSearch
            rawData={searchData}
            onProductsSelected={handleProductsSelected}
            placeholder={loading ? "Loading product data..." : "Search products..."}
          />
  
          <GroupTable 
            table={selectedTable} 
            selectedProducts={selectedProducts}
            placeholderRows={selectedTable ? 0 : 3}
            placeholderCols={selectedTable ? 0 : 4}
          />
        </div>
      </div>
    </div>
  );
}