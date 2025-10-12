/**
 * PluginController
 *
 * Query builder panel that wraps PluginInsert and PluginSend.
 * Interprets filter plugin configurations dropped into slots,
 * builds query objects, and triggers data fetching.
 *
 * This is the control center for each table instance's data query.
 */

import React, { useState, useEffect } from 'react';
import PluginInsert from './PluginInsert.jsx';
import PluginSend from './PluginSend.jsx';

export default function PluginController({
  tableId,              // Unique identifier for this table instance
  cellState = {},       // Read from TableBody
  columnState = {},     // Read from TableHeader
  onQueryChange,        // Callback when query configuration changes
  onQueryExecute,       // Callback to execute query
  ...props
}) {
  // Track which slots are filled
  const [slotData, setSlotData] = useState({
    product: null,
    metric: null,
    time: null,
    element: null,  // Future: inventory/stock
    trend: null     // Future: foot traffic/weather
  });

  // Build query object from slot data
  const buildQuery = () => {
    const { product, metric, time, element, trend } = slotData;

    // Query is only valid if primary slots (product, metric, time) are filled
    const isValid = product && metric && time;

    if (!isValid) return null;

    return {
      tableId,
      product: product.config,
      metric: metric.config,
      time: time.config,
      element: element?.config || null,
      trend: trend?.config || null,
      timestamp: new Date().toISOString()
    };
  };

  // Handle slot fill from PluginInsert
  const handleSlotFill = (slotName, pluginData) => {
    setSlotData(prev => ({
      ...prev,
      [slotName]: pluginData
    }));
  };

  // Handle slot clear
  const handleSlotClear = (slotName) => {
    setSlotData(prev => ({
      ...prev,
      [slotName]: null
    }));
  };

  // Notify parent when query changes
  useEffect(() => {
    const query = buildQuery();
    if (onQueryChange) {
      onQueryChange(query);
    }
  }, [slotData]);

  // Execute query
  const handleExecuteQuery = () => {
    const query = buildQuery();
    if (query && onQueryExecute) {
      onQueryExecute(query);
    }
  };

  const queryIsValid = !!(slotData.product && slotData.metric && slotData.time);

  return (
    <div className="w-full bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 rounded-t-xl border-b border-gray-200">
      {/* Query Builder - Slot Receiver */}
      <PluginInsert
        slotData={slotData}
        onSlotFill={handleSlotFill}
        onSlotClear={handleSlotClear}
        queryIsValid={queryIsValid}
      />

      {/* Query Output - Execute Button */}
      <PluginSend
        query={buildQuery()}
        queryIsValid={queryIsValid}
        onExecute={handleExecuteQuery}
      />
    </div>
  );
}
