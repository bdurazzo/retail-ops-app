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
  sortable = true,
  onSort = null
}) {
  const section = 'B1';
  const { sortKey, sortDirection, onSort: onSortContext } = tableContext || {};
  const finalOnSort = onSort || onSortContext;

  const [showPicker, setShowPicker] = useState(false);

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
    setShowPicker(false); // Hide picker after selection
  };

  const togglePicker = () => {
    setShowPicker(!showPicker);
  };

  return (
    <ChannelStrip
      section={section}
      columnKey={columnKey}
      pluginData={columnState[columnKey]}
      onUpdate={(data) => onColumnStateUpdate(columnKey, data)}
      tableContext={tableContext}
      noPadding={true}
      toolbarLeftContent={
        <div className="absolute left-0 top-0 h-5 bg-transparent flex gap-1">
          <button
            className="hover:bg-gray-100 rounded transition-colors px-1"
            onClick={togglePicker}
          >
            <IconLayoutDistributeHorizontal size={14} stroke={1.75}/>
          </button>
        </div>
      }
      toolbarCenterContent={
        <div className="absolute top-0 right-0 gap-1"></div>
      }
      toolbarRightContent={
        <div className="absolute top-0 right-0"></div>
      }
    >
      <>
        {showPicker ? (
          <MetricPicker
            key={`picker-${columnKey}`}
            items={pickerItems}
            selectedValue={columnKey}
            onValueChange={handleMetricChange}
          />
        ) : (
          <span className="text-xs text-gray-700">{columnLabel}</span>
        )}
        {sortKey === columnKey && (
          <span className="absolute right-3 text-gray-600 pointer-events-none">
            {getSortIndicator(columnKey, sortKey, sortDirection)}
          </span>
        )}
      </>
    </ChannelStrip>
  );
}
