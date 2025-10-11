/**
 * Label Assignment Component
 *
 * Draggable UI card that represents a custom label for a column.
 * Can be dropped onto ColumnAssignment to set custom display name.
 * Includes text input for user to type custom label.
 */

import React, { useState } from 'react';
import { useDragDrop } from '../../../../../hooks/useDragDrop.js';
import { DRAG_TYPES } from '../../../../../utils/dragDropTypes.js';

export default function LabelAssignment({
  id = `label-${Date.now()}`,
  label = '',
  sourceField = null,
  onUpdate = () => {},
  isDraggable = true
}) {
  const { handleDragStart } = useDragDrop();
  const [localLabel, setLocalLabel] = useState(label);

  const onDragStart = (e) => {
    const assignmentData = {
      id,
      label: localLabel || label,
      sourceField
    };

    const serialized = handleDragStart(DRAG_TYPES.LABEL_ASSIGNMENT, assignmentData);
    e.dataTransfer.setData('text/plain', serialized);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLabelChange = (e) => {
    const newLabel = e.target.value;
    setLocalLabel(newLabel);
    onUpdate({ id, label: newLabel, sourceField });
  };

  return (
    <div className="flex-none px-3 flex items-center text-[11px] shadow-lg shadow-gray-300 relative z-50 bg-white border-r border-gray-200">
      <input
        type="text"
        value={localLabel}
        onChange={handleLabelChange}
        draggable={isDraggable && localLabel.trim().length > 0}
        onDragStart={onDragStart}
        placeholder="Label"
        className="px-2 py-1 text-[11px] text-gray-600 border border-gray-100 bg-gray-50"
        style={{ width: 100, height: 32 }}
      />
    </div>
  );
}
