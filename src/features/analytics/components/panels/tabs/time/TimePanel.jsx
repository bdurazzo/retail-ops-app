import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconCalendarCheck,
  IconBracketsContain,
  IconBracketsContainStart,
  IconBracketsContainEnd,
  IconAdjustments,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react';
import ScrollSelector from '../../../menus/ScrollSelector';
import Calendar from './Calendar';
import DateRange from './DateRange';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const TimePanel = ({ 
  onDateRangeChange,
  initialStartDate = null,
  initialEndDate = null 
}) => {
  
  const [animationComplete, setAnimationComplete] = useState(false);
  const [activeMenu, setActiveMenu] = useState('calendar');
  const [dateRangeToggled, setDateRangeToggled] = useState(false);
  const [startDateToggled, setStartDateToggled] = useState(false);
  const [endDateToggled, setEndDatedToggled] = useState(false);
  
  const [currentStartDate, setCurrentStartDate] = useState(initialStartDate);
  const [currentEndDate, setCurrentEndDate] = useState(initialEndDate || new Date());

  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  
  const [openDropdown, setOpenDropdown] = useState(null);
  // Gate calendar controls so they fade in only after brackets finish fading out
  const [allowCalControls, setAllowCalControls] = useState(true);
  // Visual active state for single bracket during click->exit
  const [singleBracketActive, setSingleBracketActive] = useState(false);
  // One-time fade-in of start bracket background when splitting
  const [startBracketFadeActive, setStartBracketFadeActive] = useState(false);

  // Coordinate animations between calendar nav and bracket controls
  // Calendar nav fades out with total ~0.5s (delay 0.25 + duration 0.25)
  const NAV_FADE_DELAY = 0.5;
  // Durations (ms) to coordinate UI rhythm
  const CAL_EXIT_MS = 250;      // calendar controls fade-out
  const BRACKET_SPLIT_MS = 200; // end bracket slide-in

  // Create month options with rotation starting FROM the currently selected month
  // Compute safe selections capped to current date
  const TODAY = new Date();
  const CURRENT_YEAR = TODAY.getFullYear();
  const CURRENT_MONTH = TODAY.getMonth();
  const safeViewYear = Math.min(viewYear, CURRENT_YEAR);
  const safeViewMonth = (safeViewYear === CURRENT_YEAR)
    ? Math.min(viewMonth, CURRENT_MONTH)
    : viewMonth;

  const createMonthOptions = () => {
    // Build allowed months for the viewed year; cap to current month if viewing current year
    const maxMonthForYear = (safeViewYear === CURRENT_YEAR) ? CURRENT_MONTH : 11;
    const base = Array.from({ length: maxMonthForYear + 1 }, (_, i) => ({ value: i, label: MONTHS[i] }));

    // Start rotation at the safe (capped) selected month
    const startIndex = base.findIndex(m => m.value === safeViewMonth);
    if (startIndex === -1) return [{ value: '', label: 'Month' }, ...base];

    const reordered = [
      ...base.slice(startIndex),
      ...base.slice(0, startIndex)
    ];

    return [{ value: '', label: 'Month' }, ...reordered];
  };

  // Create year options with rotation starting FROM the currently selected year
  const createYearOptions = () => {
    // Window includes selected year (even if older than default), but never exceeds current year
    const startYear = Math.min(CURRENT_YEAR - 5, safeViewYear);
    const endYear = CURRENT_YEAR; // cap at current year to avoid future years

    const years = [];
    for (let y = startYear; y <= endYear; y++) years.push({ value: y, label: y.toString() });

    const startIndex = years.findIndex(y => y.value === safeViewYear);
    if (startIndex === -1) return [{ value: '', label: 'Year' }, ...years];

    const reordered = [
      ...years.slice(startIndex),
      ...years.slice(0, startIndex)
    ];

    return [{ value: '', label: 'Year' }, ...reordered];
  };

  const monthOptions = createMonthOptions();
  const yearOptions = createYearOptions();
  const [pendingBracketCollapse, setPendingBracketCollapse] = useState(false);

  const handleMenuToggle = (menuType) => {
    if (menuType === 'daterange') {
      // If calendar is currently active, let its nav fade out before brackets resolve
      if (activeMenu === 'calendar') {
        setActiveMenu(null);
        const delay = 250; // match calendar controls fade-out duration
        setTimeout(() => {
          setDateRangeToggled((prev) => !prev);
        }, delay);
      } else {
        setDateRangeToggled((prev) => !prev);
        if (activeMenu === 'startdate' || activeMenu === 'enddate') {
          setActiveMenu(null);
        }
      }
    } else if (menuType === 'calendar') {
      if (activeMenu === 'calendar') {
        // Closing calendar: if brackets are split, wait for nav exit before collapsing back
        if (dateRangeToggled) setPendingBracketCollapse(true);
        setActiveMenu(null);
      } else {
        // Opening calendar: if brackets are split, hide nav until brackets finish exit
        if (dateRangeToggled) {
          setAllowCalControls(false);
          setDateRangeToggled(false); // trigger brackets fade-out
        }
        setActiveMenu('calendar');
        if (activeMenu === 'startdate' || activeMenu === 'enddate') {
          setActiveMenu('calendar');
        }
      }
    } else if (menuType === 'startdate' || menuType === 'enddate') {
      if (activeMenu === menuType) {
        setActiveMenu(null);
      } else {
        setActiveMenu(menuType);
      }
    } else {
      setActiveMenu(activeMenu === menuType ? null : menuType);
    } 
  };

  const handleDropdownToggle = (dropdownId) => {
    setOpenDropdown(openDropdown === dropdownId ? null : dropdownId);
  };

  // Clicking the single closed bracket should split and focus the start bracket
  const handleSingleBracketClick = () => {
    setSingleBracketActive(true);
    setStartBracketFadeActive(true);
    const doSplitThenFocus = () => {
      setDateRangeToggled(true);
      // Wait for split animation before opening start panel
      setTimeout(() => setActiveMenu('startdate'), BRACKET_SPLIT_MS);
    };

    if (activeMenu === 'calendar') {
      // Let calendar controls fade out first, then split + focus start
      setActiveMenu(null);
      setTimeout(doSplitThenFocus, CAL_EXIT_MS);
    } else {
      doSplitThenFocus();
    }
  };

  const handleMonthChange = (e) => {
    const val = parseInt(e.target.value);
    setViewMonth(prev => (safeViewYear === CURRENT_YEAR) ? Math.min(val, CURRENT_MONTH) : val);
  };

  const handleYearChange = (e) => {
    const y = parseInt(e.target.value);
    setViewYear(y);
    // If switching to current year and current month selection is in the future, clamp it
    setViewMonth(prev => (y === CURRENT_YEAR && prev > CURRENT_MONTH) ? CURRENT_MONTH : prev);
  };

  const navigateMonth = (direction) => {
    let newMonth = viewMonth + direction;
    let newYear = viewYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }

    // Prevent navigating into the future beyond current month/year
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    if (newYear > currentYear || (newYear === currentYear && newMonth > currentMonth)) {
      newYear = currentYear;
      newMonth = currentMonth;
    }

    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  const handleCalendarDateChange = (startDate, endDate) => {
    setCurrentStartDate(startDate);
    setCurrentEndDate(endDate);
    onDateRangeChange?.(startDate, endDate);
  };

  const handleStartDateChange = (startDate, endDate) => {
    setCurrentStartDate(startDate);
    onDateRangeChange?.(startDate, currentEndDate);
  };

  const handleEndDateChange = (startDate, endDate) => {
    setCurrentEndDate(endDate);
    onDateRangeChange?.(currentStartDate, endDate);
  };

  return (
    <div className="w-full">
      <div className="bg-gradient-to-b from-white to-gray-50 shadow-med">
        <div className="flex p-1 items-center justify-between">
          <div className="flex items-center relative gap-1">
            <button
              onClick={() => handleMenuToggle('calendar')}
              className={`p-1 rounded transition-all gap-1 ${
                activeMenu === 'calendar' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Calendar picker"
            >
              <IconCalendarCheck size={22} stroke={1.75} />
            </button>
            
            <AnimatePresence mode="wait" onExitComplete={() => {
              // When brackets finish fading out and calendar is selected, allow nav to fade in
              if (activeMenu === 'calendar') {
                setAllowCalControls(true);
              }
              setSingleBracketActive(false);
            }}>
              {!dateRangeToggled ? (
                <motion.button
                  key="daterange-single"
                  onClick={handleSingleBracketClick}
                  className={`p-1 rounded transition-all ${
                    singleBracketActive
                      ? 'text-white' // background animated via style for smooth fade
                      : `text-gray-800 ${animationComplete ? 'hover:bg-gray-100' : ''}`
                  }`}  
                  title="Date range dropdowns"
                  initial={singleBracketActive ? { opacity: 1, backgroundColor: '#111827', color: '#ffffff' } : { opacity: 1 }}
                  animate={singleBracketActive ? { opacity: 1, backgroundColor: '#111827', color: '#ffffff' } : { opacity: 1 }}
                  exit={singleBracketActive
                    ? {
                        backgroundColor: ['#111827', '#111827', 'rgba(17,24,39,0)'],
                        color: ['#ffffff', '#ffffff', '#1F2937'],
                        opacity: [1, 1, 0.85],
                        transition: { duration: 0.4, ease: 'easeInOut', times: [0, 0.7, 1] }
                      }
                    : { opacity: 0.8, transition: { duration: 0.1 } }
                  }
                  transition={{ opacity: 1, duration: 0.2, delay: activeMenu !== 'calendar' ? NAV_FADE_DELAY : 0.4 }}
                >
                  <IconBracketsContain size={22} stroke={1.75} />
                </motion.button>
              ) : (
                <motion.div
                  key="daterange-split"
                  className="flex items-center gap-1 z-20"
                  initial={{ x: -2, opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ x: -2, opacity: 0.8, transition: { duration: 0.3 } }}
                  transition={{ opacity: 1, duration: 0.3, delay: activeMenu !== 'calendar' ? NAV_FADE_DELAY : 0.2 }}
                >
                  <motion.button
                    onClick={() => handleMenuToggle('startdate')}
                    className={`p-1 right-0 rounded transition-all z-20 ${
                      activeMenu === 'startdate' 
                        ? 'bg-gray-900 text-white' 
                        : `text-gray-700 ${animationComplete ? 'hover:bg-gray-100' : ''}`
                    }`}
                    title="Start date"
                    initial={startBracketFadeActive ? { opacity: 1, backgroundColor: 'rgba(17,24,39,0)' } : { opacity: 0, duration: 0.2, delay: 0.2 }}
                    animate={startBracketFadeActive ? { opacity: 1, backgroundColor: '#111827' } : { opacity: 1 }}
                    exit={{ opacity: 1, transition: { duration: 0.2, delay: 0 } }}
                    onAnimationStart={() => setAnimationComplete(false)}
                    onAnimationComplete={() => { setAnimationComplete(true); if (startBracketFadeActive) setStartBracketFadeActive(false); }}
                    transition={{ 
                      opacity: { duration: 0.1, delay: 0 },
                      backgroundColor: startBracketFadeActive ? { duration: 0.2, ease: 'easeInOut' } : undefined
                    }}
                    style={startBracketFadeActive ? { color: 'white' } : undefined}
                  >
                    <IconBracketsContainStart size={22} stroke={1.75} />
                  </motion.button>                  
                
                  <motion.button
                    onClick={() => handleMenuToggle('enddate')}
                    className={`p-1 left-0 rounded transition-all z-10 ${
                      activeMenu === 'enddate' 
                        ? 'bg-gray-900 text-white' 
                        : `text-gray-600 ${animationComplete ? 'hover:bg-gray-100' : ''}`
                    }`}
                    title="End date"
                    initial={{ x: -28, opacity: 1 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ 
                      x: -29.1, 
                      opacity: 1,
                      transition: { 
                        x: { duration: 0.2, ease: "easeOut" },
                        opacity: { duration: 0.3, ease: "easeInOut" }
                      }
                    }}
                    onAnimationStart={() => setAnimationComplete(false)}
                    onAnimationComplete={() => setAnimationComplete(true)}
                    transition={{ 
                      x: { duration: 0.1, ease: "easeOut" },
                      opacity: { duration: 0.2, delay: 0.2 }
                    }}
                  >
                    <IconBracketsContainEnd size={22} stroke={1.75} />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <AnimatePresence
              initial={false}
              mode="wait"
              onExitComplete={() => {
                if (pendingBracketCollapse) {
                  setDateRangeToggled(false);
                  setPendingBracketCollapse(false);
                }
              }}
            >
              {activeMenu === 'calendar' && allowCalControls && (
                <motion.div
                  key="calendar-controls"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0, duration: 0.4, ease: 'easeInOut' }}
                  className="flex items-center gap-2"
                  onAnimationComplete={() => {
                    // When opening calendar: collapse split brackets only after nav fade-in completes
                    if (pendingBracketCollapse) {
                      setDateRangeToggled(false);
                      setPendingBracketCollapse(false);
                    }
                  }}
                >
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="hover:bg-gray-100 rounded transition-colors"
                  >
                    <IconChevronLeft size={18} className="text-gray-600" />
                  </button>

                <ScrollSelector
                  value={viewMonth}
                  onChange={handleMonthChange}
                  options={monthOptions}
                  placeholder="Month"
                  isOpen={openDropdown === 'month'}
                  onToggle={handleDropdownToggle}
                  dropdownId="month"
                  className="min-w-[60px]"
                />
                
                <ScrollSelector
                  value={viewYear}
                  onChange={handleYearChange}
                  options={yearOptions}
                  placeholder="Year"
                  isOpen={openDropdown === 'year'}
                  onToggle={handleDropdownToggle}
                  dropdownId="year"
                  className="min-w-[60px]"
                />

                  <button
                    onClick={() => navigateMonth(1)}
                    className="hover:bg-gray-100 rounded transition-colors"
                  >
                    <IconChevronRight size={18} className="text-gray-600" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleMenuToggle('settings')}
              className={`p-2 rounded transition-all ${
                activeMenu === 'settings' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Settings"
            >
              <IconAdjustments size={24} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeMenu === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.2, ease: "easeInOut" },
              opacity: { duration: 0.15 }
            }}
            style={{ overflow: "hidden" }}
          >
            <div className="bg-white">
              <Calendar
                startDate={currentStartDate}
                endDate={currentEndDate}
                onRangeChange={handleCalendarDateChange}
                maxDate={new Date()}
                viewMonth={viewMonth}
                viewYear={viewYear}
              />
            </div>
          </motion.div>
        )}

        {(activeMenu === 'startdate' || activeMenu === 'enddate') && (
          <motion.div
            key={activeMenu}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.2, ease: "easeInOut" },
              opacity: { duration: 0.15 }
            }}
            style={{ overflow: "hidden" }}
          >
            <div className="bg-white">
              <DateRange
                startDate={currentStartDate}
                endDate={currentEndDate}
                onRangeChange={activeMenu === 'startdate' ? handleStartDateChange : handleEndDateChange}
                selectingEnd={activeMenu === 'enddate'}
              />
            </div>
          </motion.div>
        )}

        {activeMenu === 'settings' && (
          <motion.div
            key="settings"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.2, ease: "easeInOut" },
              opacity: { duration: 0.15 }
            }}
            style={{ overflow: "hidden" }}
          >
            <div className="mt-2 p-3 bg-white rounded-lg">
              <div className="text-center text-gray-500 text-sm">
                Settings Component Container
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimePanel;
