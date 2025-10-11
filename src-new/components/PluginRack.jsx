import React, { useState } from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

/**
 * PluginRack - 5 fixed slots with chevrons
 */
export default function PluginRack({
  pages = [],
  pluginsByPage = {},
  renderButton,
  slotsPerPage = 4,
  containerClassName = "",
  slotClassName = "",
  chevronClassName = "mb-4 bg-gray-100 rounded-xl p-1",
}) {
  const [activePage, setActivePage] = useState(pages[0]);
  const activeIndex = pages.indexOf(activePage);

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActivePage(pages[activeIndex - 1]);
    }
  };

  const handleNext = () => {
    if (activeIndex < pages.length - 1) {
      setActivePage(pages[activeIndex + 1]);
    }
  };

  // Get plugins for active page
  const activePlugins = (pluginsByPage[activePage] || []).slice(0, slotsPerPage);

  return (
    <div className={`flex flex-row w-full mx-3 justify-center items-center gap-5 bg-white  p-3 ${containerClassName}`}>
      <button onClick={handlePrev} disabled={activeIndex === 0} className={chevronClassName}>
        <IconChevronLeft size={14} />
      </button>

      {Array.from({ length: slotsPerPage }).map((_, index) => (
        <div key={index} className={slotClassName}>
          {activePlugins[index] && renderButton ? renderButton(activePlugins[index]) : null}
        </div>
      ))}

      <button onClick={handleNext} disabled={activeIndex === pages.length - 1} className={chevronClassName}>
        <IconChevronRight size={14} />
      </button>
    </div>
  );
}
