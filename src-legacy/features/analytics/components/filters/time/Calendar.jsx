import React, { useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar = ({ 
  startDate,
  endDate,
  onRangeChange,
  minDate,
  maxDate,
  viewMonth,   // Now received from TimePanel
  viewYear     // Now received from TimePanel
}) => {
  const [hoveredDate, setHoveredDate] = useState(null);

  // Multi-click tracking
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickedDate, setLastClickedDate] = useState(null);
  
  // Track which boundary was last modified
  const [lastModified, setLastModified] = useState(null); // 'start' or 'end'

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateInRange = (date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateInHoverRange = (date) => {
    if (!hoveredDate) return false;
    
    if (!startDate && !endDate) {
      // No existing range - hover shows what single day range would be created
      return date.getTime() === hoveredDate.getTime();
    } else if (startDate && endDate) {
      // Existing range - show what new range would be after clicking
      let newStart, newEnd;
      
      if (hoveredDate < startDate) {
        // Hovering before start - would expand backward
        newStart = hoveredDate;
        newEnd = endDate;
      } else if (hoveredDate > endDate) {
        // Hovering after end - would expand forward
        newStart = startDate;
        newEnd = hoveredDate;
      } else {
        // Hovering within range
        if (hoveredDate.getTime() === startDate.getTime()) {
          // Hovering on start - would contract to end date only
          newStart = endDate;
          newEnd = endDate;
        } else if (hoveredDate.getTime() === endDate.getTime()) {
          // Hovering on end - would contract to start date only
          newStart = startDate;
          newEnd = startDate;
        } else {
          // Hovering in middle - would move opposite boundary
          if (lastModified === 'start') {
            // Last action moved start, so hovering would move end
            newStart = startDate;
            newEnd = hoveredDate;
          } else {
            // Last action moved end, so hovering would move start
            newStart = hoveredDate;
            newEnd = endDate;
          }
        }
      }
      
      return date >= newStart && date <= newEnd;
    } else {
      // Shouldn't reach here with current logic, but fallback to single day
      return date.getTime() === hoveredDate.getTime();
    }
  };

  const isDateRangeStart = (date) => {
    return startDate && date.getTime() === startDate.getTime();
  };

  const isDateRangeEnd = (date) => {
    return endDate && date.getTime() === endDate.getTime();
  };

  const isDateDisabled = (date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    
    const now = Date.now();
    const isSameDate = lastClickedDate?.getTime() === date.getTime();
    const isWithinDoubleClickTime = (now - lastClickTime) < 300;
    
    let newClickCount = 1;
    if (isSameDate && isWithinDoubleClickTime) {
      newClickCount = clickCount + 1;
    }
    
    setClickCount(newClickCount);
    setLastClickTime(now);
    setLastClickedDate(date);
    
    // Handle triple-click: clear all selection
    if (newClickCount === 3) {
      onRangeChange?.(null, null);
      setLastModified(null);
      return;
    }
    
    // Handle double-click: reset to single day
    if (newClickCount === 2) {
      onRangeChange?.(date, date);
      setLastModified('end');
      return;
    }
    
    // Single click behavior
    if (!startDate && !endDate) {
      // First click - single day range
      onRangeChange?.(date, date);
      setLastModified('end'); // Arbitrary choice for first click
    } else if (startDate && endDate && date < startDate) {
      // Click earlier than start - expand backward
      onRangeChange?.(date, endDate);
      setLastModified('start');
    } else if (startDate && endDate && date > endDate) {
      // Click later than end - expand forward  
      onRangeChange?.(startDate, date);
      setLastModified('end');
    } else if (startDate && endDate) {
      // Click between start and end - contract based on last modified boundary
      if (date.getTime() === startDate.getTime()) {
        // Clicked on start date - move end to start (contract to single day)
        onRangeChange?.(startDate, startDate);
        setLastModified('end');
      } else if (date.getTime() === endDate.getTime()) {
        // Clicked on end date - move start to end (contract to single day)
        onRangeChange?.(endDate, endDate);
        setLastModified('start');
      } else {
        // Clicked in middle - move opposite boundary to clicked date
        if (lastModified === 'start') {
          // Last action moved start, so now move end
          onRangeChange?.(startDate, date);
          setLastModified('end');
        } else {
          // Last action moved end (or first click), so now move start
          onRangeChange?.(date, endDate);
          setLastModified('start');
        }
      }
    } else {
      // Fallback - create single day range
      onRangeChange?.(date, date);
      setLastModified('end');
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewMonth, viewYear);
    const firstDay = getFirstDayOfMonth(viewMonth, viewYear);
    const days = [];

    // Previous month days (grayed out)
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push(
        <div key={`prev-${day}`} className="w-6 h-6 flex items-center justify-center text-sm text-gray-300">
          {day}
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const isDisabled = isDateDisabled(date);
      const inRange = isDateInRange(date);
      const inHoverRange = isDateInHoverRange(date);
      const rangeStart = isDateRangeStart(date);
      const rangeEnd = isDateRangeEnd(date);
      const isToday = date.toDateString() === new Date().toDateString();

      let dayClasses = "w-6 h-6 flex rounded-md items-center justify-center text-sm cursor-pointer transition-all";

      if (isDisabled) {
        dayClasses += " text-gray-300 cursor-not-allowed";
      } else if (rangeStart || rangeEnd) {
        dayClasses += " bg-gray-800 text-white font-medium";
      } else if (inHoverRange && !inRange) {
        // Blue tint for new hover areas (not overlapping current range)
        dayClasses += " bg-gray-100 text-gray-900";
      } else if (inHoverRange && inRange) {
        // Subtle blue tint over existing range
        dayClasses += " bg-gray-200 text-gray-900";
      } else if (inRange) {
        dayClasses += " bg-gray-100 shadow-med text-gray-900";
      } else if (isToday) {
        dayClasses += " bg-gray-50 border-2 text-gray-900 font-medium";
      } else {
        dayClasses += " text-gray-900 hover:bg-gray-50";
      }

      days.push(
        <div
          key={day}
          className={dayClasses}
          onClick={() => handleDateClick(date)}
          onMouseEnter={() => setHoveredDate(date)}
          onMouseLeave={() => setHoveredDate(null)}
        >
          {day}
        </div>
      );
    }

    // Next month days to fill the grid (max 42 cells)
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <div key={`next-${day}`} className="w-6 h-6 px-4 flex items-center justify-center text-sm text-gray-300">
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="w-full px-8 py-2">
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 py-1 justify-items-center border-b">
        {DAYS.map(day => (
          <div key={day} className="w-6 h-6 flex items-center justify-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5 py-1 justify-items-center">
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default Calendar;