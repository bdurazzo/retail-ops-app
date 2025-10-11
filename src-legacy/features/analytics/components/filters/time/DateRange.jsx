import React, { useState, useEffect } from 'react';
import ScrollSelector from '../../menus/ScrollSelector';
import { IconBracketsContainStart, IconBracketsContainEnd, IconLineDotted } from '@tabler/icons-react';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DateRange = ({ startDate, endDate, onRangeChange, selectingEnd = false }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  // Range link toggle
  const [linkActive, setLinkActive] = useState(false);
  const [linkDeltaMs, setLinkDeltaMs] = useState(0);
  const today = new Date();
  
  const [startSelections, setStartSelections] = useState({
    month: startDate ? String(startDate.getMonth()) : String(today.getMonth()),
    day: startDate ? String(startDate.getDate()) : String(today.getDate()),
    year: startDate ? String(startDate.getFullYear()) : String(today.getFullYear())
  });
  
  const [endSelections, setEndSelections] = useState({
    month: endDate ? String(endDate.getMonth()) : String(today.getMonth()),
    day: endDate ? String(endDate.getDate()) : String(today.getDate()),
    year: endDate ? String(endDate.getFullYear()) : String(today.getFullYear())
  });

  // Sync internal state with external prop changes
  useEffect(() => {
    if (startDate) {
      setStartSelections({
        month: String(startDate.getMonth()),
        day: String(startDate.getDate()),
        year: String(startDate.getFullYear())
      });
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      setEndSelections({
        month: String(endDate.getMonth()),
        day: String(endDate.getDate()),
        year: String(endDate.getFullYear())
      });
    }
  }, [endDate]);

  const handleDropdownToggle = (dropdownId) => {
    setOpenDropdown(openDropdown === dropdownId ? null : dropdownId);
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Build month options for a side
  const monthOptionsFor = (isEnd) => {
    const yearStr = isEnd ? endSelections.year : startSelections.year;
    const y = parseInt(yearStr);
    const inCurrentYear = !isNaN(y) && y === today.getFullYear();
    return [
      { value: '', label: 'Month' },
      ...MONTHS.map((month, index) => {
        let disabled = false;
        if (inCurrentYear && index > today.getMonth()) disabled = true; // future months
        if (isEnd && startDate && !isNaN(y) && y === startDate.getFullYear() && index < startDate.getMonth()) disabled = true;
        if (!isEnd && endDate && !isNaN(y) && y === endDate.getFullYear() && index > endDate.getMonth()) disabled = true;
        return { value: String(index), label: month, disabled };
      })
    ];
  };

  const getDayOptionsFor = (isEnd) => {
    const month = isEnd ? endSelections.month : startSelections.month;
    const year = isEnd ? endSelections.year : startSelections.year;
    
    if (month === '' || year === '') {
      return [{ value: '', label: 'Day' }, ...Array.from({length: 31}, (_, i) => ({
        value: String(i + 1), label: String(i + 1)
      }))];
    }
    
    const daysInMonth = getDaysInMonth(parseInt(month), parseInt(year));
    const selectedMonth = parseInt(month);
    const selectedYear = parseInt(year);
    
    return [
      { value: '', label: 'Day' }, 
      ...Array.from({length: daysInMonth}, (_, i) => {
        const day = i + 1;
        const dateToCheck = new Date(selectedYear, selectedMonth, day);
        let disabled = false;
        if (dateToCheck > today) disabled = true; // future days
        if (isEnd && startDate && dateToCheck < startDate) disabled = true;
        if (!isEnd && endDate && dateToCheck > endDate) disabled = true;
        return { value: String(day), label: String(day), disabled };
      })
    ];
  };
  
  const yearOptionsFor = (isEnd) => {
    const minYear = 2022;
    const maxYear = today.getFullYear();
    const years = [];
    for (let y = minYear; y <= maxYear; y++) {
      let disabled = false;
      if (isEnd && startDate && y < startDate.getFullYear()) disabled = true;
      if (!isEnd && endDate && y > endDate.getFullYear()) disabled = true;
      years.push({ value: String(y), label: String(y), disabled });
    }
    return [{ value: '', label: 'Year' }, ...years];
  };

  const handleSelectionChange = (field, value, isEnd) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;

    if (isEnd) {
      const newEnd = { ...endSelections, [field]: String(numValue) };
      setEndSelections(newEnd);
      
      if (newEnd.month !== '' && newEnd.day !== '' && newEnd.year !== '') {
        const endDate = new Date(parseInt(newEnd.year), parseInt(newEnd.month), parseInt(newEnd.day));
        const currentStart = startSelections.month !== '' && startSelections.day !== '' && startSelections.year !== '' 
          ? new Date(parseInt(startSelections.year), parseInt(startSelections.month), parseInt(startSelections.day))
          : null;
        if (linkActive && currentStart) {
          const nextStart = new Date(endDate.getTime() - linkDeltaMs);
          onRangeChange?.(nextStart, endDate);
        } else {
          onRangeChange?.(currentStart, endDate);
        }
      }
    } else {
      const newStart = { ...startSelections, [field]: String(numValue) };
      setStartSelections(newStart);
      
      if (newStart.month !== '' && newStart.day !== '' && newStart.year !== '') {
        const startDate = new Date(parseInt(newStart.year), parseInt(newStart.month), parseInt(newStart.day));
        const currentEnd = endSelections.month !== '' && endSelections.day !== '' && endSelections.year !== ''
          ? new Date(parseInt(endSelections.year), parseInt(endSelections.month), parseInt(endSelections.day))
          : null;
        if (linkActive && currentEnd) {
          const nextEnd = new Date(startDate.getTime() + linkDeltaMs);
          onRangeChange?.(startDate, nextEnd);
        } else {
          onRangeChange?.(startDate, currentEnd);
        }
      }
    }
  };

  return (
    <div className="w-full p-2">
      {/* Top row: bracket icons and link toggle */}
      <div className="flex items-center justify-between px-1">
        <button className="p-1 rounded text-xs text-gray-700 hover:bg-gray-100" title="Start">
          <IconBracketsContainStart size={18} />
        </button>
        <button
          onClick={() => {
            const delta = (endDate && startDate) ? (endDate.getTime() - startDate.getTime()) : 0;
            setLinkDeltaMs(delta);
            setLinkActive((v) => !v);
          }}
          className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${linkActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Link dates"
        >
          <IconLineDotted size={14} />
          <span>Link</span>
        </button>
        <button className="p-1 rounded text-xs text-gray-700 hover:bg-gray-100" title="End">
          <IconBracketsContainEnd size={18} />
        </button>
      </div>

      {/* Inline MM/DD/YY selectors for start and end */}
      <div className="mt-3 flex items-center justify-center gap-5">
        {/* Start side */}
        <div className="flex items-center gap-1">
          <ScrollSelector
            value={startSelections.month}
            onChange={(e) => handleSelectionChange('month', e.target.value, false)}
            options={monthOptionsFor(false)}
            placeholder="MM"
            isOpen={openDropdown === 'start-month'}
            onToggle={handleDropdownToggle}
            dropdownId="start-month"
            className="min-w-[10px]"
          />
          <span className="text-gray-400">/</span>
          <ScrollSelector
            value={startSelections.day}
            onChange={(e) => handleSelectionChange('day', e.target.value, false)}
            options={getDayOptionsFor(false)}
            placeholder="DD"
            isOpen={openDropdown === 'start-day'}
            onToggle={handleDropdownToggle}
            dropdownId="start-day"
            className="min-w-[10px]"
          />
          <span className="text-gray-400">/</span>
          <ScrollSelector
            value={startSelections.year}
            onChange={(e) => handleSelectionChange('year', e.target.value, false)}
            options={yearOptionsFor(false)}
            placeholder="YY"
            isOpen={openDropdown === 'start-year'}
            onToggle={handleDropdownToggle}
            dropdownId="start-year"
            className="min-w-[10px]"
          />
        </div>
      </div>
      
      <div className="flex p-4 items-center justify-center">
        {/* End side */}
        <div className="flex items-center gap-1">
          <ScrollSelector
            value={endSelections.month}
            onChange={(e) => handleSelectionChange('month', e.target.value, true)}
            options={monthOptionsFor(true)}
            placeholder="MM"
            isOpen={openDropdown === 'end-month'}
            onToggle={handleDropdownToggle}
            dropdownId="end-month"
            className="min-w-[10px]"
          />
          <span className="text-gray-400">/</span>
          <ScrollSelector
            value={endSelections.day}
            onChange={(e) => handleSelectionChange('day', e.target.value, true)}
            options={getDayOptionsFor(true)}
            placeholder="DD"
            isOpen={openDropdown === 'end-day'}
            onToggle={handleDropdownToggle}
            dropdownId="end-day"
            className="min-w-[10px]"
          />
          <span className="text-gray-400">/</span>
          <ScrollSelector
            value={endSelections.year}
            onChange={(e) => handleSelectionChange('year', e.target.value, true)}
            options={yearOptionsFor(true)}
            placeholder="YY"
            isOpen={openDropdown === 'end-year'}
            onToggle={handleDropdownToggle}
            dropdownId="end-year"
            className="min-w-[10px]"
          />
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center">
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={() => {
              const today = new Date();
              const startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
              onRangeChange?.(startDate, today);
            }}
            className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
          >
            Last 7 days
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const startDate = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
              onRangeChange?.(startDate, today);
            }}
            className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
          >
            Last 30 days
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const startDate = new Date(today.getFullYear(), 0, 1);
              onRangeChange?.(startDate, today);
            }}
            className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
          >
            This year
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateRange;
