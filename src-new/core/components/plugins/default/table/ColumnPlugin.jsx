/**
 * ColumnPlugin - Minimal Shell
 *
 * Simple expand/collapse container matching TablePlugin aesthetic.
 * You can customize the toolbar content and expanded content.
 */

import React from 'react';
import Toolbar from '../../../../../components/Toolbar.jsx';
import { MODULE_STYLES, MODULE_LAYOUT } from '../../../custom/table/tableProps.js';
import { IconOutlet } from '@tabler/icons-react';

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

  const handleDragStart = (e) => {
    const pluginData = {
      type: 'column',
      id: 'column-plugin',
      label: 'Column',
      title: title
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(pluginData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className="w-full h-full flex items-center"
      draggable
      onDragStart={handleDragStart}
    >
      {/* Toolbar matching TablePlugin style */}
      <Toolbar
        height={MODULE_LAYOUT.rowHeight}
        borderWidth={0}
        shadowSize=""
        paddingX={0}
        backgroundColor="bg-gradient-to-r from-gray-100/100 via-transparent to-transparent"
        className="w-full h-full pl-2 cursor-pointer hover:bg-gray-100 rounded-none"
        leftContent={
          <div
            className="h-5 w-5 shadow bg-gradient-to-t from-gray-100 via-gray-50 to-gray-200 rounded"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const data = e.dataTransfer.getData('text/plain');
              console.log('Column plugin drop:', data);
            }}
          >
            <div className="flex justify-center items-center h-full">
              <IconOutlet size={14} />
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
