import React from "react";

export default function SortContextMenu({
  position,
  columnKey,
  isInStack,
  currentDirection,
  onAddRemove,
  onToggleDirection,
  onClearStack,
  onClose
}) {
  if (!position) return null;

  return (
    <div
      className="absolute z-50 bg-white shadow-md border rounded text-xs w-48"
      style={{ top: position.y, left: position.x }}
      onMouseLeave={onClose}
    >
      <div className="p-2 border-b font-medium text-gray-800">{columnKey}</div>
      <button
        onClick={() => { onAddRemove(); onClose(); }}
        className="w-full text-left px-3 py-2 hover:bg-blue-100"
      >
        {isInStack ? "Remove from sort stack" : "Add to sort stack"}
      </button>
      <button
        onClick={() => { onToggleDirection(); onClose(); }}
        className="w-full text-left px-3 py-2 hover:bg-blue-100"
      >
        Sort {currentDirection === "asc" ? "Descending" : "Ascending"}
      </button>
      <button
        onClick={() => { onClearStack(); onClose(); }}
        className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-100"
      >
        Clear Sort Stack
      </button>
    </div>
  );
}
