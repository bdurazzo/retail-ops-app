/**
 * ChA1 - Channel for A1 Section (Fixed Header)
 *
 * Renders in fixed column headers.
 * Accepts: Product filters (defines row dimension)
 */

import React from 'react';
import ChannelStrip from '../../../../../components/ChannelStrip.jsx';
import { IconShirtFilled, IconBriefcaseFilled, IconClockFilled, IconLayoutSidebarFilled, IconTableDown } from '@tabler/icons-react';
import { getSortIndicator } from '../../../../utils/tableSorting.js';

export default function ChA1({
  columnKey,
  columnLabel,
  columnState = {},
  onColumnStateUpdate = () => {},
  tableContext
}) {
  const section = 'A1';
  const { sortKey, sortDirection } = tableContext || {};

  return (
    <ChannelStrip
      section={section}
      columnKey={columnKey}
      pluginData={columnState[columnKey]}
      onUpdate={(data) => onColumnStateUpdate(columnKey, data)}
      tableContext={tableContext}
      noPadding={false}
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
      <span className="flex items-center justify-center  w-[70px] h-[25px] bg-gradient-to-l from-gray-700 via-gray-600/90 to-gray-700 text-white rounded">{columnLabel}</span>
      {sortKey === columnKey && (
        <span className="absolute right-3 text-gray-600">
          {getSortIndicator(columnKey, sortKey, sortDirection)}
        </span>
      )}
    </ChannelStrip>
  );
}
