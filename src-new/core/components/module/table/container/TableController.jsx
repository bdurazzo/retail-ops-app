/**
 * TableController
 *
 * State management hub for table + plugin system.
 * Houses PluginToolbar (drag palette) and PluginController (query builder).
 */

import React, { useState } from 'react';
import PluginToolbar from '../../../plugins/PluginToolbar.jsx';
import PluginController from '../../../plugins/PluginController.jsx';

export default function TableController({
  tableId = 'table-default',
  buttonAssignments = [],
  onQueryExecute
}) {
  const [activeTab, setActiveTab] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('drag');

  // Query state
  const [currentQuery, setCurrentQuery] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecuted, setLastExecuted] = useState(null);

  const handleToggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
  };

  const handleQueryChange = (query) => {
    setCurrentQuery(query);
  };

  const handleQueryExecute = async () => {
    if (!currentQuery) return;

    try {
      setIsExecuting(true);

      // Call parent's query executor if provided
      if (onQueryExecute) {
        await onQueryExecute(currentQuery);
      }

      setLastExecuted(new Date());
    } catch (error) {
      console.error('Query execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="relative items-center bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 rounded-t-xl">
      {/* PluginToolbar - Drag Palette */}
      <PluginToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isOpen}
        onToggleMenu={handleToggleMenu}
        onViewModeChange={handleViewModeChange}
      />

      {/* PluginController - Query Builder */}
      <PluginController
        tableId={tableId}
        onQueryChange={handleQueryChange}
        onQueryExecute={handleQueryExecute}
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
