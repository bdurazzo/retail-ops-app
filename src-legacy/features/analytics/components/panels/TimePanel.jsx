import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Controls header is rendered in ControlPanel; remove local controls UI
// (Icons and ScrollSelector imports no longer needed here)
import Calendar from '../filters/time/Calendar';
import DateRange from '../filters/time/DateRange';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const TimePanel = ({ 
  onDateRangeChange,
  initialStartDate = null,
  initialEndDate = null, 
  onPanelStateChange,
  panelCommand = null
}) => {
 
console.log('TimePanel onPanelStateChange prop:', !!onPanelStateChange);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [activeMenu, setActiveMenu] = useState('calendar');
  // simplified: single bracket toggles a single DateRange container
  
  const [currentStartDate, setCurrentStartDate] = useState(initialStartDate);
  const [currentEndDate, setCurrentEndDate] = useState(initialEndDate || new Date());
  // Range link + selector state (container-only)
  const [linkActive, setLinkActive] = useState(false);
  const [linkDeltaMs, setLinkDeltaMs] = useState(0);
  const initStart = (initialStartDate || new Date());
  const initEnd = (initialEndDate || new Date());
  const [startSel, setStartSel] = useState({
    month: String(initStart.getMonth()),
    day: String(initStart.getDate()),
    year: String(initStart.getFullYear())
  });
  const [endSel, setEndSel] = useState({
    month: String(initEnd.getMonth()),
    day: String(initEnd.getDate()),
    year: String(initEnd.getFullYear())
  });

  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  
  const [openDropdown, setOpenDropdown] = useState(null);
  // Gate calendar controls so they fade in only after brackets finish fading out
  const [allowCalControls, setAllowCalControls] = useState(true);
  // (legacy split-bracket measurement removed)

  // Coordinate animations between calendar nav and bracket controls
  // Calendar nav fades out with total ~0.5s (delay 0.25 + duration 0.25)
  const NAV_FADE_DELAY = 0.5;
  // Durations (ms) to coordinate UI rhythm
  const CAL_EXIT_MS = 250;      // calendar controls fade-out
  // (legacy text fade constant removed)

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
  // legacy collapse coordination removed
  // Which side to edit inside DateRange container
  const [rangeSelectingEnd, setRangeSelectingEnd] = useState(false);

  // Helpers for inline selectors in container
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const clampToToday = (d) => (d > TODAY ? new Date(TODAY) : d);
  const toDateFromSel = (sel) => new Date(parseInt(sel.year), parseInt(sel.month), parseInt(sel.day));
  const completeSel = (sel) => sel.year !== '' && sel.month !== '' && sel.day !== '';
  const makeMonthOptions = (yearStr) => {
    const y = parseInt(yearStr);
    const maxMonth = isNaN(y) || y < CURRENT_YEAR ? 11 : CURRENT_MONTH;
    return [{ value: '', label: 'Month' }, ...MONTHS.slice(0, maxMonth + 1).map((m, i) => ({ value: String(i), label: m }))];
  };
  const makeYearOptions = () => {
    const startY = CURRENT_YEAR - 5;
    return [{ value: '', label: 'Year' }, ...Array.from({ length: 6 }, (_, i) => ({ value: String(startY + i), label: String(startY + i) }))];
  };
  const makeDayOptions = (monthStr, yearStr) => {
    const y = parseInt(yearStr);
    const m = parseInt(monthStr);
    if (isNaN(y) || isNaN(m)) {
      return [{ value: '', label: 'Day' }, ...Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))];
    }
    const maxDay = getDaysInMonth(m, y);
    const days = [];
    for (let d = 1; d <= maxDay; d++) {
      const candidate = new Date(y, m, d);
      if (candidate <= TODAY) days.push({ value: String(d), label: String(d) });
    }
    return [{ value: '', label: 'Day' }, ...days];
  };

  // Sync selector state with underlying dates
  React.useEffect(() => {
    if (currentStartDate) {
      setStartSel({
        month: String(currentStartDate.getMonth()),
        day: String(currentStartDate.getDate()),
        year: String(currentStartDate.getFullYear())
      });
    }
  }, [currentStartDate]);
  React.useEffect(() => {
    if (currentEndDate) {
      setEndSel({
        month: String(currentEndDate.getMonth()),
        day: String(currentEndDate.getDate()),
        year: String(currentEndDate.getFullYear())
      });
    }
  }, [currentEndDate]);

  // Add this useEffect after your existing useEffects
    React.useEffect(() => {
        console.log('TimePanel sending state:', { activeMenu, viewMonth, viewYear });
    if (onPanelStateChange) {
        onPanelStateChange({
        activeMenu,
        viewMonth,
        viewYear,
        allowCalControls
        });
    }
  }, [activeMenu, viewMonth, viewYear, allowCalControls]);

  // Link toggle stores current delta
  const toggleLink = () => {
    const delta = (currentEndDate && currentStartDate) ? (currentEndDate.getTime() - currentStartDate.getTime()) : 0;
    setLinkDeltaMs(delta);
    setLinkActive(prev => !prev);
  };

  const handleStartSelChange = (field, value) => {
    const sel = { ...startSel, [field]: String(value) };
    setStartSel(sel);
    if (!completeSel(sel)) return;
    let nextStart = clampToToday(toDateFromSel(sel));
    if (linkActive) {
      let nextEnd = clampToToday(new Date(nextStart.getTime() + linkDeltaMs));
      setCurrentStartDate(nextStart);
      setCurrentEndDate(nextEnd);
      onDateRangeChange?.(nextStart, nextEnd);
    } else {
      setCurrentStartDate(nextStart);
      onDateRangeChange?.(nextStart, currentEndDate);
    }
  };
  const handleEndSelChange = (field, value) => {
    const sel = { ...endSel, [field]: String(value) };
    setEndSel(sel);
    if (!completeSel(sel)) return;
    let nextEnd = clampToToday(toDateFromSel(sel));
    if (linkActive) {
      let nextStart = clampToToday(new Date(nextEnd.getTime() - linkDeltaMs));
      setCurrentStartDate(nextStart);
      setCurrentEndDate(nextEnd);
      onDateRangeChange?.(nextStart, nextEnd);
    } else {
      setCurrentEndDate(nextEnd);
      onDateRangeChange?.(currentStartDate, nextEnd);
    }
  };

  const handleMenuToggle = (menuType) => {
    if (menuType === 'daterange') {
      // Fade out calendar nav controls when switching to date range
      setAllowCalControls(false);
      if (activeMenu === 'calendar') {
        setActiveMenu(null);
        setTimeout(() => setActiveMenu('daterange'), CAL_EXIT_MS);
      } else {
        setActiveMenu(activeMenu === 'daterange' ? null : 'daterange');
      }
    } else if (menuType === 'calendar') {
      if (activeMenu === 'calendar') {
        setActiveMenu(null);
      } else {
        setActiveMenu('calendar');
        if (activeMenu === 'daterange') setAllowCalControls(true);
      }
    } else {
      setActiveMenu(activeMenu === menuType ? null : menuType);
    } 
  };

  const handleDropdownToggle = (dropdownId) => {
    setOpenDropdown(openDropdown === dropdownId ? null : dropdownId);
  };

  // Single closed bracket toggles DateRange container in-place
  const handleSingleBracketClick = () => {
    if (activeMenu === 'calendar') {
      setActiveMenu(null);
      setTimeout(() => setActiveMenu('daterange'), CAL_EXIT_MS);
    } else {
      setActiveMenu(activeMenu === 'daterange' ? null : 'daterange');
    }
  };

  const setMonthFromValue = (val) => {
    val = parseInt(val);
    setViewMonth(prev => (safeViewYear === CURRENT_YEAR) ? Math.min(val, CURRENT_MONTH) : val);
  };

  const setYearFromValue = (y) => {
    y = parseInt(y);
    setViewYear(y);
    // If switching to current year and current month selection is in the future, clamp it
    setViewMonth(prev => (y === CURRENT_YEAR && prev > CURRENT_MONTH) ? CURRENT_MONTH : prev);
  };

  const handleMonthChange = (e) => setMonthFromValue(e.target.value);
  const handleYearChange = (e) => setYearFromValue(e.target.value);

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

  // Respond to external control commands (from ControlPanel strip)
  React.useEffect(() => {
    if (!panelCommand || !panelCommand.type) return;
    switch(panelCommand.type){
      case 'showMenu':
        // Explicitly show a menu without toggling off
        if (panelCommand.menu === 'calendar') setAllowCalControls(true);
        if (panelCommand.menu === 'daterange' || panelCommand.menu === 'settings') setAllowCalControls(false);
        setActiveMenu(panelCommand.menu || 'calendar');
        break;
      case 'toggleMenu':
        handleMenuToggle(panelCommand.menu);
        break;
      case 'singleBracket':
        handleSingleBracketClick();
        break;
      case 'navigateMonth':
        navigateMonth(panelCommand.delta || 0);
        break;
      case 'setMonth':
        setMonthFromValue(panelCommand.value);
        break;
      case 'setYear':
        setYearFromValue(panelCommand.value);
        break;
      default:
        break;
    }
  }, [panelCommand]);

  // (legacy utilities removed)

  return (
    <div className="w-full">
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

        {activeMenu === 'daterange' && (
          <motion.div
            key="daterange"
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
                onRangeChange={rangeSelectingEnd ? handleEndDateChange : handleStartDateChange}
                selectingEnd={rangeSelectingEnd}
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
