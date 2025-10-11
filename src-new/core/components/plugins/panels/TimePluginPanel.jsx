import React from 'react';
import PluginRack from '../../../../components/PluginRack.jsx';
import PluginButton from '../buttons/PluginButton.jsx';
import { IconCalendar, IconCalendarEvent, IconCalendarMonth, IconCalendarWeek } from '@tabler/icons-react';

export default function TimePluginPanel({ onPanelStateChange, panelCommand }) {
  const timePlugins = {
    'Period': [
      { id: 'by-day', label: 'Day', icon: IconCalendar },
      { id: 'by-week', label: 'Week', icon: IconCalendarWeek },
      { id: 'by-month', label: 'Month', icon: IconCalendarMonth },
      { id: 'by-hour', label: 'Hour', icon: IconCalendarMonth },
    ],
    'Range': [
      { id: 'date-range', label: 'Range', icon: IconCalendarEvent },
      { id: 'by-month', label: 'Month', icon: IconCalendarMonth },
      { id: 'by-month', label: 'Month', icon: IconCalendarMonth },
      { id: 'by-month', label: 'Month', icon: IconCalendarMonth },
    ],
        'Range': [
      { id: 'date-range', label: 'Range', icon: IconCalendarEvent },
      { id: 'by-month', label: 'Month', icon: IconCalendarMonth },
      { id: 'by-month', label: 'Month', icon: IconCalendarMonth },
      { id: 'by-month', label: 'Month', icon: IconCalendarMonth },
    ],
        'Range': [
      { id: 'date-range', label: 'Range', icon: IconCalendarEvent },
      { id: 'by-month', label: 'Month', icon: IconCalendarMonth },
      { id: 'by-month', label: 'Month', icon: IconCalendarMonth },
      { id: 'by-month', label: 'Month', icon: IconCalendarMonth },
    ],
  };

  const handleDragStart = (e, plugin) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(plugin));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex h-[100px] items-center justify-center bg-gradient-to-t from-gray-100 via-gray-50 to-gray-100 border-t border-b">
      <PluginRack
        pages={['Period', 'Range']}
        pluginsByPage={timePlugins}
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
