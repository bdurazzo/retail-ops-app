import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const ScrollSelector = ({ 
  value, 
  onChange, 
  options, 
  placeholder,
  className = '',
  disabled = false,
  isOpen,
  onToggle,
  dropdownId
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [contentHeight, setContentHeight] = useState(0);
  const buttonRef = useRef();
  const contentRef = useRef();
  const scrollRef = useRef();

  // Sync internal value with prop value
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Get button position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Measure content height
  useEffect(() => {
    if (!contentRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        setContentHeight(height);
      }
    });

    resizeObserver.observe(contentRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
        if (scrollRef.current && scrollRef.current.contains(event.target)) return;
        if (buttonRef.current && buttonRef.current.contains(event.target)) return;

        onToggle?.(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);

  }, [isOpen, onToggle]);

  // Infinite scroll implementation
  useEffect(() => {
    if (!isOpen || !scrollRef.current) return;

    const scrollContainer = scrollRef.current;
    const baseOptions = options.slice(1); // Remove placeholder
    const effectiveOptions = baseOptions.length === 1 ? [baseOptions[0], baseOptions[0]] : baseOptions;
    const itemHeight = 30; // Height of each item (matches inline style)
    const totalHeight = effectiveOptions.length * itemHeight;
    
    // Set initial scroll position to show next item after current selection
    const currentIndex = effectiveOptions.findIndex(opt => opt.value === internalValue);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % effectiveOptions.length; // start list at item after current
      scrollContainer.scrollTop = totalHeight + (nextIndex * itemHeight);
    }

    const handleScroll = () => {
      const { scrollTop } = scrollContainer;
      
      // If scrolled near top, jump to bottom section
      if (scrollTop < totalHeight * 0.5) {
        scrollContainer.scrollTop = scrollTop + totalHeight;
      }
      // If scrolled near bottom, jump to top section  
      else if (scrollTop > totalHeight * 1.5) {
        scrollContainer.scrollTop = scrollTop - totalHeight;
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isOpen, internalValue, options]);

  const handleSelect = (optionValue, event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    setInternalValue(optionValue);
    onChange({ target: { value: optionValue } });
    
    // Close dropdown after selection with slight delay
    setTimeout(() => {
      onToggle?.(null);
    }, 50);
  };

  const displayValue = options.find(opt => opt.value === internalValue)?.label || placeholder;
  
  // Create 3 copies of options for infinite scroll
  const baseOptions = options.slice(1); // Remove placeholder
  const effectiveOptions = baseOptions.length === 1 ? [baseOptions[0], baseOptions[0]] : baseOptions;
  const infiniteOptions = [...effectiveOptions, ...effectiveOptions, ...effectiveOptions];

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={`text-xs font-medium px-1 py-1 rounded border min-w-[30px] text-center bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed ${className}`}
      >
        {displayValue}
      </button>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.(dropdownId);
        }}
        className={`text-xs font-medium px-2 py-1.5 cursor-pointer drop-shadow-md min-w-[50px] rounded-t text-center flex items-center justify-center transition-all ${
          isOpen ? 'bg-gradient-to-b from-black via-gray-800 to-gray-700 text-white' : 'bg-gradient-to-t from-gray-50 via-gray-100 to-gray-50 ring-1 ring-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
        } ${className}`}
      >
        {displayValue}
      </button>
      
      {createPortal(
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key={dropdownId}
              className="absolute bg-white shadow-lg border border-gray-200 rounded-b-md"
              initial={{ opacity: 0, height: 0 }}
              animate={{ 
                opacity: 1, 
                height: contentHeight > 0 ? contentHeight : "auto"
              }}
              exit={{ opacity: 1, height: 0 }}
              transition={{
                opacity: { duration: 0.01, ease: "easeInOut" },
                height: { duration: 0.2, ease: "easeInOut" }
              }}
              style={{ 
                position: "absolute",
                top: position.top,
                left: position.left,
                width: position.width,
                zIndex: 9999,
                overflow: "hidden"
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <div ref={contentRef}>
                <div 
                  ref={scrollRef}
                  className="max-h-[152px] overflow-y-auto"
                  style={{ 
                    scrollBehavior: 'auto',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none' 
                  }}
                >
                  {infiniteOptions.map((option, index) => {
                    const disabled = !!option.disabled;
                    return (
                      <div
                        key={`${option.value}-${index}`}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (e.stopImmediatePropagation) {
                            e.stopImmediatePropagation();
                          }
                        }}
                        onClick={(e) => {
                          if (disabled) return;
                          e.stopPropagation();
                          e.preventDefault();
                          handleSelect(option.value, e);
                        }}
                        aria-disabled={disabled}
                        className={`px-4 py-2 text-xs border-b border-gray-100 last:border-b-0 text-center transition-colors ${
                          disabled ? 'text-gray-300 cursor-not-allowed bg-white' : 'cursor-pointer hover:bg-gray-50 text-gray-800'
                        }`}
                        style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {option.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ScrollSelector;
