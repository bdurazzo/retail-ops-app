import React from "react";
import Toolbar from "../../../../../components/Toolbar.jsx";
import { IconChartDots2Filled, IconTrash } from '@tabler/icons-react';

export function TrendFilterToolbar() {
  const leftContent = (
    <div className="flex items-center gap-1">
      <button className="p-1 rounded transition-colors text-gray-600 hover:bg-gray-100 flex flex-col items-center w-8">
        <IconChartDots2Filled size={16} stroke={1.75} />
        <span className="text-[10px] leading-none">Trend</span>
      </button>
      <div className="w-[2px] h-8 bg-gray-200 ml-1"></div>
    </div>
  );

  const centerContent = (
    <span className="text-xs text-gray-600">No trends</span>
  );

  const rightContent = (
    <button className="p-1 rounded hover:bg-gray-100 text-gray-600" title="Clear filter">
      <IconTrash size={18} />
    </button>
  );

  return (
    <Toolbar
      leftContent={leftContent}
      centerContent={centerContent}
      rightContent={rightContent}
      height="9"
      borderWidth={0}
      shadowSize="md"
      rounded="rounded-md"
      paddingX={2}
    />
  );
}

export default function TrendFilter({ panelState }) {
  return (
    <div className="space-y-3">
      <TrendFilterToolbar />
      <div className="p-4 text-sm text-gray-600">
       Placeholder
      </div>
    </div>
  );
}