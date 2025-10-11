/**
 * TableToolbar
 *
 * Container for button assignments and plugin palette.
 * Houses PluginToolbar with plugin control panel.
 */

import React, { useState } from 'react';
import PluginToolbar from '../../../plugins/PluginToolbar.jsx';

export default function TableToolbar({
  buttonAssignments = []
}) {
  const [activeTab, setActiveTab] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('drag');

  const handleToggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
  };

  return (
    <div className="relative items-center bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 rounded-t-xl">
      {/* PluginToolbar control panel */}
      <PluginToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isOpen}
        onToggleMenu={handleToggleMenu}
        onViewModeChange={handleViewModeChange}
      />

      {/* Button assignments bar */}
      {buttonAssignments.length > 0 && (
        <div className="flex h-[60px] items-center gap-2 px-4 py-2 bg-gradient-to-b from-gray-100 via-white to-gray-50 border-b border-gray-200">
          {buttonAssignments.map((button, idx) => (
            <button
              key={button.id || idx}
              className="px-3 flex items-center text-xs text-gray-600 font-semibold border-r border-gray-100 cursor-pointer bg-gradient-to-b from-gray-100 via-white to-gray-50 transition-colors hover:bg-gradient-to-b hover:from-gray-200 hover:via-gray-100 hover:to-gray-100"
              style={{ height: 30 }}
              onClick={() => button.handler?.(button.params)}
            >
              <span className="text-gray-700">{button.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
