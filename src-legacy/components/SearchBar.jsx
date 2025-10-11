import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IconSearch, IconX, IconCornerDownLeft, IconSquarePlus, IconPlus } from '@tabler/icons-react';

export default function SearchBar({
  value = '',
  onChange,
  onSubmit,
  onClear,
  suggestions = [],
  onSelectSuggestion,
  loading = false,
  error = null,
  placeholder = 'Search…',
  autoFocus = false,
  className = '',
  maxVisible = 12,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (suggestions?.length) setOpen(true);
    else setOpen(false);
    setActiveIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (open) {
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          onSelectSuggestion?.(suggestions[activeIndex]);
        } else if (suggestions && suggestions.length > 0) {
          onSelectSuggestion?.(suggestions[0]);
        } else {
          onSubmit?.(value);
        }
        setOpen(false);
      } else {
        onSubmit?.(value);
      }
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min((i + 1), Math.min(suggestions.length, maxVisible) - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={`relative w-full shadow ${className}`}>
      <div className="flex items-center gap-1 shadow-lg rounded">
        <div className="flex items-center gap-1 rounded px-2 py-1 bg-white flex-1">
          <IconSearch size={16} className="text-gray-500" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 text-sm outline-none"
          />
          {!!value && (
            <button title="Clear" className="text-gray-400 hover:text-gray-600" onClick={() => { onClear?.(); inputRef.current?.focus(); }}>
              <IconX size={16} />
            </button>
          )}
        </div>
        {!!value && (
          <button 
            title="Submit search" 
            className="text-white bg-gray-900 p-1.5 hover:text-gray-900 p-1 rounded-r hover:bg-gray-200" 
            onClick={() => onSubmit?.(value)}
          >
            <IconPlus size={18} stroke={2.50} />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white rounded shadow z-50 overflow-hidden">
          {loading && <div className="text-xs text-gray-500 px-2 py-2">Searching…</div>}
          {error && <div className="text-xs text-red-600 px-2 py-2">{error}</div>}
          {!loading && !error && (
            <ul className="max-h-48 overflow-y-auto">
              {suggestions.slice(0, maxVisible).map((s, i) => (
                <li
                  key={`sugg-${i}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onSelectSuggestion?.(s); setOpen(false); }}
                  className={`px-2 py-1 text-xs cursor-pointer ${i === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  {typeof s === 'string' ? s : (s.title || s.label || JSON.stringify(s))}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
