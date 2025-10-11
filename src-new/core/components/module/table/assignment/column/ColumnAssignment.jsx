/**
 * Column Assignment Component
 *
 * Draggable UI card that represents a column slot in the table.
 * Can be dropped on TableHeader or TableFooter.
 * Accepts nested drops (LabelAssignment, FormatterAssignment, etc.)
 */

import React from 'react';
import { useDragDrop } from '../../../../../hooks/useDragDrop.js';
import { DRAG_TYPES } from '../../../../../utils/dragDropTypes.js';

export default function ColumnAssignment({
  id = `col-${Date.now()}`,
  columnKey,
  label = null,
  width = 100,
  alignment = 'center',
  nestedAssignments = [],
  onUpdate = () => {},
  isDraggable = true
}) {
  const { handleDragStart, handleDrop, handleDragOver } = useDragDrop();

  const onDragStart = (e) => {
    const assignmentData = {
      id,
      columnKey,
      label,
      width,
      alignment,
      nestedAssignments
    };

    const serialized = handleDragStart(DRAG_TYPES.COLUMN_ASSIGNMENT, assignmentData);
    e.dataTransfer.setData('text/plain', serialized);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onNestedDrop = (e) => {
    e.stopPropagation();

    handleDrop(e, null, (droppedData) => {
      if (droppedData.type === DRAG_TYPES.LABEL_ASSIGNMENT) {
        onUpdate({
          id,
          columnKey,
          label: droppedData.label,
          width,
          alignment,
          nestedAssignments: [...nestedAssignments, droppedData]
        });
      }
    });
  };

  const displayLabel = label ||
    nestedAssignments.find(a => a.type === DRAG_TYPES.LABEL_ASSIGNMENT)?.label ||
    columnKey;

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDrop={onNestedDrop}
      onDragOver={handleDragOver}
      className="flex-none px-3 flex items-center text-xs shadow-lg shadow-gray-300 text-gray-600 font-semibold relative z-50 bg-gradient-to-b from-gray-200 via-white to-gray-100 border-r border-gray-200 cursor-move transition-colors hover:bg-gradient-to-b hover:from-gray-300 hover:via-gray-100 hover:to-gray-200"
      style={{ width, height: 35 }}
    >
      <span className="text-gray-700">{displayLabel}</span>
    </div>
  );
}
