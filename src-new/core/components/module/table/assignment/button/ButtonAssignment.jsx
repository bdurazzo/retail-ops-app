/**
 * Button Assignment Component
 *
 * Draggable UI card that represents an action button for the toolbar.
 * Can be dropped on TableToolbar.
 * Accepts nested drops for filter/action configuration.
 */

import React from 'react';
import { useDragDrop } from '../../../../../hooks/useDragDrop.js';
import { DRAG_TYPES } from '../../../../../utils/dragDropTypes.js';

export default function ButtonAssignment({
  id = `button-${Date.now()}`,
  label = 'Button',
  action = '',
  params = {},
  nestedAssignments = [],
  onUpdate = () => {},
  isDraggable = true
}) {
  const { handleDragStart, handleDrop, handleDragOver } = useDragDrop();

  const onDragStart = (e) => {
    const assignmentData = {
      id,
      label,
      action,
      params,
      nestedAssignments
    };

    const serialized = handleDragStart(DRAG_TYPES.BUTTON_ASSIGNMENT, assignmentData);
    e.dataTransfer.setData('text/plain', serialized);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onNestedDrop = (e) => {
    e.stopPropagation();

    handleDrop(e, null, (droppedData) => {
      onUpdate({
        id,
        label,
        action,
        params,
        nestedAssignments: [...nestedAssignments, droppedData]
      });
    });
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDrop={onNestedDrop}
      onDragOver={handleDragOver}
      className="px-3 flex items-center text-xs text-gray-600 font-semibold border-r border-gray-100 cursor-move bg-gradient-to-b from-gray-100 via-white to-gray-50 transition-colors hover:bg-gradient-to-b hover:from-gray-200 hover:via-gray-100 hover:to-gray-100"
      style={{ height: 35 }}
    >
      <span className="text-gray-700">{label}</span>
    </div>
  );
}
