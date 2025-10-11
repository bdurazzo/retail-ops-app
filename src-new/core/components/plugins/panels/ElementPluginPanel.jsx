import React from 'react';
import PluginRack from '../../../../components/PluginRack.jsx';
import PluginButton from '../buttons/PluginButton.jsx';
import { IconFilter, IconFilterCog, IconSortAscending, IconSortDescending } from '@tabler/icons-react';

export default function ElementPluginPanel({ onPanelStateChange, panelCommand }) {
  const elementPlugins = {
    'Filter': [
      { id: 'filter-basic', label: 'Filter', icon: IconFilter },
      { id: 'filter-advanced', label: 'Adv', icon: IconFilterCog },
    ],
    'Sort': [
      { id: 'sort-asc', label: 'Asc', icon: IconSortAscending },
      { id: 'sort-desc', label: 'Desc', icon: IconSortDescending },
    ]
  };

  const handleDragStart = (e, plugin) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(plugin));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex h-[100px] items-center justify-center bg-gradient-to-t from-gray-100 via-gray-50 to-gray-100 border-t border-b">
      <PluginRack
        pages={['Filter', 'Sort']}
        pluginsByPage={elementPlugins}
        renderButton={(plugin) => (
          <PluginButton
            plugin={plugin}
            onDragStart={handleDragStart}
          />
        )}
      />
    </div>
  );
}
