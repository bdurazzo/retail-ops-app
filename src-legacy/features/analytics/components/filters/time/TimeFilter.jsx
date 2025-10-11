import React, { useState, useEffect } from 'react';
import TimePanel from '../../panels/TimePanel';

const Time = ({ onRegister, resetNonce, query, panelCommand, onPanelStateChange }) => {
  // Initialize from saved query state instead of null
  const [startDate, setStartDate] = useState(() => {
    return query?.time?.startDate ? new Date(query.time.startDate) : null;
  });
  const [endDate, setEndDate] = useState(() => {
    return query?.time?.endDate ? new Date(query.time.endDate) : null;
  });

  // Handle date range changes from TimePanel (receives start, end directly)
  const handleDateRangeChange = (newStartDate, newEndDate) => {
    console.log('Time.jsx handleDateRangeChange called with:', { newStartDate, newEndDate });
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  // Register configuration with parent - only returns state when apply is called
  useEffect(() => {
    console.log('Registering Time panel with onRegister:', !!onRegister);
    if (onRegister) {
      const applyFn = () => {
        console.log('Time Apply called with:', { startDate, endDate });
        const result = {
          type: 'time',
          config: {
            time: {
              // Send FULL dates so timeAdapter can filter properly
              startDate: startDate ? startDate.toISOString().split('T')[0] : null, // YYYY-MM-DD
              endDate: endDate ? endDate.toISOString().split('T')[0] : null,       // YYYY-MM-DD
              // Also send month info for the data loader
              start: startDate ? startDate.toISOString().slice(0, 7) : null,       // YYYY-MM  
              end: endDate ? endDate.toISOString().slice(0, 7) : null              // YYYY-MM
            }
          },
          isValid: startDate && endDate
        };
        console.log('Time returning:', result);
        return result;
      };
      onRegister(applyFn);
    }
  }, [startDate, endDate, onRegister]);

  // Reset state when resetNonce changes
  useEffect(() => {
    setStartDate(null);
    setEndDate(null);
  }, [resetNonce]);

  // Sync with external query changes (like from reset or other state changes)
  useEffect(() => {
    if (query?.time) {
      setStartDate(query.time.startDate ? new Date(query.time.startDate) : null);
      setEndDate(query.time.endDate ? new Date(query.time.endDate) : null);
    } else {
      setStartDate(null);
      setEndDate(null);
    }
  }, [query?.time, resetNonce]);

  return (
    <div className="space-y-8">
      <div className="flex-none">
        <TimePanel
          onDateRangeChange={handleDateRangeChange}
          initialStartDate={startDate}
          initialEndDate={endDate}
          // Bridge: allow external controls to drive the panel
          panelCommand={panelCommand}
          onPanelStateChange={onPanelStateChange}
        />
      </div>
      
      {/* Summary when both dates are selected */}
      {/*startDate && endDate && (
        <div className=" p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-900 mb-1">Selected Range</div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{startDate.toLocaleDateString()}</span>
            {' '}to{' '}
            <span className="font-medium">{endDate.toLocaleDateString()}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1} days selected
          </div>
        </div>
      )*/}
    </div>
  );
};

export default Time;
