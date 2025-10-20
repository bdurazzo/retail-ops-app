/**
 * ChB2 - Channel for B2 Section (Scrolling Body)
 *
 * Renders in scrolling column body cells.
 * Displays calculated metric values.
 */

import React from 'react';
import ChannelStrip from '../../../../../components/ChannelStrip.jsx';
import { IconTableDown } from '@tabler/icons-react';

export default function ChB2({
  rowId,
  columnKey,
  cellValue,
  cellState = {},
  onCellStateUpdate = () => {},
  tableContext
}) {
  const section = 'B2';
  const cellKey = `${rowId}_${columnKey}`;
  const allowedFilters = [];

  return (
    <ChannelStrip
      section={section}
      rowId={rowId}
      columnKey={columnKey}
      allowedFilters={allowedFilters}
      pluginData={cellState[cellKey]}
      onUpdate={(data) => onCellStateUpdate(cellKey, data)}
      tableContext={tableContext}
      disableToolbar={true}
      toolbarLeftContent={
        <div className="absolute left-0 top-0 h-5 bg-transparant">
          <button
            className="absolute left-0 top-0 hover:bg-gray-100 rounded transition-colors"
            onClick={() => console.log('Show nested variants')}
          >
            <IconTableDown size={14} stroke={1.75}/>
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
      {/* Display cell value */}
      <span className="text-xs text-gray-700">{cellValue}</span>
    </ChannelStrip>
  );
}
