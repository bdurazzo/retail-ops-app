/**
 * SlotPicker
 *
 * Generic multi-slot picker component.
 * Coordinates multiple SlotScrollers for selecting related parameters.
 */

import React, { useState, useEffect, useRef } from 'react';
import SlotScroller from './SlotScroller.jsx';

// Coordinate apply actions across multiple slot scrollers
class ScrollCoordinator {
  constructor(onApply, delay = 2000) {
    this.onApply = onApply;
    this.delay = delay;
    this.timeoutId = null;
    this.pendingActions = [];
  }

  notifyScrollActivity() {
    clearTimeout(this.timeoutId);
    this.timeoutId = null;
  }

  scheduleApply(action) {
    this.pendingActions.push(action);

    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.pendingActions.forEach(action => action());
        this.pendingActions = [];
        this.timeoutId = null;

        if (this.onApply) {
          this.onApply();
        }
      }, this.delay);
    }
  }
}

export default function SlotPicker({
  isOpen = false,
  onClose = () => {},
  onValuesChange = () => {},
  slots = [], // Array of { key, label, items, initialValue }
  title = 'Select Parameters',
  anchorRef = null,
  className = ''
}) {
  const [selectedValues, setSelectedValues] = useState({});
  const pickerRef = useRef(null);
  const hasInitialized = useRef(false);

  // Create scroll coordinator
  const scrollCoordinatorRef = useRef(null);
  if (!scrollCoordinatorRef.current) {
    scrollCoordinatorRef.current = new ScrollCoordinator(() => {
      // Don't auto-apply or close - wait for outside click
    }, 1500);
  }

  // Initialize selected values from slots ONCE when opening
  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      const initialValues = {};
      slots.forEach(slot => {
        initialValues[slot.key] = slot.initialValue !== undefined
          ? slot.initialValue
          : (slot.items[0]?.value || slot.items[0]);
      });
      setSelectedValues(initialValues);
      hasInitialized.current = true;
    }
    if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [isOpen]);

  // Auto-update parent when values change
  useEffect(() => {
    if (Object.keys(selectedValues).length > 0) {
      onValuesChange(selectedValues);
    }
  }, [selectedValues]);

  // Handle value change for a specific slot
  const handleValueChange = (key, value) => {
    setSelectedValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Position picker
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen) {
      setPosition({
        top: '50%',
        left: '50%'
      });
    }
  }, [isOpen]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target) &&
          anchorRef?.current && !anchorRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const slotWidth = slots.length > 0 ? `${Math.floor(100 / slots.length)}%` : '100%';

  return (
    <div
      ref={pickerRef}
      className={`fixed z-50 bg-gradient-to-b from-white via-gray-50 to-gray-100 rounded-xl shadow-xl border border-gray-100 transform -translate-x-1/2 -translate-y-1/2 ${className}`}
      style={{
        top: position.top,
        left: position.left,
        width: `${slots.length * 90}px`,
        minWidth: '200px',
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-gradient-to-b from-gray-100 via-white to-gray-100 rounded-t-xl border-b">
        <div className="flex items-center justify-between">
          <div></div>
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Slot scrollers */}
      <div className="flex gap-2 p-3">
        {slots.map(slot => (
          <div key={slot.key} style={{ width: slotWidth }}>
            <div className="text-xs font-medium text-gray-900 mb-1 text-center">
              {slot.label}
            </div>
            <SlotScroller
              items={slot.items}
              selectedValue={selectedValues[slot.key]}
              onValueChange={(value) => handleValueChange(slot.key, value)}
              height={140}
              itemHeight={32}
              visibleItems={3}
              showArrows={true}
              scrollCoordinator={scrollCoordinatorRef.current}
            />
          </div>
        ))}
      </div>

      {/* Footer with current selection */}
      <div className="px-3 py-2 bg-gradient-to-b from-gray-200 via-white to-gray-100 rounded-b-xl border-t border-gray-200">
        <div className="text-center text-xs font-medium text-gray-700">
          {slots.map(slot => {
            const item = slot.items.find(i =>
              (typeof i === 'object' ? i.value : i) === selectedValues[slot.key]
            );
            const label = typeof item === 'object' ? item.label : item;
            return label;
          }).join(' • ')}
        </div>
      </div>
    </div>
  );
}
