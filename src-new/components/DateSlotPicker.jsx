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
    // Reset the timer whenever any scroller is active
    clearTimeout(this.timeoutId);
    this.timeoutId = null;
  }

  scheduleApply(action) {
    this.pendingActions.push(action);
    
    // Only start the timer if it's not already running
    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        // Execute all pending actions
        this.pendingActions.forEach(action => action());
        this.pendingActions = [];
        this.timeoutId = null;
        
        // Notify that all values have been applied
        if (this.onApply) {
          this.onApply();
        }
      }, this.delay);
    }
  }
}

const DateSlotPicker = ({
  isOpen = false,
  onClose = () => {},
  onDateSelect = () => {},
  initialDate = null,
  anchorRef = null,
  className = "",
  dateType = "date" // "start", "end", or "date"
}) => {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const pickerRef = useRef(null);
  
  // Create scroll coordinator that does NOT auto-apply values
  const scrollCoordinatorRef = useRef(null);
  if (!scrollCoordinatorRef.current) {
    scrollCoordinatorRef.current = new ScrollCoordinator(() => {
      // Don't auto-apply or close - wait for outside click
    }, 1500);
  }

  // Generate month options (restrict future months for current year)
  const generateMonths = () => {
    const allMonths = [
      { value: 1, label: 'Jan' },
      { value: 2, label: 'Feb' },
      { value: 3, label: 'Mar' },
      { value: 4, label: 'Apr' },
      { value: 5, label: 'May' },
      { value: 6, label: 'Jun' },
      { value: 7, label: 'Jul' },
      { value: 8, label: 'Aug' },
      { value: 9, label: 'Sep' },
      { value: 10, label: 'Oct' },
      { value: 11, label: 'Nov' },
      { value: 12, label: 'Dec' }
    ];

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // If selected year is current year, limit to current month
    if (selectedYear === currentYear) {
      return allMonths.filter(month => month.value <= currentMonth);
    }
    
    return allMonths;
  };

  // Generate year options (only past and current year)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 10; y <= currentYear; y++) {
    years.push({ value: y, label: y.toString() });
  }

  // Generate day options based on selected month/year
  const getDaysInMonth = (month, year) => {
    if (!month || !year) return 31; // Default to max days
    return new Date(year, month, 0).getDate();
  };

  const generateDays = () => {
    const daysCount = getDaysInMonth(selectedMonth, selectedYear);
    const days = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    // If this is the current month and year, limit to current day
    const maxDay = (selectedYear === currentYear && selectedMonth === currentMonth) 
      ? currentDay 
      : daysCount;
    
    for (let d = 1; d <= maxDay; d++) {
      days.push({ value: d, label: d.toString().padStart(2, '0') });
    }
    return days;
  };

  // Initialize from initialDate
  useEffect(() => {
    if (initialDate) {
      const date = new Date(initialDate);
      setSelectedMonth(date.getMonth() + 1);
      setSelectedDay(date.getDate());
      setSelectedYear(date.getFullYear());
    } else {
      // Default to current date
      const now = new Date();
      setSelectedMonth(now.getMonth() + 1);
      setSelectedDay(now.getDate());
      setSelectedYear(now.getFullYear());
    }
  }, [initialDate, isOpen]);


  // Auto-update when values change
  useEffect(() => {
    if (selectedMonth && selectedDay && selectedYear) {
      const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
      onDateSelect(date);
    }
  }, [selectedMonth, selectedDay, selectedYear]);

  // Adjust selected day if it exceeds days in month (only when month/year changes, not day)
  useEffect(() => {
    if (selectedMonth && selectedYear && selectedDay) {
      const maxDays = getDaysInMonth(selectedMonth, selectedYear);
      if (selectedDay > maxDays) {
        setSelectedDay(maxDays);
      }
    }
  }, [selectedMonth, selectedYear]); // Removed selectedDay from dependencies

  // Position picker centered in viewport
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen) {
      // Center in viewport
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

  return (
    <div
      ref={pickerRef}
      className={`fixed z-50 bg-gradient-to-b from-white via-gray-50 to-gray-100 rounded-xl shadow-xl border border-gray-100 transform -translate-x-1/2 -translate-y-1/2 ${className}`}
      style={{ 
        top: position.top, 
        left: position.left,
        width: '250px',
        transform: 'translate(-50%, -95%)'
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-gradient-to-b from-gray-100 via-white to-gray-100 rounded-t-xl border-b">
        <div className="flex items-center justify-between">
          <div></div> {/* Spacer for centering */}
          <span className="text-sm font-semibold text-gray-800">
            {dateType === "start" ? "Start Date" : dateType === "end" ? "End Date" : "Select Date"}
          </span>
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
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-900 mb-1 text-center overflow-auto">Month</div>
          <SlotScroller
            items={generateMonths()}
            selectedValue={selectedMonth}
            onValueChange={setSelectedMonth}
            height={140}
            itemHeight={32}
            visibleItems={3}
            showArrows={true}
            scrollCoordinator={scrollCoordinatorRef.current}
          />
        </div>
        
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-900 mb-1 text-center">Day</div>
          <SlotScroller
            items={generateDays()}
            selectedValue={selectedDay}
            onValueChange={setSelectedDay}
            height={140}
            itemHeight={32}
            visibleItems={3}
            showArrows={true}
            scrollCoordinator={scrollCoordinatorRef.current}
          />
        </div>
        
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-900 mb-1 text-center">Year</div>
          <SlotScroller
            items={years}
            selectedValue={selectedYear}
            onValueChange={setSelectedYear}
            height={140}
            itemHeight={32}
            visibleItems={3}
            showArrows={true}
            scrollCoordinator={scrollCoordinatorRef.current}
          />
        </div>
      </div>

      {/* Footer with current selection */}
      <div className="px-3 py-2 bg-gradient-to-b from-gray-200 via-white to-gray-100 rounded-b-xl border-t border-gray-200">
        <div className="text-center text-sm font-semibold text-gray-700">
          {selectedMonth && selectedDay && selectedYear ? 
            `${generateMonths().find(m => m.value === selectedMonth)?.label} ${selectedDay}, ${selectedYear}` :
            'Select a date'
          }
        </div>
      </div>
    </div>
  );
};

export default DateSlotPicker;