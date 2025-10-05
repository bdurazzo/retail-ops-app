import React, { useRef } from 'react';
import { IconSearch, IconX } from '@tabler/icons-react';

export default function SearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search…',
  showDropdown = false,
  dropdownContent = null,
}) {
  const inputRef = useRef(null);

  return (
    <div className="relative">
      {/* Input field */}
      <div className="flex items-center gap-2 px-3 py-1 bg-white">
        <IconSearch size={14} className="text-gray-400" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-sm outline-none bg-transparent"
        />
        {!!value && (
          <button 
            title="Clear" 
            className="text-gray-400 hover:text-gray-600" 
            onClick={() => onClear?.()}
          >
            <IconX size={14} />
          </button>
        )}
      </div>
      
    </div>
  );
}