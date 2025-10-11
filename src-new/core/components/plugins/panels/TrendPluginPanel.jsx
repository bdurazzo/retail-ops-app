import React from 'react';
import PluginRack from '../../../../components/PluginRack.jsx';
import PluginButton from '../buttons/PluginButton.jsx';
import { IconTrendingDown, IconTrendingUp, IconChartLine, IconChartDots } from '@tabler/icons-react';

export default function TrendPluginPanel({ onPanelStateChange, panelCommand }) {
  const trendPlugins = {
    'Direction': [
      { id: 'trend-up', label: 'Up', icon: IconTrendingUp },
      { id: 'trend-down', label: 'Down', icon: IconTrendingDown },
    ],
    'Analysis': [
      { id: 'line-chart', label: 'Line', icon: IconChartLine },
      { id: 'scatter', label: 'Scatter', icon: IconChartDots },
    ]
  };

  const handleDragStart = (e, plugin) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(plugin));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex h-[100px] items-center justify-center bg-gradient-to-t from-gray-100 via-gray-50 to-gray-100 border-t border-b">
      <PluginRack
        pages={['Direction', 'Analysis']}
        pluginsByPage={trendPlugins}
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
