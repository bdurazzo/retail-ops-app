/**
 * ChB1 - Channel for B1 Section (Scrolling Header)
 *
 * Renders in scrolling column headers.
 * Accepts: Metric filters (defines column metrics)
 */

import React, { useState, useRef } from 'react';
import ChannelStrip from '../../../../../components/ChannelStrip.jsx';
import { PluginSlot } from '../../../plugins/PluginInsert.jsx';
import { IconArrowLeft, IconBriefcaseFilled, IconCaretDownFilled, IconCaretLeftFilled, IconCaretUpFilled, IconLayoutDistributeHorizontal, IconLayoutDistributeHorizontalFilled, IconTableDown } from '@tabler/icons-react';
import { getSortIndicator } from '../../../../utils/tableSorting.js';
import MetricPicker from '../../../../../components/MetricPicker.jsx';

export default function ChB1({
  columnKey,
  columnLabel,
  columnKeys = [], // Currently visible column keys
  allColumnKeys = [], // All possible column keys for picker
  columnLabels = {}, // Labels for each column key
  columnState = {},
  onColumnStateUpdate = () => {},
  onColumnSwap = () => {},
  tableContext,
  sortable = false,
  onSort = null
}) {
  const section = 'B1';
  const { sortKey, sortDirection } = tableContext || {};

  // Build items array with {value, label} format for MetricPicker
  // Use allColumnKeys so picker shows all possible options, not just visible ones
  const pickerItems = (allColumnKeys.length > 0 ? allColumnKeys : columnKeys).map(key => ({
    value: key,
    label: columnLabels[key] || key
  }));

  const handleMetricChange = (newColumnKey) => {
    if (newColumnKey !== columnKey) {
      onColumnSwap(columnKey, newColumnKey);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <MetricPicker
        key={`picker-${columnKey}`}
        items={pickerItems}
        selectedValue={columnKey}
        onValueChange={handleMetricChange}
      />
    </div>
  );
}
