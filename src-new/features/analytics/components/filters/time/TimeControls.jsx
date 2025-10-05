import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconCalendarCheck,
  IconBracketsContain,
  IconChevronLeft,
  IconChevronRight,
  IconAdjustments
} from '@tabler/icons-react';
import ScrollSelector from '../../menus/ScrollSelector';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function TimeControls({
  panelState = {},
  onCommand,
}){
  const [openDropdown, setOpenDropdown] = useState(null);
  const { activeMenu, viewMonth, viewYear, allowCalControls } = panelState || {};
  // Local active state for immediate visual feedback; stays in sync with panelState
  const [localActiveMenu, setLocalActiveMenu] = useState(activeMenu ?? null);
  React.useEffect(() => {
    setLocalActiveMenu(activeMenu ?? null);
  }, [activeMenu]);

  const monthOptions = [{ value: '', label: 'Month' }, ...MONTHS.map((m,i)=>({ value: i, label: m }))];
  const currentYear = new Date().getFullYear();
  const yearOptions = [{ value: '', label: 'Year' }, ...Array.from({length:6},(_,i)=>({ value: currentYear-5+i, label: String(currentYear-5+i) }))];

  return (
    <div className="flex gap-2">
      <div className="flex gap-2">
        <button
          onClick={() => {
            const toggled = localActiveMenu === 'calendar';
            setLocalActiveMenu(toggled ? null : 'calendar');
            onCommand?.({ type: toggled ? 'toggleMenu' : 'showMenu', menu: 'calendar' });
          }}
          className={`p-1 rounded transition-all gap-1 ${localActiveMenu === 'calendar' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Calendar picker"
        >
          <IconCalendarCheck size={20} stroke={1.75} />
        </button>
        <button
          onClick={() => {
            const toggled = localActiveMenu === 'daterange';
            setLocalActiveMenu(toggled ? null : 'daterange');
            onCommand?.({ type: toggled ? 'toggleMenu' : 'showMenu', menu: 'daterange' });
          }}
          className={`p-1 rounded transition-all ${localActiveMenu === 'daterange' ? 'bg-gray-900 text-white' : 'text-gray-800 hover:bg-gray-100'}`}
          title="Date range"
        >
          <IconBracketsContain size={20} stroke={1.75} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <AnimatePresence initial={false} mode="wait">
          {allowCalControls !== false && (
            <motion.div
              key="cal-nav"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex items-center gap-2"
            >
              <button onClick={() => onCommand?.({ type: 'navigateMonth', delta: -1 })} className="hover:bg-gray-100 rounded transition-colors">
                <IconChevronLeft size={18} className="text-gray-600" />
              </button>
              <ScrollSelector
                value={viewMonth ?? ''}
                onChange={(e) => onCommand?.({ type: 'setMonth', value: e.target.value })}
                options={monthOptions}
                placeholder="Month"
                isOpen={openDropdown === 'month'}
                onToggle={(id) => setOpenDropdown(id)}
                dropdownId="month"
                className="min-w-[50px]"
              />
              <ScrollSelector
                value={viewYear ?? ''}
                onChange={(e) => onCommand?.({ type: 'setYear', value: e.target.value })}
                options={yearOptions}
                placeholder="Year"
                isOpen={openDropdown === 'year'}
                onToggle={(id) => setOpenDropdown(id)}
                dropdownId="year"
                className="min-w-[50px]"
              />
              <button onClick={() => onCommand?.({ type: 'navigateMonth', delta: 1 })} className="hover:bg-gray-100 rounded transition-colors">
                <IconChevronRight size={18} className="text-gray-600" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
