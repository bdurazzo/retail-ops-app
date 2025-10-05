import React from 'react';

import { IconChartHistogram, IconTable, IconList, IconChartBar, IconLayoutList } from '@tabler/icons-react'

export default function DataToolbar({ currentView, onViewChange }) {
  const views = [
    { key: 'orders', label: <IconTable size={18} />, title: 'Orders View' },
    { key: 'line_items', label: <IconList size={18} />, title: 'Line Items View' },
    { key: 'grouped', label: <IconChartBar size={18} />, title: 'Grouped View' },
    { key: 'chart', label: <IconChartHistogram size={18} />, title: 'Chart View' }
  ];

  return (
    <div className="h-12 border-b border-gray-50 bg-gradient-to-b from-gray-100 via-white to-gray-50 shadow-xl rounded-t-xl flex items-center justify-between px-4">
      {/* Left side - View toggle */}
      <div className="flex items-center space-x-2">
        {views.map(({ key, label, title }) => (
          <button
          key={key}
            title={title}
            aria-label={`Switch to ${key} view`}
            onClick={() => onViewChange(key)}
            className={`flex items-center justify-center h-8 w-8 rounded text-sm font-medium transition-colors ${
              currentView === key
                ? 'bg-gray-800 text-white' 
                : 'bg-none text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right side - Future controls (export, etc.) */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">View: {currentView}</span>
      </div>
    </div>
  );
}