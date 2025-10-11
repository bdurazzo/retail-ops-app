import React, { useState } from 'react';
import PluginRack from '../../../components/PluginRack.jsx';

/**
 * PluginMode - Plugin Rack Container
 *
 * Paginated container that houses plugin buttons.
 * Each page shows a different category of plugins.
 */
export default function PluginMode({
  pages = ['Revenue', 'Inventory', 'Orders'],
  pluginsByPage = {},
  onPluginDrag,
}) {
  const [activePage, setActivePage] = useState(pages[0]);

  // Handle drag start for plugin buttons
  const handleDragStart = (e, pluginData) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(pluginData));
    e.dataTransfer.effectAllowed = 'copy';
    onPluginDrag?.(pluginData);
  };

  // Render draggable plugin button
  const renderPluginButton = (plugin) => {
    return (
      <button
        key={plugin.id}
        draggable
        onDragStart={(e) => handleDragStart(e, plugin)}
        className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-move transition-colors"
        title={plugin.description || `Drag to add ${plugin.label}`}
      >
        {plugin.icon && <plugin.icon size={14} stroke={1.5} />}
        <span>{plugin.label}</span>
      </button>
    );
  };

  // Get plugins for active page
  const activePlugins = pluginsByPage[activePage] || [];

  return (
    <div className="flex flex-col bg-white rounded-md border border-gray-200 shadow-sm">
      {/* PluginRack pagination */}
      <PluginRack
        pages={pages}
        activePage={activePage}
        onPageChange={setActivePage}
        className="border-b border-gray-200"
      />

      {/* Plugin Buttons */}
      <div className="p-3">
        {activePlugins.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {activePlugins.map(renderPluginButton)}
          </div>
        ) : (
          <div className="text-[11px] text-gray-500 text-center py-4">
            No plugins available for {activePage}
          </div>
        )}
      </div>
    </div>
  );
}
