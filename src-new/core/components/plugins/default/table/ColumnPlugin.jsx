/**
 * ColumnPlugin - Minimal Shell
 *
 * Simple expand/collapse container matching TablePlugin aesthetic.
 * You can customize the toolbar content and expanded content.
 */

import React, { useState } from 'react';
import Toolbar from '../../../../../components/Toolbar.jsx';
import { MODULE_STYLES, MODULE_LAYOUT } from '../../../custom/table/tableProps.js';
import {
  IconOutlet,
  IconShirtFilled,
  IconClockFilled,
  IconBriefcaseFilled,
  IconTemperaturePlusFilled,
  IconChartDots2Filled
} from '@tabler/icons-react';

// Map slot types to icons
const SLOT_ICONS = {
  product: IconShirtFilled,
  time: IconClockFilled,
  metric: IconBriefcaseFilled,
  element: IconTemperaturePlusFilled,
  trend: IconChartDots2Filled
};

export default function ColumnPlugin({
  row,
  cellState = {},
  onCellStateUpdate = () => {},
  expandedRows = {},
  toggleRowExpanded = () => {},
  title = 'Column Plugin',
  children,
  ...props
}) {
  const rowId = row?._rowId;
  const isExpanded = expandedRows[rowId] || false;
  const [assignedSlot, setAssignedSlot] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isActivated = !!assignedSlot;
  const SlotIcon = assignedSlot ? SLOT_ICONS[assignedSlot.slotType] : IconOutlet;

  const handleDragStart = (e) => {
    if (!isActivated) {
      e.preventDefault();
      return;
    }

    const pluginData = {
      type: 'column',
      id: 'column-plugin',
      slotType: assignedSlot.slotType,
      label: assignedSlot.label,
      title: title
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(pluginData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const data = e.dataTransfer.getData('text/plain');
      const slotData = JSON.parse(data);

      if (slotData.slotType) {
        setAssignedSlot(slotData);
        console.log('Column plugin activated with slot:', slotData);
      }
    } catch (err) {
      console.error('Failed to parse slot data:', err);
    }
  };

  return (
    <div
      className={`w-full h-full flex items-center ${isActivated ? 'cursor-grab active:cursor-grabbing' : ''}`}
      draggable={isActivated}
      onDragStart={handleDragStart}
    >
      {/* Toolbar matching TablePlugin style */}
      <Toolbar
        height={MODULE_LAYOUT.rowHeight}
        borderWidth={0}
        shadowSize=""
        paddingX={0}
        backgroundColor={isActivated ? "bg-gradient-to-r from-gray-100 via-white to-transparent" : "bg-gradient-to-r from-gray-100/100 via-transparent to-transparent"}
        className={`w-full h-full pl-2 rounded-none ${isActivated ? 'hover:bg-gray-50' : ''}`}
        leftContent={
          <div
            className={`h-5 w-5 shadow rounded transition-all ${isDragOver ? 'bg-blue-200' : isActivated ? 'bg-gradient-to-t from-gray-200 via-gray-100 to-gray-300' : 'bg-gradient-to-t from-gray-100 via-gray-50 to-gray-200'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={`flex justify-center items-center h-full ${isActivated ? 'text-gray-700' : 'text-gray-500'}`}>
              <SlotIcon size={14} stroke={isActivated ? 2 : 1.5} />
            </div>
          </div>
        }
        centerContent={
          <div className="flex-1 flex h-full w-full items-center pl-6">
            <span className={`text-[11px] truncate font-medium ${isActivated ? 'text-gray-700' : 'text-gray-500'}`}>
              {isActivated ? `${assignedSlot.label} Column` : title}
            </span>
          </div>
        }
      />
    </div>
  );
}
