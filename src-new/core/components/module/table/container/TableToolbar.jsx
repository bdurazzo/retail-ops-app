/**
 * TableToolbar
 *
 * Visible toolbar bar that sits below the plugin toolbar
 */

import React from 'react';

export default function TableToolbar({ tableContext }) {
  return (
    <div className="flex h-[40px] items-center gap-2 px-4 bg-gradient-to-b from-white via-gray-50 to-gray-100 border-b border-gray-200">
      <span className="text-xs text-gray-600">Table Toolbar</span>
    </div>
  );
}
