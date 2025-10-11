import React, { useState, useEffect } from 'react';
import SearchBar from '../../../../components/SearchBar.jsx';
import Toolbar from '../../../../components/Toolbar.jsx';
import SearchTable from './SearchTable.jsx';
import PluginRack from '../../../../components/PluginRack.jsx';
import PluginButton from '../buttons/PluginButton.jsx';
import { IconGenderFemale, IconGenderMale, IconHanger, IconJacket, IconSearch, IconShirt, IconShirtFilled, IconTag, IconTags } from '@tabler/icons-react';
import { useProductSearch } from '../../../hooks/useProductSearch.js';
import { loadAllTimeLineItemsData } from '../../../services/dataService.js';

export default function ProductPluginPanel({ onPanelStateChange, panelCommand }) {
  const [rawData, setRawData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Load all-time data for search
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        setDataLoading(true);
        const data = await loadAllTimeLineItemsData();
        if (!isCancelled) {
          setRawData(data);
        }
      } catch (err) {
        console.error('ProductPluginPanel: Failed to load data:', err);
      } finally {
        if (!isCancelled) {
          setDataLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Use search hook
  const { searchText, setSearchText, clearSearch, candidates, loading, error } = useProductSearch(rawData);

  const leftContent = (
    <div className="flex items-center gap-1">
      <IconSearch size={16} className="text-gray-600" />
      <div className="w-[2px] h-6 bg-gray-200 ml-1"></div>
    </div>
  );

  const centerContent = (
    <div className="flex-1 px-2">
      <SearchBar
        value={searchText}
        onChange={setSearchText}
        onClear={clearSearch}
        placeholder={dataLoading ? "Loading product data..." : "Search products..."}
      />
    </div>
  );

  const productPlugins = {
    'Category': [
      { id: 'Units', label: 'Men', icon: IconGenderMale },
      { id: 'by-brand', label: 'Women', icon: IconGenderFemale },
      { id: 'by-color', label: 'Style', icon: IconJacket},
      { id: 'by-size', label: 'Category', icon: IconHanger },
    ],
    'Attributes': [
 
    ]
  };

  const handlePluginDragStart = (e, plugin) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(plugin));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Search Toolbar */}
      {/*<div className="flex-none p-1 border-b border-gray-200">
        <Toolbar
          leftContent={leftContent}
          centerContent={centerContent}
          height="h-[40px]"
          borderWidth={1}
          shadowSize=""
          rounded=""
          paddingX={2}
        /> 
      </div> */}

      {/* Search Results Table */}
      {/*<div className="flex-1 border min-h-0 p-2">
        {loading && <div className="text-xs text-gray-500 p-2">Searching...</div>}
        {error && <div className="text-xs text-red-600 p-2">{error}</div>}

        {!loading && !error && candidates.length > 0 && (
          <SearchTable candidates={candidates} />
        )}

        {!loading && !error && candidates.length === 0 && searchText && searchText.trim().length >= 2 && (
          <div className="text-xs text-gray-500 p-2">No products found for "{searchText}"</div>
        )}
      </div> */}

      {/* Plugin Rack */}
      <div className="flex h-[100px] items-center justify-center bg-gradient-to-t from-gray-100 via-gray-50 to-gray-100 border-t">
        <PluginRack
          pages={['Category', 'Attributes']}
          pluginsByPage={productPlugins}
          renderButton={(plugin) => (
            <PluginButton
              plugin={plugin}
              onDragStart={handlePluginDragStart}
            />
          )}
        />
      </div>
    </div>
  );
}
