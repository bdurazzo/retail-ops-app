import React, { useEffect, useMemo, useState } from 'react';
import { IconTags, IconAdjustments, IconListDetails, IconLayoutGrid, IconShirt } from '@tabler/icons-react';

export default function ProductControls({ panelState = {}, onCommand }) {
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState(() => panelState?.productActiveSection || 'overview');

  // Debounce search text emit to panel
  const debouncedEmit = useMemo(() => {
    let t = null;
    return (val) => {
      clearTimeout(t);
      t = setTimeout(() => {
        onCommand?.({ type: 'searchText', value: val });
      }, 250);
    };
  }, [onCommand]);

  const showSection = (section) => {
    // Deterministic: always show the requested section (no toggle-to-overview)
    if (activeSection !== section) setActiveSection(section);
    onCommand?.({ type: 'showSection', section, __ts: Date.now() });
  };

  // Keep toolbar highlighting in sync with panel's reported section
  useEffect(() => {
    if (panelState?.productActiveSection && panelState.productActiveSection !== activeSection) {
      setActiveSection(panelState.productActiveSection);
    }
  }, [panelState?.productActiveSection]);

  return (
    <div className="flex items-center gap-5 w-full">
      {/* Left buttons: section selectors */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => showSection('overview')}
          className={`p-1 rounded transition-all ${activeSection === 'overview' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          title="Overview"
        >
          <IconLayoutGrid size={20} />
        </button>
        <button
          onClick={() => showSection('styles')}
          className={`p-1 rounded transition-all ${activeSection === 'styles' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          title="Styles"
        >
          <IconShirt size={20} />
        </button>
        <button
          onClick={() => showSection('category')}
          className={`p-1 rounded transition-all ${activeSection === 'category' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          title="Categories"
        >
          <IconTags size={20} />
        </button>
        <button
          onClick={() => showSection('variants')}
          className={`p-1 rounded transition-all ${activeSection === 'variants' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          title="Variants"
        >
          <IconListDetails size={20} />
        </button>
        <button
          onClick={() => showSection('attributes')}
          className={`p-1 rounded transition-all ${activeSection === 'attributes' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          title="Attributes"
        >
          <IconAdjustments size={20} />
        </button>
      </div>

      {/* Center: contextual input (start with search) */}
      <div className="flex-1 flex items-center gap-2">
        {activeSection === 'search' && (
          <input
            type="text"
            value={query}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              debouncedEmit(v);
            }}
            placeholder="Search products, styles, materials..."
            className="w-full max-w-md text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        )}
      </div>

      {/* Right: reserved for future settings/export */}
      <div className="flex items-center gap-1" />
    </div>
  );
}
