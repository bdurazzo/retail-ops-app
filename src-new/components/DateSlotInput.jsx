import React, { useState, useRef } from 'react';
import DateSlotPicker from './DateSlotPicker.jsx';

const DateSlotInput = ({
  value = '',
  onChange = () => {},
  onSubmit = () => {},
  placeholder = 'MM-DD-YYYY',
  className = '',
  dateType = 'date'
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const inputRef = useRef(null);

  const formatDate = (date) => {
    if (!date) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const [month, day, year] = dateString.split('-').map(Number);
    if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day);
    }
    return null;
  };

  const handleDateSelect = (date) => {
    const formatted = formatDate(date);
    onChange(formatted);
    onSubmit(formatted);
    setIsPickerOpen(false);
  };

  const handleInputClick = () => {
    setIsPickerOpen(true);
  };

  const handleInputChange = (e) => {
    // Still allow manual typing
    const formatted = formatDateInput(e.target.value);
    onChange(formatted);
  };

  const formatDateInput = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
  };

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onClick={handleInputClick}
        className={`cursor-pointer ${className}`}
        readOnly={false} // Allow typing but also trigger picker on click
      />
      
      <DateSlotPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onDateSelect={handleDateSelect}
        initialDate={parseDate(value)}
        anchorRef={inputRef}
        dateType={dateType}
      />
    </>
  );
};

export default DateSlotInput;