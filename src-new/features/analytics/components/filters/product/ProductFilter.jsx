import React, { useEffect, useState } from "react";
import { IconShirtFilled, IconTrash } from '@tabler/icons-react';
import ProductSearch from "./ProductSearch.jsx";
import SearchBar from "../../../../../components/SearchBar.jsx";
import Toolbar from "../../../../../components/Toolbar.jsx";

// Shared state for ProductFilter
let productFilterState = {
  selectedProducts: [],
  setSelectedProducts: null,
  searchValue: '',
  setSearchValue: null
};

// Wired ProductFilter Toolbar
export function ProductFilterToolbar() {
  const { selectedProducts, setSelectedProducts, setSearchValue, searchValue } = productFilterState;

  const handleClear = () => {
    if (productFilterState.setSelectedProducts) productFilterState.setSelectedProducts([]);
    if (productFilterState.setSearchValue) productFilterState.setSearchValue('');
  };

  const leftContent = (
    <div className="flex items-center gap-1">
      <button className="p-1 rounded transition-colors text-gray-600 hover:bg-gray-100 flex flex-col items-center w-8">
        <IconShirtFilled size={16} stroke={1.75} />
      </button>
      <div className="w-[2px] h-8 bg-gray-200 ml-1"></div>
    </div>
  );

  const centerContent = null;

  const rightContent = (
    <button 
      className="p-1 rounded hover:bg-gray-100 text-gray-600"
      title="Clear filter"
      onClick={handleClear}
    >
      <IconTrash size={18} />
    </button>
  );

  return (
    <Toolbar
      leftContent={leftContent}
      centerContent={centerContent}
      rightContent={rightContent}
      height="9"
      borderWidth={1}
      shadowSize=""
      rounded="rounded-t border-b border-gray-300"
      paddingX={2}
    />
  );
}

export default function ProductFilter({ onRegister, resetNonce, query, panelCommand, onPanelStateChange, panelState, rawData }) {
  // Track selected products for apply registration
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  // Update shared state
  useEffect(() => {
    productFilterState.selectedProducts = selectedProducts;
    productFilterState.setSelectedProducts = setSelectedProducts;
    productFilterState.searchValue = searchValue;
    productFilterState.setSearchValue = setSearchValue;
  }, [selectedProducts, searchValue]);

  // Register Apply: return product config based on selected products
  useEffect(() => {
    if (!onRegister) return;
    onRegister(() => {
      const axItemNumbers = [];
      const titleFallbacks = [];
      
      for (const p of selectedProducts) {
        if (Array.isArray(p.ax_item_numbers) && p.ax_item_numbers.length > 0) {
          axItemNumbers.push(...p.ax_item_numbers);
        } else {
          const title = p.title || p.product_id || p.sku;
          if (title) titleFallbacks.push(title);
        }
      }
      
      return {
        type: 'product',
        config: {
          product: { 
            ax_item_numbers: axItemNumbers.length > 0 ? axItemNumbers : null,
            ids: titleFallbacks.length > 0 ? titleFallbacks : null
          }
        },
        isValid: selectedProducts.length > 0
      };
    });
  }, [onRegister, selectedProducts]);

  // Handle state changes from ProductSearch
  const handlePanelStateChange = (state) => {
    if (Array.isArray(state?.addCandidates)) {
      // Replace selected products entirely for real-time filtering
      setSelectedProducts(state.addCandidates);
      
      // If applyFilters flag is set, automatically apply the filter
      if (state.applyFilters) {
        // Get current filter state and apply it immediately
        setTimeout(() => {
          const axItemNumbers = [];
          const titleFallbacks = [];
          
          for (const p of state.addCandidates) {
            if (Array.isArray(p.ax_item_numbers) && p.ax_item_numbers.length > 0) {
              axItemNumbers.push(...p.ax_item_numbers);
            } else {
              const title = p.title || p.product_id || p.sku;
              if (title) titleFallbacks.push(title);
            }
          }
          
          const filterConfig = {
            type: 'product',
            config: {
              product: { 
                ax_item_numbers: axItemNumbers.length > 0 ? axItemNumbers : null,
                ids: titleFallbacks.length > 0 ? titleFallbacks : null
              }
            },
            isValid: state.addCandidates.length > 0
          };
          
          console.log('🔍 ProductFilter AUTO-APPLYING:', filterConfig);
          // Trigger immediate filter application through parent
          onPanelStateChange?.({ ...state, autoApplyFilter: filterConfig });
        }, 0);
      }
    }

    if (state?.clearSelectedProducts) {
      setSelectedProducts([]);
    }

    if (state?.removeCandidate) {
      const key = state.removeCandidate;
      setSelectedProducts(prev => prev.filter(p => (p.product_id || p.sku || p.title) !== key));
    }

    // Pass through to parent
    onPanelStateChange?.(state);
  };

  // Reset on resetNonce
  useEffect(() => {
    setSelectedProducts([]);
    setSearchValue('');
  }, [resetNonce]);

  // Create search command for ProductSearch
  const [searchCommand, setSearchCommand] = useState(null);

  const handleSearchSubmit = (value) => {
    setSearchCommand({ type: 'searchSubmit', value, __ts: Date.now() });
  };

  const handleSearchChange = (value) => {
    setSearchValue(value);
    // Send real-time search commands for immediate filtering
    setSearchCommand({ type: 'searchInput', value, __ts: Date.now() });
  };

  const handleSearchClear = () => {
    setSearchValue('');
    setSearchCommand({ type: 'searchInput', value: '', __ts: Date.now() });
  };

  return (
    <div className="space-2">
      <ProductFilterToolbar />
      <div className="flex-none mb-1 bg-gradient-to-b from-gray-200 via-white to-gray-100">
      <SearchBar
        value={searchValue}
        onChange={handleSearchChange}
        onSubmit={handleSearchSubmit}
        onClear={handleSearchClear}
        placeholder="Search products..."
        className="border-b border-gray-300"
      />
      <ProductSearch
        selected={selectedProducts}
        onRemove={(key) => {
          setSelectedProducts(prev => prev.filter(p => (p.product_id || p.sku || p.title) !== key));
        }}
        onPanelStateChange={handlePanelStateChange}
        query={query}
        panelCommand={searchCommand || panelCommand}
        rawData={rawData}
      />
    </div>
    </div>
  );
}

