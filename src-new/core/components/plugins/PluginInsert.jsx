/**
 * PluginInsert
 *
 * Slot receiver UI for filter plugins.
 * Uses ControlPanel + Toolbar structure matching PluginToolbar.
 * Displays drop zones for Product, Metric, Time, Element, and Trend plugins.
 * Users drag plugin buttons from PluginToolbar and drop into slots.
 */

import React from 'react';
import ControlPanel from '../../../components/ControlPanel.jsx';
import {
  IconShirtFilled,
  IconBriefcaseFilled,
  IconClockFilled,
  IconTemperaturePlusFilled,
  IconChartDots2Filled,
  IconX
} from '@tabler/icons-react';

// Slot configuration
const SLOTS = [
  {
    id: 'product',
    label: 'Product',
    icon: IconShirtFilled,
    required: true,
    description: 'What to analyze'
  },
  {
    id: 'metric',
    label: 'Metric',
    icon: IconBriefcaseFilled,
    required: true,
    description: 'How to measure'
  },
  {
    id: 'time',
    label: 'Time',
    icon: IconClockFilled,
    required: true,
    description: 'When/How to segment'
  },
];

/**
 * Individual Slot Component
 * Exported separately for use in table cells
 */
export function PluginSlot({
  slot,
  pluginData,
  onDrop,
  onClear,
  isValid
}) {
  const Icon = slot.icon;
  const isEmpty = !pluginData;
  const isRequired = slot.required;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = e.dataTransfer.getData('text/plain');
      const pluginData = JSON.parse(data);

      // Validate plugin type matches slot
      if (pluginData.type === slot.id) {
        onDrop(slot.id, pluginData);
      } else {
        console.warn(`Plugin type "${pluginData.type}" doesn't match slot "${slot.id}"`);
      }
    } catch (err) {
      console.error('Failed to parse dropped plugin data:', err);
    }
  };

  return (
    <div className="flex-1 flex-row items-center justify-center">
      {/* Slot Drop Zone - Receives dropped plugins */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative w-7 h-7 rounded border-2 transition-all flex flex-col items-center justify-center gap-1
          ${isEmpty
            ? 'border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
            : isValid
              ? 'border-solid border-green-400 bg-green-50'
              : 'border-solid border-gray-400 bg-white'
          }
        `}
      >
        {/* Empty State */}
        {isEmpty && (
          <>
            <Icon size={20} stroke={1.5} className="text-gray-400" />
       
          </>
        )}

        {/* Filled State */}
        {!isEmpty && pluginData && (
          <>
            <Icon size={20} stroke={1.75} className="text-gray-700" />
            <span className="text-[10px] font-medium text-gray-900 truncate w-full text-center px-1">
              {pluginData.label}
            </span>
            {/* Clear Button */}
            <button
              onClick={() => onClear(slot.id)}
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              <IconX size={8} className="text-gray-600" />
            </button>
          </>
        )}
      </div>

      {/* Slot Label */}
      <div className="text-[10px] text-gray-600">{slot.label}</div>
    </div>
  );
}

/**
 * Main PluginInsert Component
 */
export default function PluginInsert({
  slotData = {},
  onSlotFill,
  onSlotClear,
  queryIsValid = false
}) {
  // Toolbar buttons (placeholder for future functionality)
  const toolbarButtons = [];

  // Build center content - all 5 slots in a row
  const centerControls = (
    <div className="flex gap-1 items-center justify-center">
      {SLOTS.map(slot => (
        <PluginSlot
          key={slot.id}
          slot={slot}
          pluginData={slotData[slot.id]}
          onDrop={onSlotFill}
          onClear={onSlotClear}
          isValid={queryIsValid && slot.required}
        />
      ))}
    </div>
  );

  // No dropdown content for PluginInsert
  const menuContents = {};

  return (
    <div className="relative w-full h-full" data-ignore-outside="true">
      {/* ControlPanel with slots in center */}
      <ControlPanel
        centerControls={centerControls}
        leftButtons={toolbarButtons}
        rightButtons={[]}
        activeMenu={null}
        menuContents={menuContents}
        onMenuToggle={() => {}}
        showCenterControls={true}
      />
    </div>
  );
}
