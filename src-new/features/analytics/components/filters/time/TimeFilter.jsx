import React, { useState, createContext, useContext } from 'react';
import { IconClockFilled, IconTrash, IconLink, IconUnlink, IconChevronLeft, IconChevronRight, IconCirclesRelation, IconClock, IconCalendarCheck } from '@tabler/icons-react';
import Calendar from '../../../../../components/Calendar.jsx';
import Toolbar from '../../../../../components/Toolbar.jsx';
import DateSlotInput from '../../../../../components/DateSlotInput.jsx';

// Create a context for shared time filter state
const TimeFilterContext = createContext(null);

// Shared state for TimeFilter
let timeFilterState = {
  startInput: '',
  endInput: '',
  setStartInput: null,
  setEndInput: null,
  startDate: null,
  endDate: null,
  setStartDate: null,
  setEndDate: null,
  isLinked: false,
  setIsLinked: null,
  viewMonth: new Date().getMonth(),
  viewYear: new Date().getFullYear(),
  setViewMonth: null,
  setViewYear: null
};

// Initialize shared state from localStorage
try {
  const saved = localStorage.getItem('analytics-query');
  if (saved) {
    const query = JSON.parse(saved);
    if (query.time?.startDate) {
      const [year, month, day] = query.time.startDate.split('-');
      timeFilterState.startInput = `${month}-${day}-${year}`;
      // Reconstruct Date object from PDT date string
      timeFilterState.startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    if (query.time?.endDate) {
      const [year, month, day] = query.time.endDate.split('-');
      timeFilterState.endInput = `${month}-${day}-${year}`;
      // Reconstruct Date object from PDT date string
      timeFilterState.endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Set calendar view to show the start date's month if available
    if (timeFilterState.startDate) {
      timeFilterState.viewMonth = timeFilterState.startDate.getMonth();
      timeFilterState.viewYear = timeFilterState.startDate.getFullYear();
    }
  }
} catch (e) {}

const TimeFilter = ({ size = 'default' }) => {
  const [startDate, setStartDate] = useState(timeFilterState.startDate);
  const [endDate, setEndDate] = useState(timeFilterState.endDate);
  const [startInput, setStartInput] = useState(timeFilterState.startInput);
  const [endInput, setEndInput] = useState(timeFilterState.endInput);
  const [isLinked, setIsLinked] = useState(timeFilterState.isLinked);
  const [viewMonth, setViewMonth] = useState(timeFilterState.viewMonth);
  const [viewYear, setViewYear] = useState(timeFilterState.viewYear);

  // Register setters in shared state
  timeFilterState.setStartInput = setStartInput;
  timeFilterState.setEndInput = setEndInput;
  timeFilterState.setStartDate = setStartDate;
  timeFilterState.setEndDate = setEndDate;
  timeFilterState.startDate = startDate;
  timeFilterState.endDate = endDate;
  timeFilterState.setIsLinked = setIsLinked;
  timeFilterState.isLinked = isLinked;
  timeFilterState.setViewMonth = setViewMonth;
  timeFilterState.setViewYear = setViewYear;
  timeFilterState.viewMonth = viewMonth;
  timeFilterState.viewYear = viewYear;


  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const parseDate = (input) => {
    if (!input.trim()) return null;
    const [month, day, year] = input.split('-').map(Number);
    if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day);
    }
    return null;
  };

  const updateTimeFilter = (start, end) => {
    console.log('=== TIME FILTER UPDATE STARTING ===');
    console.log('Start date:', start);
    console.log('End date:', end);
    
    // Update local state variables
    setStartDate(start);
    setEndDate(end);
    
    // Format dates as PDT dates (YYYY-MM-DD) without timezone conversion
    const formatPDTDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const timeConfig = {
      time: {
        startDate: formatPDTDate(start),
        endDate: formatPDTDate(end),
        start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`
      }
    };

    console.log('Time config created:', timeConfig);

    // Update shared state with formatted inputs AND date objects
    const [startYear, startMonth, startDay] = timeConfig.time.startDate.split('-');
    const [endYear, endMonth, endDay] = timeConfig.time.endDate.split('-');
    const formattedStart = `${startMonth}-${startDay}-${startYear}`;
    const formattedEnd = `${endMonth}-${endDay}-${endYear}`;
    
    timeFilterState.startInput = formattedStart;
    timeFilterState.endInput = formattedEnd;
    timeFilterState.startDate = start;
    timeFilterState.endDate = end;
    
    // Update local input state
    setStartInput(formattedStart);
    setEndInput(formattedEnd);
    
    // Sync all other instances through setters
    if (timeFilterState.setStartInput && timeFilterState.setStartInput !== setStartInput) {
      timeFilterState.setStartInput(formattedStart);
    }
    if (timeFilterState.setEndInput && timeFilterState.setEndInput !== setEndInput) {
      timeFilterState.setEndInput(formattedEnd);
    }
    if (timeFilterState.setStartDate && timeFilterState.setStartDate !== setStartDate) {
      timeFilterState.setStartDate(start);
    }
    if (timeFilterState.setEndDate && timeFilterState.setEndDate !== setEndDate) {
      timeFilterState.setEndDate(end);
    }

    try {
      const saved = localStorage.getItem('analytics-query') || '{}';
      console.log('Current localStorage before update:', saved);
      
      const query = JSON.parse(saved);
      Object.assign(query, timeConfig);
      localStorage.setItem('analytics-query', JSON.stringify(query));
      
      console.log('Updated localStorage:', localStorage.getItem('analytics-query'));
      console.log('Dispatching time-filter-updated event');
      
      window.dispatchEvent(new CustomEvent('time-filter-updated', { 
        detail: timeConfig 
      }));
      
      console.log('=== TIME FILTER UPDATE COMPLETE ===');
    } catch (error) {
      console.error('TimeFilter: Update failed:', error);
    }
  };


  // Unified function that handles date updates from ANY source (calendar, slot picker, manual input)
  const updateDateRange = (newStartDate, newEndDate, source = 'unknown') => {
    console.log(`updateDateRange called from ${source}:`, { newStartDate, newEndDate });
    
    // Update internal state
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    // Update shared state immediately
    timeFilterState.startDate = newStartDate;
    timeFilterState.endDate = newEndDate;
    
    // Update input fields to reflect the new dates
    const formattedStart = newStartDate ? formatDateForDisplay(newStartDate) : '';
    const formattedEnd = newEndDate ? formatDateForDisplay(newEndDate) : '';
    
    setStartInput(formattedStart);
    setEndInput(formattedEnd);
    
    // Update shared state inputs
    timeFilterState.startInput = formattedStart;
    timeFilterState.endInput = formattedEnd;
    
    // Sync all registered setters across all instances
    if (timeFilterState.setStartInput) timeFilterState.setStartInput(formattedStart);
    if (timeFilterState.setEndInput) timeFilterState.setEndInput(formattedEnd);
    if (timeFilterState.setStartDate) timeFilterState.setStartDate(newStartDate);
    if (timeFilterState.setEndDate) timeFilterState.setEndDate(newEndDate);
    
    // Update calendar view to show the most recently changed date
    let targetMonth, targetYear, shouldUpdate = false;
    
    if (source.includes('start') || source === 'slot-picker-start') {
      // Start date was changed - show start date's month
      if (newStartDate) {
        targetMonth = newStartDate.getMonth();
        targetYear = newStartDate.getFullYear();
        shouldUpdate = true;
      }
    } else if (source.includes('end') || source === 'slot-picker-end') {
      // End date was changed - show end date's month
      if (newEndDate) {
        targetMonth = newEndDate.getMonth();
        targetYear = newEndDate.getFullYear();
        shouldUpdate = true;
      }
    } else if (source === 'calendar') {
      // Calendar was used - don't change view (user is already navigating)
      shouldUpdate = false;
    } else {
      // For other sources, prefer start date but fall back to end date
      if (newStartDate) {
        targetMonth = newStartDate.getMonth();
        targetYear = newStartDate.getFullYear();
        shouldUpdate = true;
      } else if (newEndDate) {
        targetMonth = newEndDate.getMonth();
        targetYear = newEndDate.getFullYear();
        shouldUpdate = true;
      }
    }
    
    if (shouldUpdate && (targetMonth !== viewMonth || targetYear !== viewYear)) {
      setViewMonth(targetMonth);
      setViewYear(targetYear);
      timeFilterState.viewMonth = targetMonth;
      timeFilterState.viewYear = targetYear;
      if (timeFilterState.setViewMonth) timeFilterState.setViewMonth(targetMonth);
      if (timeFilterState.setViewYear) timeFilterState.setViewYear(targetYear);
    }
    
    // Apply the filter update
    if (newStartDate && newEndDate) {
      updateTimeFilter(newStartDate, newEndDate);
    }
  };

  const handleRangeChange = (newStartDate, newEndDate) => {
    updateDateRange(newStartDate, newEndDate, 'calendar');
  };


  const handleClear = () => {
    setStartInput('');
    setEndInput('');
    setStartDate(null);
    setEndDate(null);
    
    try {
      const saved = localStorage.getItem('analytics-query') || '{}';
      const query = JSON.parse(saved);
      delete query.time;
      localStorage.setItem('analytics-query', JSON.stringify(query));
      
      window.dispatchEvent(new CustomEvent('time-filter-cleared'));
    } catch (error) {
      console.error('TimeFilter: Clear failed:', error);
    }
  };

  // Navigation functions for individual field navigation
  const navigateStartMonth = (direction) => {
    if (!startDate) return;
    
    const newStartDate = new Date(startDate);
    newStartDate.setMonth(newStartDate.getMonth() + direction);
    
    if (isLinked && endDate) {
      // Move both dates by the same amount when linked
      const newEndDate = new Date(endDate);
      newEndDate.setMonth(newEndDate.getMonth() + direction);
      updateDateRange(newStartDate, newEndDate, 'navigation-linked-start');
    } else {
      // Move only start date when unlinked
      updateDateRange(newStartDate, endDate, 'navigation-start');
    }
  };

  const navigateEndMonth = (direction) => {
    if (!endDate) return;
    
    const newEndDate = new Date(endDate);
    newEndDate.setMonth(newEndDate.getMonth() + direction);
    
    if (isLinked && startDate) {
      // Move both dates by the same amount when linked
      const newStartDate = new Date(startDate);
      newStartDate.setMonth(newStartDate.getMonth() + direction);
      updateDateRange(newStartDate, newEndDate, 'navigation-linked-end');
    } else {
      // Move only end date when unlinked
      updateDateRange(startDate, newEndDate, 'navigation-end');
    }
  };

  const toggleLink = () => {
    setIsLinked(!isLinked);
    timeFilterState.isLinked = !isLinked;
  };


  return (
    <TimeFilterContext.Provider value={{
      startDate, endDate, startInput, endInput,
      setStartDate, setEndDate, setStartInput, setEndInput,
      updateDateRange, handleClear, parseDate, isLinked, setIsLinked,
      navigateStartMonth, navigateEndMonth, toggleLink,
      viewMonth, viewYear, setViewMonth, setViewYear
    }}>
      <div className="space-y-2">
        {/* Use shared toolbar */}
        <SharedTimeFilterToolbar />
        
        {/* Calendar */}
        <Calendar
          startDate={startDate}
          endDate={endDate}
          onRangeChange={handleRangeChange}
          viewMonth={viewMonth}
          viewYear={viewYear}
          size="small"
          onViewChange={(month, year) => {
            setViewMonth(month);
            setViewYear(year);
            timeFilterState.viewMonth = month;
            timeFilterState.viewYear = year;
            if (timeFilterState.setViewMonth) timeFilterState.setViewMonth(month);
            if (timeFilterState.setViewYear) timeFilterState.setViewYear(year);
          }}
        />
      </div>
    </TimeFilterContext.Provider>
  );
};

// Shared toolbar component that can be used everywhere
function SharedTimeFilterToolbar() {
  // Try to use context first, fall back to shared state
  const context = useContext(TimeFilterContext);
  
  // If used from context (within TimeFilter), use context values
  const contextValues = context || {};
  
  // Local state for when used outside context (in PanelView)
  const [localStartInput, setLocalStartInput] = React.useState(timeFilterState.startInput);
  const [localEndInput, setLocalEndInput] = React.useState(timeFilterState.endInput);
  
  // Choose values based on context availability
  const startInput = context ? contextValues.startInput : localStartInput;
  const endInput = context ? contextValues.endInput : localEndInput;
  const setStartInput = context ? contextValues.setStartInput : setLocalStartInput;
  const setEndInput = context ? contextValues.setEndInput : setLocalEndInput;
  const updateDateRange = context ? contextValues.updateDateRange : null;
  const handleClear = context ? contextValues.handleClear : null;
  const isLinked = context ? contextValues.isLinked : timeFilterState.isLinked;
  const navigateStartMonth = context ? contextValues.navigateStartMonth : ((direction) => {
    // Fallback navigation for start date when outside context
    const parsedStart = parseDate(startInput);
    const parsedEnd = parseDate(endInput);
    if (!parsedStart) return;
    
    const newStartDate = new Date(parsedStart);
    newStartDate.setMonth(newStartDate.getMonth() + direction);
    
    if (timeFilterState.isLinked && parsedEnd) {
      const newEndDate = new Date(parsedEnd);
      newEndDate.setMonth(newEndDate.getMonth() + direction);
      updateTimeFilter(newStartDate, newEndDate);
    } else {
      updateTimeFilter(newStartDate, parsedEnd);
    }
  });
  
  const navigateEndMonth = context ? contextValues.navigateEndMonth : ((direction) => {
    // Fallback navigation for end date when outside context
    const parsedStart = parseDate(startInput);
    const parsedEnd = parseDate(endInput);
    if (!parsedEnd) return;
    
    const newEndDate = new Date(parsedEnd);
    newEndDate.setMonth(newEndDate.getMonth() + direction);
    
    if (timeFilterState.isLinked && parsedStart) {
      const newStartDate = new Date(parsedStart);
      newStartDate.setMonth(newStartDate.getMonth() + direction);
      updateTimeFilter(newStartDate, newEndDate);
    } else {
      updateTimeFilter(parsedStart, newEndDate);
    }
  });
  const toggleLink = context ? contextValues.toggleLink : (() => {
    timeFilterState.isLinked = !timeFilterState.isLinked;
    if (timeFilterState.setIsLinked) timeFilterState.setIsLinked(timeFilterState.isLinked);
  });
  
  const parseDate = context ? contextValues.parseDate : ((input) => {
    if (!input.trim()) return null;
    const [month, day, year] = input.split('-').map(Number);
    if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day);
    }
    return null;
  });
  
  // Sync with shared state when used outside context
  React.useEffect(() => {
    if (!context) {
      setLocalStartInput(timeFilterState.startInput);
      setLocalEndInput(timeFilterState.endInput);
      timeFilterState.setStartInput = setLocalStartInput;
      timeFilterState.setEndInput = setLocalEndInput;
    }
  }, [context]);

  // Listen for shared state changes when outside context
  React.useEffect(() => {
    if (!context) {
      const handleStateChange = () => {
        setLocalStartInput(timeFilterState.startInput);
        setLocalEndInput(timeFilterState.endInput);
      };

      // Listen for time filter events to sync state
      window.addEventListener('time-filter-updated', handleStateChange);
      window.addEventListener('time-filter-cleared', handleStateChange);

      return () => {
        window.removeEventListener('time-filter-updated', handleStateChange);
        window.removeEventListener('time-filter-cleared', handleStateChange);
      };
    }
  }, [context]);
  
  const updateTimeFilter = (start, end) => {
    // Format dates as PDT dates (YYYY-MM-DD) without timezone conversion
    const formatPDTDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const timeConfig = {
      time: {
        startDate: formatPDTDate(start),
        endDate: formatPDTDate(end),
        start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`
      }
    };

    // Update shared state with both inputs and dates
    const [startYear, startMonth, startDay] = timeConfig.time.startDate.split('-');
    const [endYear, endMonth, endDay] = timeConfig.time.endDate.split('-');
    const formattedStart = `${startMonth}-${startDay}-${startYear}`;
    const formattedEnd = `${endMonth}-${endDay}-${endYear}`;
    
    timeFilterState.startInput = formattedStart;
    timeFilterState.endInput = formattedEnd;
    timeFilterState.startDate = start;
    timeFilterState.endDate = end;
    
    // Update local state if outside context
    if (!context) {
      setLocalStartInput(formattedStart);
      setLocalEndInput(formattedEnd);
    }
    
    // Update context state if inside context
    if (context) {
      contextValues.setStartInput(formattedStart);
      contextValues.setEndInput(formattedEnd);
      if (contextValues.setStartDate) contextValues.setStartDate(start);
      if (contextValues.setEndDate) contextValues.setEndDate(end);
    }
    
    // Sync ALL registered setters across ALL instances
    if (timeFilterState.setStartInput && timeFilterState.setStartInput !== setLocalStartInput) {
      timeFilterState.setStartInput(formattedStart);
    }
    if (timeFilterState.setEndInput && timeFilterState.setEndInput !== setLocalEndInput) {
      timeFilterState.setEndInput(formattedEnd);
    }
    if (timeFilterState.setStartDate) timeFilterState.setStartDate(start);
    if (timeFilterState.setEndDate) timeFilterState.setEndDate(end);

    try {
      const saved = localStorage.getItem('analytics-query') || '{}';
      const query = JSON.parse(saved);
      Object.assign(query, timeConfig);
      localStorage.setItem('analytics-query', JSON.stringify(query));
      window.dispatchEvent(new CustomEvent('time-filter-updated', { detail: timeConfig }));
    } catch (error) {
      console.error('SharedTimeFilterToolbar: Update failed:', error);
    }
  };

  const handleToolbarSubmit = (formattedDate, isStart) => {
    if (context && updateDateRange) {
      // Use context method when available
      const parsedDate = parseDate(formattedDate);
      if (parsedDate) {
        const otherDate = isStart 
          ? contextValues.endDate || parseDate(endInput) || parsedDate
          : contextValues.startDate || parseDate(startInput) || parsedDate;
        updateDateRange(
          isStart ? parsedDate : otherDate,
          isStart ? otherDate : parsedDate,
          isStart ? 'shared-toolbar-start' : 'shared-toolbar-end'
        );
      }
    } else {
      // Fallback method for outside context
      if (isStart) {
        const parsedStart = parseDate(formattedDate);
        const parsedEnd = parseDate(endInput);
        if (parsedStart && parsedEnd) {
          updateTimeFilter(parsedStart, parsedEnd);
        }
      } else {
        const parsedStart = parseDate(startInput);
        const parsedEnd = parseDate(formattedDate);
        if (parsedStart && parsedEnd) {
          updateTimeFilter(parsedStart, parsedEnd);
        }
      }
    }
  };

  const handleToolbarClear = () => {
    if (context && handleClear) {
      // Use context clear method
      handleClear();
    } else {
      // Fallback clear method
      setStartInput('');
      setEndInput('');
      timeFilterState.startInput = '';
      timeFilterState.endInput = '';
      
      try {
        const saved = localStorage.getItem('analytics-query') || '{}';
        const query = JSON.parse(saved);
        delete query.time;
        localStorage.setItem('analytics-query', JSON.stringify(query));
        window.dispatchEvent(new CustomEvent('time-filter-cleared'));
      } catch (error) {
        console.error('SharedTimeFilterToolbar: Clear failed:', error);
      }
    }
  };

  return (
    <Toolbar
      leftContent={
        <div className="flex items-center justify-center">
          <button className="rounded transition-colors text-gray-600 hover:bg-gray-100 flex flex-col items-center w-7">
            <IconCalendarCheck size={20} stroke={1.75} />
          </button>
          <div className="w-[2px] h-9 bg-gray-200"></div>
        </div>
      }
      centerContent={
        <div className="flex items-center text-[11px]">
          {/* Start date controls */}
          <button 
            className="rounded hover:bg-gray-100 text-gray-600"
            title="Navigate start month backward"
            onClick={() => navigateStartMonth ? navigateStartMonth(-1) : null}
            disabled={!navigateStartMonth}
          >
            <IconChevronLeft size={18} />
          </button>
          <DateSlotInput
            value={startInput}
            onChange={(value) => {
              setStartInput(value);
              timeFilterState.startInput = value;
            }}
            onSubmit={(formattedDate) => handleToolbarSubmit(formattedDate, true)}
            placeholder="MM-DD-YYYY"
            className="text-[11px] px-2 text-center shadow-md h-[20px] w-[85px] focus:outline-none"
            dateType="start"
          />
          <button 
            className="rounded hover:bg-gray-100 text-gray-600"
            title="Navigate start month forward"
            onClick={() => navigateStartMonth ? navigateStartMonth(1) : null}
            disabled={!navigateStartMonth}
          >
            <IconChevronRight size={18} />
          </button>

          {/* Link/unlink button */}
          <button 
            className={`rounded p-1 hover:bg-gray-100 hover:text-gray-600 transition-colors mx-1 ${isLinked ? 'text-white p-1 bg-gray-900' : 'text-gray-600'}`}
            title={isLinked ? "Unlink date ranges" : "Link date ranges"}
            onClick={toggleLink}
          >
            {isLinked ? <IconCirclesRelation size={14} /> : <IconCirclesRelation size={14} />}
          </button>

          {/* End date controls */}
          <button 
            className="rounded hover:bg-gray-100 text-gray-600"
            title="Navigate end month backward"
            onClick={() => navigateEndMonth ? navigateEndMonth(-1) : null}
            disabled={!navigateEndMonth}
          >
            <IconChevronLeft size={18} />
          </button>
          <DateSlotInput
            value={endInput}
            onChange={(value) => {
              setEndInput(value);
              timeFilterState.endInput = value;
            }}
            onSubmit={(formattedDate) => handleToolbarSubmit(formattedDate, false)}
            placeholder="MM-DD-YYYY"
            className="text-[11px] px-2 text-center shadow-md h-[20px] w-[85px] focus:outline-none"
            dateType="end"
          />
          <button 
            className="rounded hover:bg-gray-100 text-gray-600"
            title="Navigate end month forward"
            onClick={() => navigateEndMonth ? navigateEndMonth(1) : null}
            disabled={!navigateEndMonth}
          >
            <IconChevronRight size={18} />
          </button>
        </div>
      }
      rightContent={
        <div className="flex items-center">
          <button 
            className="rounded hover:bg-gray-100 text-gray-600"
            title="Clear filter"
            onClick={handleToolbarClear}
          >
            <IconTrash size={18} />
          </button>
        </div>
      }
      height="10"
      borderWidth={0}
      shadowSize="md"
      rounded="none"
      paddingX={1}
      centerPaddingX={0}
    />
  );
}

// Export the shared toolbar as TimeFilterToolbar for backwards compatibility
export const TimeFilterToolbar = SharedTimeFilterToolbar;

export default TimeFilter;