import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ControlPanel({
  leftButtons = [],
  rightButtons = [],
  centerControls = null,
  activeMenu = null,
  menuContents = {},
  onMenuToggle,
  showCenterControls = true
}) {
  
  const renderButton = (button, index) => (
    <button
      key={button.id || index}
      onClick={() => onMenuToggle?.(button.id)}
      className={`p-1 rounded transition-all ${
        activeMenu === button.id 
          ? 'bg-gray-900 text-white' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      title={button.title}
      disabled={button.disabled}
    >
      {button.icon}
    </button>
  );

  return (
    <div className="w-full">
      {/* Control Bar */}
      <div className="bg-gradient-to-b from-gray-50 via-white to-gray-200 rounded-t-xl p-2">
        <div className="flex items-center justify-between">
          {/* Left Side Buttons */}
          <div className="flex items-center relative gap-1">
            {leftButtons.map(renderButton)}
          </div>

          {/* Center Controls (conditionally shown) */}
          <div className="flex rounded px-2 items-center gap-2">
            <AnimatePresence initial={false} mode="wait">
              {showCenterControls && centerControls && (
                <motion.div
                  key="center-controls"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{opacity: 0, }}
                  transition={{ delay: 0, duration: 0.6, ease: 'easeInOut' }}
                  className="flex items-center gap-2"
                >
                  {centerControls}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Side Buttons */}
          <div className="flex bg-white px-2 items-center gap-1">
            {rightButtons.map(renderButton)}
          </div>
        </div>
      </div>

      {/* Animated Menu Contents */}
      <AnimatePresence mode="wait">
        {activeMenu && menuContents[activeMenu] && (
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
              {menuContents[activeMenu]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}