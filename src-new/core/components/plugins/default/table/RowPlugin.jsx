/**
 * RowPlugin - Minimal Shell
 *
 * Simple expand/collapse container matching TablePlugin aesthetic.
 * You can customize the toolbar content and expanded content.
 */

import React from 'react';
import Toolbar from '../../../../../components/Toolbar.jsx';
import { MODULE_STYLES, MODULE_LAYOUT } from '../../../custom/table/tableProps.js';
import { IconCrosshair, IconOutlet } from '@tabler/icons-react';

export default function RowPlugin({
  row,
  cellState = {},
  onCellStateUpdate = () => {},
  expandedRows = {},
  toggleRowExpanded = () => {},
  title = 'Row Plugin',
  children,
  ...props
}) {
  const rowId = row?._rowId;
  const isExpanded = expandedRows[rowId] || false;

  const handleDragStart = (e) => {
    const pluginData = {
      type: 'row',
      id: 'row-plugin',
      label: 'Product',
      title: title
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(pluginData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className="w-full h-full p-1 flex items-center"
      draggable
      onDragStart={handleDragStart}
    >
      {/* Toolbar matching TablePlugin style */}
      <Toolbar
        height={MODULE_LAYOUT.rowHeight}
        borderWidth={0}
        shadowSize=""
        paddingX={0}
        backgroundColor="bg-gradient-to-r from-gray-100/30 via-transparent to-transparent"
        className="w-full h-full pl-2 cursor-pointer hover:bg-gray-100 rounded-none"
        leftContent={
          <div
            className=""
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const data = e.dataTransfer.getData('text/plain');
              console.log('Row plugin drop:', data);
            }}
          >
            <div className="flex text-gray-400 justify-center items-center">
              <IconCrosshair size={24} stroke={1.5} />
            </div>
          </div>
        }
        centerContent={
          <div className="flex-1 flex h-full w-full items-center pl-6">
            <span className="text-[11px] truncate text-gray-600 font-medium">{title}</span>
          </div>
        }
      />
    </div>
  );
}
