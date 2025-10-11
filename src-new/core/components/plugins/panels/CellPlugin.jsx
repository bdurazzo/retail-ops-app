import React from 'react';

export default function CellPlugin({ onPanelStateChange, panelCommand }) {
  return (
    <div className="flex h-[100px] items-center justify-center">
      <div className="text-sm text-gray-600">
        Cell Plugin - Drop zone for filter plugins
      </div>
    </div>
  );
}
