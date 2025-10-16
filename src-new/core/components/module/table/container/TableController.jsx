/**
 * TableController
 *
 * State management hub for table + plugin system.
 * Houses PluginToolbar (drag palette) and PluginController (query builder).
 */

import React, { useState } from 'react';
import PluginToolbar from '../../../plugins/PluginToolbar.jsx';
import PluginController from '../../../plugins/PluginController.jsx';
import TableToolbar from './TableToolbar.jsx';

export default function TableController({
  tableId = 'table-default',
  onQueryExecute,
  tableContext
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


      {/* Table toolbar bar */}
      <TableToolbar tableContext={tableContext} />
    </div>
  );
}
