/**
 * SlotInput
 *
 * Generic trigger component for SlotPicker.
 * Can display single or multiple selected values.
 */

import React, { useState, useRef } from 'react';
import SlotPicker from './SlotPicker.jsx';

export default function SlotInput({
  value = {},
  onChange = () => {},
  onSubmit = () => {},
  slots = [],
  placeholder = 'Select...',
  title = 'Select Parameters',
  className = ''
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const inputRef = useRef(null);

  const handleValuesChange = (values) => {
    onChange(values);
  };

  const handleClose = () => {
    setIsPickerOpen(false);
    onSubmit(value);
  };

  const handleInputClick = () => {
    setIsPickerOpen(true);
  };

  // Format display value
  const getDisplayValue = () => {
    if (!value || Object.keys(value).length === 0) {
      return placeholder;
    }

    const displayParts = slots.map(slot => {
      const selectedValue = value[slot.key];
      if (selectedValue === undefined) return '';

      const item = slot.items.find(i =>
        (typeof i === 'object' ? i.value : i) === selectedValue
      );
      return typeof item === 'object' ? item.label : item;
    }).filter(Boolean);

    return displayParts.join(' • ');
  };

  return (
    <>
      <div
        ref={inputRef}
        onClick={handleInputClick}
        className={`cursor-pointer px-3 py-2 bg-white border border-gray-300 rounded text-sm hover:border-gray-400 transition-colors ${className}`}
      >
        {getDisplayValue()}
      </div>

      <SlotPicker
        isOpen={isPickerOpen}
        onClose={handleClose}
        onValuesChange={handleValuesChange}
        slots={slots}
        title={title}
        anchorRef={inputRef}
      />
    </>
  );
}
