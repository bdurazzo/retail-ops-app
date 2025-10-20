/**
 * ChA2 - Channel for A2 Section (Fixed Body)
 *
 * Renders in fixed column body cells.
 * Displays row data values.
 */

import React from 'react';
import ChannelStrip from '../../../../../components/ChannelStrip.jsx';
import { IconArrowBarDown, IconPrism, IconPrismLight, IconPrismPlus, IconTableDown, IconX } from '@tabler/icons-react';

export default function ChA2({
  rowId,
  columnKey,
  styles,
  cellValue,
  cellState = {},
  onCellStateUpdate = () => {},
  tableContext
}) {
  const section = 'A2';
  const cellKey = `${rowId}_${columnKey}`;
  const Styles = []

  return (
    <ChannelStrip
      section={section}
      rowId={rowId}
      columnKey={columnKey}
      styles={styles}
      pluginData={cellState[cellKey]}
      onUpdate={(data) => onCellStateUpdate(cellKey, data)}
      alwaysShowToolbar={false}
      disableToolbar={true}
      tableContext={tableContext}
      toolbarLeftContent={
        <div className="absolute left-0 top-0 right-0 h-6 ">
          <button
            className="flex p-1 justify-start hover:bg-gray-100 rounded transition-colors"
            onClick={() => console.log('Show nested variants')}
          >
            <IconPrismLight size={16} stroke={1.75}/>
          </button>
        </div>
      }
      toolbarCenterContent={
        <div className="absolute top-0 right-0 gap-1"></div>
      }
      toolbarRightContent={
        <div className="absolute top-0 right-0 h-6">
          <button
            className="flex p-1 justify-end hover:bg-gray-100 rounded transition-colors"
            onClick={() => console.log()}
          >
            <IconX size={14} stroke={1.75}/>
          </button>
        </div>
      }

    >
      {/* Cell value with padding for toolbar */}
      <div className="w-full px-4 flex items-center justify-start">
        <span className="block text-xs text-gray-700 truncate">{cellValue}</span>
      </div>
    </ChannelStrip>
  );
}
