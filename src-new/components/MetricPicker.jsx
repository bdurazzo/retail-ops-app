/**
 * MetricPicker
 *
 * Compact vertical scroller for table cell metric selection.
 * Matches the visual style: up arrow, dark pill with value, down arrow.
 */

import React, { useState, useEffect } from 'react';
import { IconCaretUpFilled, IconCaretDownFilled, IconCaretLeftFilled, IconCaretRightFilled } from '@tabler/icons-react';

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
    <div className="flex shadow items-center justify-center bg-gradient-to-t rounded from-gray-100 via-white to-gray-100 h-full w-full  relative z-[60]">
      {/* Up arrow */}
      <button
        type="button"
        onClick={handlePrevious}
        className="flex relative items-center hover:bg-gray-50 transition-colors flex-none z-[60]"
      >
        <IconCaretLeftFilled size={14} stroke={1.25} />
      </button>

      {/* Center pill with current value */}
      <div className="flex items-center justify-center rounded-t rounded-b border border-gray-500 w-[70px] h-[25px] bg-gradient-to-l from-gray-700 via-gray-600/90 to-gray-700 flex-none">
        <span className="text-gray-50 text-[11px] font-medium truncate px-2">{currentLabel}</span>
      </div>

      {/* Down arrow */}
      <button
        type="button"
        onClick={handleNext}
        className="flex relative items-center hover:bg-gray-50 transition-colors flex-none z-[60]"
      >
        <IconCaretRightFilled size={14} stroke={1.25} />
      </button>
    </div>
  );
}
