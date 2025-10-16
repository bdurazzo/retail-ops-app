/**
 * MetricPicker
 *
 * Compact vertical scroller for table cell metric selection.
 * Matches the visual style: up arrow, dark pill with value, down arrow.
 */

import React, { useState, useEffect } from 'react';
import { IconCaretUpFilled, IconCaretDownFilled } from '@tabler/icons-react';

export default function MetricPicker({
  items = [],
  selectedValue,
  onValueChange = () => {}
}) {
  // Local state to track current selection
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sync with selectedValue prop when it changes externally
  useEffect(() => {
    const index = items.findIndex(item =>
      typeof item === 'object' ? item.value === selectedValue : item === selectedValue
    );
    if (index >= 0) {
      setCurrentIndex(index);
    }
  }, [selectedValue, items]);

  const handlePrevious = (e) => {
    e.stopPropagation();
    const newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    setCurrentIndex(newIndex);
    const newValue = typeof items[newIndex] === 'object' ? items[newIndex].value : items[newIndex];
    onValueChange(newValue);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    const newValue = typeof items[newIndex] === 'object' ? items[newIndex].value : items[newIndex];
    onValueChange(newValue);
  };

  const currentLabel = currentIndex >= 0 && items[currentIndex]
    ? (typeof items[currentIndex] === 'object' ? items[currentIndex].label : items[currentIndex])
    : '';

  return (
    <div className="flex flex-col items-center justify-center  h-full  relative z-[60]">
      {/* Up arrow */}
      <button
        type="button"
        onClick={handlePrevious}
        className="hover:opacity-70 transition-opacity  flex-none z-[60]"
      >
        <IconCaretUpFilled size={14} stroke={1.25} />
      </button>

      {/* Center pill with current value */}
      <div className="flex items-center justify-center w-[80px] h-[24px] rounded bg-gradient-to-l from-gray-700 via-gray-600 to-gray-700 flex-none">
        <span className="text-white text-xs font-medium truncate px-2">{currentLabel}</span>
      </div>

      {/* Down arrow */}
      <button
        type="button"
        onClick={handleNext}
        className="hover:opacity-70 transition-opacity flex-none z-[60]"
      >
        <IconCaretDownFilled size={14} stroke={1.25} />
      </button>
    </div>
  );
}
