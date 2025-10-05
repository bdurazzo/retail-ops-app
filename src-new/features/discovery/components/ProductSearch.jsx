import React, { useEffect, useState, useMemo, useRef } from 'react';
import SearchBar from '../../../components/SearchBar.jsx';
import Toolbar from '../../../components/Toolbar.jsx';
import Table from '../../../components/Table.jsx';
import { IconSearch, IconTrash } from '@tabler/icons-react';
import { useDragDrop } from '../../../core/hooks/useDragDrop.js';
import { DRAG_TYPES } from '../../../core/utils/dragDropTypes.js';

/**
 * Discovery ProductSearch: SearchBar + Table in a dropdown-like container
 * Based on analytics ProductSearch but integrated with SearchBar for Discovery page
 */
export default function ProductSearch({
  rawData = [],
  onProductsSelected,
  selectedProducts = [],
  placeholder = "Search products...",
  className = ""
}) {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [checks, setChecks] = useState(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Drag/drop hook
  const { handleDragStart } = useDragDrop();

  // Search function - same logic as analytics ProductSearch
  const searchProducts = async (query) => {
    if (!query || query.trim().length < 2) {
      setCandidates([]);
      setLoading(false);
      setError(null);
      setIsOpen(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        setCandidates([]);
        setLoading(false);
        setIsOpen(false);
        return;
      }
      
      const norm = (s) => String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
      const queryNorm = norm(query);
      
      // Extract product names from CSV line items and search them
      const productMap = new Map(); // productName -> {count, score, items}
      
      rawData.forEach(row => {
        const fullProductName = row["Product Name"] || row.product_name || '';
        if (!fullProductName) return;
        
        // Extract base product name (remove variant suffix like " - Color - Size")
        const productBase = fullProductName.split(' - ')[0] || fullProductName;
        const productNorm = norm(productBase);
        
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
          for (const w of words) if (productNorm.includes(w)) wordMatches++;
          // Only include if ALL words match, but prioritize shorter titles (more specific)
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
      const items = Array.from(productMap.entries())
        .map(([title, meta]) => ({ 
          title, 
          count: meta.count, 
          score: meta.score,
          items: meta.items // Keep reference to original line items
        }))
        .sort((a,b)=> (b.score !== a.score) ? (b.score - a.score) : (b.count - a.count))
        .slice(0, 100);
        
      setCandidates(items);
      setChecks(new Set()); // Start with nothing selected
      setIsOpen(items.length > 0); // Show dropdown if results found
    } catch (e) {
      setError(e?.message || 'Failed to search products');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input changes
  const handleSearchChange = (value) => {
    setSearchText(value);
    if (value.trim().length >= 2) {
      setIsOpen(true); // Force dropdown open when typing
      searchProducts(value);
    } else if (value === '') {
      setCandidates([]);
      setChecks(new Set());
      setError(null);
      setLoading(false);
      setIsOpen(false);
    }
  };

  const handleSearchClear = () => {
    setSearchText('');
    setCandidates([]);
    setChecks(new Set());
    setError(null);
    setLoading(false);
    setIsOpen(false);
  };

  // Handle product selection
  const toggle = (title) => {
    setChecks(prev => { 
      const n = new Set(prev); 
      const wasChecked = n.has(title);
      if (wasChecked) {
        n.delete(title);
      } else {
        n.add(title);
      }
      
      // Notify parent immediately of selection changes
      const selectedCandidates = candidates.filter(c => n.has(c.title));
      const selectedProducts = selectedCandidates.map(c => ({
        title: c.title,
        count: c.count,
        items: c.items || []
      }));
      onProductsSelected?.(selectedProducts);
      
      return n; 
    });
  };

  const selectAll = () => {
    const allTitles = candidates.map(c => c.title);
    setChecks(new Set(allTitles));
    
    // Notify parent of all selections
    const selectedProducts = candidates.map(c => ({
      title: c.title,
      count: c.count,
      items: c.items || []
    }));
    onProductsSelected?.(selectedProducts);
  };

  const clearAll = () => {
    setChecks(new Set());
    onProductsSelected?.([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Convert candidates data to Table.jsx format
  const tableData = useMemo(() => {
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
      "Select": checks.has(c.title),
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
  }, [candidates, checks]);

  // Toolbar content
  const leftContent = (
    <div className="flex items-center gap-1">
      <IconSearch size={16} className="text-gray-600" />
      <div className="w-[2px] h-6 bg-gray-200 ml-1"></div>
    </div>
  );

  const centerContent = (
    <div className="flex-1 px-2 relative overflow-visible">
      <SearchBar
        value={searchText}
        onChange={handleSearchChange}
        onClear={handleSearchClear}
        placeholder={placeholder}
      />
    </div>
  );

  const rightContent = checks.size > 0 ? (
    <button 
      className="p-1 rounded hover:bg-gray-100 text-gray-600"
      title="Clear selections"
      onClick={clearAll}
    >
      <IconTrash size={16} />
    </button>
  ) : null;

  return (
    <div ref={containerRef} className={`relative flex-1 items-center justify-center w-full ${className}`} style={{ zIndex: 50 }}>
      {/* Toolbar with SearchBar in center */}
      <Toolbar
        leftContent={leftContent}
        centerContent={centerContent}
        rightContent={rightContent}
        height="h-[50px]"
        borderWidth={1}
        shadowSize=""
        rounded="rounded border-gray-300"
        paddingX={2}
        allowOverflow={true}
      />
      
      {/* Dropdown outside toolbar */}
      {isOpen && (
        <div className="w-full bg-white rounded-b-xl shadow-lg border-t overflow-y-auto max-h-64">
          {loading && <div className="text-xs text-gray-500 animate-pulse p-2">Searching…</div>}
          {error && <div className="text-xs text-red-600 p-2">{error}</div>}
          
          {!loading && !error && tableData && (
            <div className="m-4">
              <Table
                table={tableData}
                placeholderRows={12}
                placeholderCols={2}
                height="auto"
                maxBodyHeight={140}
                firstColWidth={45}
                metricColWidth={120}
                headerHeight={32}
                rowHeight={36}
                footerHeight={32}
                containerBorder="none"
                containerShadow=""
                containerRounded="rounded-xl"
                containerClasses=""
                disableSorting={true}
                columnWidths={{
                  "Product Name": 220,
                  "Units": 60
                }}
                headerAlignment="center"
                bodyAlignment="left"
                footerAlignment="center"
                columnAlignments={{
                  "Units": "center"
                }}
                customCellRenderer={{
                  "Select": (value, row) => (
                    <div className="flex justify-center items-center shadow-xl h-full">
                      <input
                        type="checkbox"
                        checked={!!value}
                        onChange={() => toggle?.(row["Product Name"])}
                        className="cursor-pointer"
                      />
                    </div>
                  ),
                  "Product Name": (value, row) => {
                    const productTitle = row["Product Name"];

                    // Find loaded product data (from checkbox selection)
                    const loadedProduct = selectedProducts.find(p => p.title === productTitle);

                    const onDragStart = (e) => {
                      e.dataTransfer.effectAllowed = 'copy';

                      console.log('🎯 DRAG START:', {
                        productTitle,
                        hasLoadedData: !!loadedProduct,
                        itemCount: loadedProduct?.items?.length || 0
                      });

                      const serialized = handleDragStart(DRAG_TYPES.PRODUCT, {
                        title: productTitle,
                        content: loadedProduct?.items || [],
                        options: {}
                      });

                      e.dataTransfer.setData('text/plain', serialized);
                    };

                    return (
                      <span
                        draggable="true"
                        onDragStart={onDragStart}
                        className="flex-1 ml-2 mt-3 items-center cursor-grab active:cursor-grabbing text-xs truncate block"
                      >
                        {value}
                      </span>
                    );
                  }
                }}
                customHeaderRenderer={{
                  "Select": () => {
                    const allChecked = candidates.length > 0 && candidates.every(r => checks.has(r.title));
                    return (
                      <div className="flex justify-center items-center h-full">
                        <input 
                          type="checkbox" 
                          checked={allChecked}
                          onChange={() => allChecked ? clearAll?.() : selectAll?.()}
                          className="cursor-pointer"
                          title={allChecked ? "Deselect All" : "Select All"}
                        />
                      </div>
                    );
                  }
                }}
              />
            </div>
          )}
          
          {!loading && !error && candidates.length === 0 && searchText && searchText.trim().length >= 2 && (
            <div className="text-sm text-gray-500 p-4 text-center">
              No products found for "{searchText}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}