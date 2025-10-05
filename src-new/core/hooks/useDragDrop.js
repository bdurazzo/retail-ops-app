/**
 * useDragDrop Hook
 *
 * Centralized React hook for managing drag/drop state and operations.
 * Provides consistent interface for all drag/drop interactions.
 */

import { useState } from 'react';
import { dragDropService } from '../services/dragDropService.js';

export function useDragDrop() {
  const [dragState, setDragState] = useState({
    isDragging: false,
    dragType: null,
    dragData: null
  });

  /**
   * Handle drag start - serialize data and update state
   * @param {string} type - One of DRAG_TYPES constants
   * @param {object} data - Data to attach to drag operation
   * @returns {string} Serialized data string for dataTransfer.setData()
   */
  const handleDragStart = (type, data) => {
    const serialized = dragDropService.serialize(type, data);

    setDragState({
      isDragging: true,
      dragType: type,
      dragData: data
    });

    return serialized;
  };

  /**
   * Handle drop - deserialize, validate, and execute callback
   * @param {DragEvent} e - The drop event
   * @param {string} expectedType - Expected DRAG_TYPE for validation
   * @param {function} onDrop - Callback to execute with validated data
   */
  const handleDrop = (e, expectedType, onDrop) => {
    e.preventDefault();

    const data = dragDropService.deserialize(e.dataTransfer);

    if (dragDropService.validate(data, expectedType)) {
      onDrop(data);
    } else {
      console.warn('[useDragDrop] Drop validation failed. Expected:', expectedType, 'Got:', data?.type);
    }

    setDragState({
      isDragging: false,
      dragType: null,
      dragData: null
    });
  };

  /**
   * Handle drag end - cleanup state
   */
  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      dragType: null,
      dragData: null
    });
  };

  /**
   * Handle drag over - required to allow drop
   * @param {DragEvent} e - The dragover event
   */
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return {
    dragState,
    handleDragStart,
    handleDrop,
    handleDragEnd,
    handleDragOver
  };
}
