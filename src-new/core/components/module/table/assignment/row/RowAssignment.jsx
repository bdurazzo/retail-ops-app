/**
 * Row Assignment Component
 *
 * Represents a destination for data rows in TableBody.
 * Can accept nested drops for dataSource, filter, and plugin assignments.
 * When plugin dropped, row becomes expandable (similar to TablePlugin).
 */

import React from 'react';
import { useDragDrop } from '../../../../../hooks/useDragDrop.js';
import { DRAG_TYPES } from '../../../../../utils/dragDropTypes.js';

export default function RowAssignment({
  id = `row-${Date.now()}`,
  dataSource = null,
  filter = null,
  plugin = null,
  nestedAssignments = [],
  onUpdate = () => {},
  isDraggable = true
}) {
  const { handleDragStart, handleDrop, handleDragOver } = useDragDrop();

  const onDragStart = (e) => {
    const assignmentData = {
      id,
      dataSource,
      filter,
      plugin,
      nestedAssignments
    };

    const serialized = handleDragStart(DRAG_TYPES.ROW_ASSIGNMENT, assignmentData);
    e.dataTransfer.setData('text/plain', serialized);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onNestedDrop = (e) => {
    e.stopPropagation();

    handleDrop(e, null, (droppedData) => {
      const updatedAssignment = {
        id,
        dataSource,
        filter,
        plugin,
        nestedAssignments: [...nestedAssignments, droppedData]
      };

      onUpdate(updatedAssignment);
    });
  };

  const displayText = dataSource ? String(dataSource).substring(0, 20) : 'Data';

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDrop={onNestedDrop}
      onDragOver={handleDragOver}
      className="flex-none px-3 flex items-center text-[11px] border-r border-gray-100 relative z-10 cursor-move bg-white"
      style={{ width: 100, height: 35 }}
    >
      <span className="text-gray-600">{displayText}</span>
    </div>
  );
}
