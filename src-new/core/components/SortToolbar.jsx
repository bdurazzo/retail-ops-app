import React from 'react';

// SortToolbar: Shows sorting options for grouped table views
// Only one column can be selected at a time for primary sorting
export default function SortToolbar({ 
  availableColumns = [], 
  currentSortColumn = null,
  onSortChange,
  className = ""
}) {
  
  const handleColumnToggle = (columnKey) => {
    // Only one column can be selected at a time
    const newSortColumn = currentSortColumn === columnKey ? null : columnKey;
    onSortChange?.(newSortColumn);
  };

  if (!availableColumns.length) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 px-2 py-1 text-sm bg-gray-50 border-b border-gray-200 ${className}`}>
      <span className="text-gray-700 font-medium">sort by:</span>
      <div className="flex items-center gap-3">
        {availableColumns.map((column) => {
          const isSelected = currentSortColumn === column.key;
          
          return (
            <label
              key={column.key}
              className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleColumnToggle(column.key)}
                className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className={`text-xs ${isSelected ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                {column.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}