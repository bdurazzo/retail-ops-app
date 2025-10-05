import React, { useState, useEffect } from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import ScrollSelector from '../features/analytics/components/menus/ScrollSelector';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Size configurations for different calendar scales
const SIZE_CONFIG = {
  small: {
    container: 'w-[330px] text-xs',
    header: 'p-1',
    navButton: '',
    navIcon: 12,
    dropdown: 'text-xs min-w-[45px]',
    dayHeader: 'h-6 text-xs',
    dayCell: 'w-11 h-6 text-xs',
    monthLabel: 'text-sm font-medium'
  },
  default: {
    container: 'w-80 text-sm',
    header: 'p-3',
    navButton: 'p-1',
    navIcon: 12,
    dropdown: 'text-sm min-w-[50px]',
    dayHeader: 'h-8 text-sm',
    dayCell: 'w-10 h-8 text-sm',
    monthLabel: 'text-base font-medium'
  },
  large: {
    container: 'w-96 text-base',
    header: 'p-4',
    navButton: 'p-2',
    navIcon: 22,
    dropdown: 'text-base min-w-[60px]',
    dayHeader: 'h-10 text-base',
    dayCell: 'w-12 h-10 text-base',
    monthLabel: 'text-lg font-medium'
  }
};

const Calendar = ({ 
  startDate,
  endDate,
  onRangeChange,
  minDate,
  maxDate,
  viewMonth: propViewMonth,   
  viewYear: propViewYear,
  onViewChange,
  size = 'default'
}) => {
  // Get size configuration
  const config = SIZE_CONFIG[size] || SIZE_CONFIG.default;
  
  // Use external view state when provided, fallback to internal state
  const [internalViewMonth, setInternalViewMonth] = useState(propViewMonth ?? new Date().getMonth());
  const [internalViewYear, setInternalViewYear] = useState(propViewYear ?? new Date().getFullYear());
  
  const viewMonth = propViewMonth ?? internalViewMonth;
  const viewYear = propViewYear ?? internalViewYear;
  
  const setViewMonth = (month) => {
    if (onViewChange) {
      onViewChange(month, viewYear);
    } else {
      setInternalViewMonth(month);
    }
  };
  
  const setViewYear = (year) => {
    if (onViewChange) {
      onViewChange(viewMonth, year);
    } else {
      setInternalViewYear(year);
    }
  };
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);

  // Multi-click tracking
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickedDate, setLastClickedDate] = useState(null);
  
  // Track which boundary was last modified
  const [lastModified, setLastModified] = useState(null); // 'start' or 'end'

  // Sync internal state with props when they change
  useEffect(() => {
    if (propViewMonth !== undefined && propViewMonth !== internalViewMonth) {
      setInternalViewMonth(propViewMonth);
    }
  }, [propViewMonth, internalViewMonth]);

  useEffect(() => {
    if (propViewYear !== undefined && propViewYear !== internalViewYear) {
      setInternalViewYear(propViewYear);
    }
  }, [propViewYear, internalViewYear]);

  // Navigation functions
  const navigateMonth = (delta) => {
    const newMonth = viewMonth + delta;
    if (newMonth < 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else if (newMonth > 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(newMonth);
    }
  };

  // Options for TimeControls-style dropdowns
  const monthOptions = [{ value: '', label: 'Month' }, ...MONTHS.map((m,i)=>({ value: i, label: m }))];
  const currentYear = new Date().getFullYear();
  const yearOptions = [{ value: '', label: 'Year' }, ...Array.from({length:6},(_,i)=>({ value: currentYear-5+i, label: String(currentYear-5+i) }))];

  const handleDropdownToggle = (dropdownId) => {
    setOpenDropdown(openDropdown === dropdownId ? null : dropdownId);
  };

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
        <div key={`prev-${day}`} className={`${config.dayCell} flex items-center justify-center text-gray-300`}>
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

      let dayClasses = `${config.dayCell} flex rounded-md items-center justify-center cursor-pointer transition-all`;

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
        <div key={`next-${day}`} className={`${config.dayCell} flex items-center justify-center text-gray-300`}>
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <div className={`${config.container} mx-auto`}>
      {/* Navigation header - sized according to config */}
      <div className={`flex justify-center items-center gap-3 top-0 ${config.header}`}>
        <button onClick={() => navigateMonth(-1)} className={`hover:bg-gray-100 rounded transition-colors ${config.navButton}`}>
          <IconChevronLeft size={config.navIcon} className="text-gray-600" />
        </button>
        <ScrollSelector
          value={viewMonth ?? ''}
          onChange={(e) => setViewMonth(parseInt(e.target.value))}
          options={monthOptions}
          placeholder="Month"
          isOpen={openDropdown === 'month'}
          onToggle={handleDropdownToggle}
          dropdownId="month"
          className={config.dropdown}
        />
        <ScrollSelector
          value={viewYear ?? ''}
          onChange={(e) => setViewYear(parseInt(e.target.value))}
          options={yearOptions}
          placeholder="Year"
          isOpen={openDropdown === 'year'}
          onToggle={handleDropdownToggle}
          dropdownId="year"
          className={config.dropdown}
        />
        <button onClick={() => navigateMonth(1)} className={`hover:bg-gray-100 rounded transition-colors ${config.navButton}`}>
          <IconChevronRight size={config.navIcon} className="text-gray-600" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 py-2 justify-items-center border-b">
        {DAYS.map(day => (
          <div key={day} className={`${config.dayHeader} flex items-center justify-center font-semibold text-gray-700`}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mt-1 justify-items-center">
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default Calendar;