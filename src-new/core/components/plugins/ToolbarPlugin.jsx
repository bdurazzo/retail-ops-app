import React, { useState } from 'react';
import { IconOutlet, IconPlug, IconPlugConnected } from '@tabler/icons-react';
import PluginSend from './PluginSend.jsx';
import PluginInsert from './PluginInsert.jsx';
import { PLUGIN_DATA_TYPES } from '../../config/pluginConfig.js';

/**
 * ToolbarPlugin - Plugin socket component
 * 
 * Renders socket indicators for plugin insert and send connections
 * Supports actual PluginSend and PluginInsert components with drag-and-drop
 */
export default function ToolbarPlugin({
  pluginSlots = {}, // { inserts: [], sends: [] } - available plugin slots
  pluginContext = {}, // Context data available to plugins
  onPluginData = null, // Callback when plugin sends data
  onPluginConnect = null, // Callback when plugins connect
  containerStyle = "bg-gray-100 rounded border border-gray-200", // Container styling
  containerPadding = "p-1", // Container padding
  socketGap = "gap-1", // Gap between sockets
  availableData = [], // Available data packages for insert plugins
  enabledPlugins = { send: true, insert: true }, // Which plugins to enable
}) {
  const [showSockets, setShowSockets] = useState(false);
  const [dragOver, setDragOver] = useState(null); // 'insert' or 'send'

  const toggleSockets = () => {
    setShowSockets(prev => !prev);
  };

  // Handle drag and drop events
  const handleDragOver = (e, socketType) => {
    e.preventDefault();
    setDragOver(socketType);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(null);
  };

  const handleDrop = (e, socketType) => {
    e.preventDefault();
    setDragOver(null);
    
    // Handle plugin drop logic here
    const pluginData = e.dataTransfer.getData('application/json');
    if (pluginData && onPluginConnect) {
      onPluginConnect({
        socketType,
        pluginData: JSON.parse(pluginData),
        context: pluginContext
      });
    }
  };

  // Determine which data types this context can send/receive
  const getAvailableDataTypes = () => {
    const types = [];
    
    // Based on context, determine what data types are available
    if (pluginContext.productData) types.push(PLUGIN_DATA_TYPES.TABLE_DATA);
    if (pluginContext.productName) types.push(PLUGIN_DATA_TYPES.PRODUCT_SELECTION);
    if (pluginContext.tableData) types.push(PLUGIN_DATA_TYPES.KPI_METRICS);
    
    return types;
  };

  /**
   * Render actual PluginInsert component
   */
  const renderInsertPlugin = () => {
    if (!showSockets || !enabledPlugins.insert) return null;
    
    const hasInserts = (pluginSlots.inserts || []).length > 0;
    
    return (
      <div
        onDragOver={(e) => handleDragOver(e, 'insert')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'insert')}
        className={`transition-all ${
          dragOver === 'insert' ? 'ring-2 ring-green-300' : ''
        }`}
      >
        <PluginInsert
          targetContext={pluginContext}
          acceptedDataTypes={getAvailableDataTypes()}
          availableData={availableData}
          isActive={hasInserts}
          size="sm"
          onDataReceived={(data) => {
            console.log('🔌 ToolbarPlugin: Insert received data:', data);
            if (onPluginData) onPluginData(data);
          }}
          onError={(error) => {
            console.error('🔌 ToolbarPlugin: Insert error:', error);
          }}
        />
      </div>
    );
  };

  /**
   * Render actual PluginSend component
   */
  const renderSendPlugin = () => {
    if (!showSockets || !enabledPlugins.send) return null;
    
    const hasSends = (pluginSlots.sends || []).length > 0;
    
    return (
      <div
        onDragOver={(e) => handleDragOver(e, 'send')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'send')}
        className={`transition-all ${
          dragOver === 'send' ? 'ring-2 ring-blue-300' : ''
        }`}
      >
        <PluginSend
          sourceData={pluginContext.tableData || pluginContext.productData}
          sourceContext={pluginContext}
          availableDataTypes={getAvailableDataTypes()}
          isActive={hasSends}
          size="sm"
          onDataSent={(data) => {
            console.log('🔌 ToolbarPlugin: Send sent data:', data);
            if (onPluginData) onPluginData(data);
          }}
          onError={(error) => {
            console.error('🔌 ToolbarPlugin: Send error:', error);
          }}
        />
      </div>
    );
  };

  // Socket toggle button
  const socketToggleButton = (
    <button
      onClick={toggleSockets}
      className={`p-1 rounded transition-colors ${
        showSockets 
          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
      }`}
      title={showSockets ? 'Hide plugin sockets' : 'Show plugin sockets'}
    >
      <IconPlug size={14} />
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      {socketToggleButton}
      {showSockets && (
        <div className={`flex items-center ${socketGap} ${containerPadding} ${containerStyle}`}>
          {renderInsertPlugin()}
          {renderSendPlugin()}
        </div>
      )}
    </div>
  );
}

/**
 * Helper hook for using ToolbarPlugin in components
 */
export function useToolbarPlugin(initialContext = {}) {
  const [pluginContext, setPluginContext] = useState(initialContext);
  const [pluginData, setPluginData] = useState([]);
  
  const updateContext = (newContext) => {
    setPluginContext(prev => ({ ...prev, ...newContext }));
  };
  
  const handlePluginData = (data) => {
    setPluginData(prev => [...prev, data]);
  };
  
  return {
    pluginContext,
    updateContext,
    pluginData,
    handlePluginData
  };
}