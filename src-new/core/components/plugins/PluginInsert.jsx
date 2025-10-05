import React, { useState, useRef, useEffect } from 'react';
import { IconDownload, IconCheck, IconX, IconLoader, IconFilter } from '@tabler/icons-react';

/**
 * PluginInsert - Data input plugin component
 * 
 * Handles receiving data from other components and inserting it into the current context
 * Provides UI for selecting data sources and transformation options
 */
export default function PluginInsert({
  targetContext = {}, // Context where data will be inserted
  acceptedDataTypes = [], // Which data types this component can accept
  onDataReceived = null, // Callback when data is successfully received
  onError = null, // Callback for error handling
  containerStyle = "bg-green-50 border border-green-200 rounded",
  containerPadding = "p-2",
  isActive = false, // Whether this plugin is currently active/connected
  size = "sm", // sm, md, lg
  availableData = [] // Available data packages that can be inserted
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [insertStatus, setInsertStatus] = useState('idle'); // idle, inserting, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const componentRef = useRef(null);

  // Filter available data by accepted types
  useEffect(() => {
    const filtered = availableData.filter(data => 
      acceptedDataTypes.length === 0 || acceptedDataTypes.includes(data.type)
    );
    setFilteredData(filtered);
  }, [availableData, acceptedDataTypes]);

  // Auto-collapse when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (componentRef.current && !componentRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  // Reset status after success/error
  useEffect(() => {
    if (insertStatus === 'success' || insertStatus === 'error') {
      const timer = setTimeout(() => {
        setInsertStatus('idle');
        setErrorMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [insertStatus]);

  const handleInsert = async () => {
    if (!selectedData) return;

    try {
      setInsertStatus('inserting');
      
      // Process the data for insertion
      const processedData = {
        ...selectedData,
        insertedAt: new Date().toISOString(),
        targetContext: targetContext,
        insertId: `insert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      };

      // Simulate insertion processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (onDataReceived) {
        onDataReceived(processedData);
      }
      
      setInsertStatus('success');
      setIsExpanded(false);
    } catch (error) {
      setInsertStatus('error');
      setErrorMessage(error.message || 'Failed to insert data');
      if (onError) {
        onError(error);
      }
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'lg': return { button: 'w-8 h-8', icon: 18, panel: 'w-64' };
      case 'md': return { button: 'w-6 h-6', icon: 16, panel: 'w-56' };
      case 'sm': 
      default: return { button: 'w-5 h-5', icon: 14, panel: 'w-48' };
    }
  };

  const sizeClasses = getSizeClasses();

  const getStatusIcon = () => {
    switch (insertStatus) {
      case 'inserting':
        return <IconLoader size={sizeClasses.icon} className="text-green-600 animate-spin" />;
      case 'success':
        return <IconCheck size={sizeClasses.icon} className="text-green-600" />;
      case 'error':
        return <IconX size={sizeClasses.icon} className="text-red-600" />;
      default:
        return <IconDownload size={sizeClasses.icon} className={isActive ? "text-green-600" : "text-gray-400"} />;
    }
  };

  const getButtonStyle = () => {
    if (insertStatus === 'success') return 'bg-green-50 border-green-300 hover:bg-green-100';
    if (insertStatus === 'error') return 'bg-red-50 border-red-300 hover:bg-red-100';
    if (isActive) return 'bg-green-50 border-green-300 hover:bg-green-100';
    return 'bg-gray-50 border-gray-300 hover:bg-gray-100';
  };

  const formatDataPreview = (data) => {
    if (data.source?.productName) {
      return `${data.source.productName} (${data.type})`;
    }
    return `${data.type} data (${new Date(data.timestamp).toLocaleTimeString()})`;
  };

  return (
    <div ref={componentRef} className="relative">
      {/* Insert Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`${sizeClasses.button} flex items-center justify-center rounded border transition-all ${getButtonStyle()}`}
        title={isActive ? "Insert data" : "Insert plugin (not connected)"}
        disabled={insertStatus === 'inserting'}
      >
        {getStatusIcon()}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className={`absolute top-full mt-1 left-0 ${sizeClasses.panel} ${containerStyle} ${containerPadding} shadow-lg z-50`}>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Insert Data</h4>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IconX size={14} />
              </button>
            </div>

            {/* Accepted Types Info */}
            {acceptedDataTypes.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Accepted Types
                </label>
                <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                  {acceptedDataTypes.map(type => 
                    type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  ).join(', ')}
                </div>
              </div>
            )}

            {/* Available Data Selection */}
            {filteredData.length > 0 ? (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Available Data ({filteredData.length})
                </label>
                <select
                  value={selectedData?.id || ''}
                  onChange={(e) => {
                    const selected = filteredData.find(d => d.id === e.target.value);
                    setSelectedData(selected);
                  }}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select data source...</option>
                  {filteredData.map(data => (
                    <option key={data.id} value={data.id}>
                      {formatDataPreview(data)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 flex items-center gap-1">
                <IconFilter size={12} />
                No compatible data available
              </div>
            )}

            {/* Target Context Info */}
            {targetContext.productName && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Target
                </label>
                <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                  {targetContext.productName}
                </div>
              </div>
            )}

            {/* Error Message */}
            {insertStatus === 'error' && errorMessage && (
              <div className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                {errorMessage}
              </div>
            )}

            {/* Insert Button */}
            <button
              onClick={handleInsert}
              disabled={!selectedData || insertStatus === 'inserting'}
              className={`w-full text-xs py-1 px-2 rounded transition-colors ${
                !selectedData || insertStatus === 'inserting'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {insertStatus === 'inserting' ? 'Inserting...' : 'Insert Data'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing PluginInsert state
 */
export function usePluginInsert(initialContext = {}, initialAcceptedTypes = []) {
  const [targetContext, setTargetContext] = useState(initialContext);
  const [acceptedDataTypes, setAcceptedDataTypes] = useState(initialAcceptedTypes);
  const [receivedData, setReceivedData] = useState([]);
  const [availableData, setAvailableData] = useState([]);

  const updateTargetContext = (context) => {
    setTargetContext(prev => ({ ...prev, ...context }));
  };

  const updateAcceptedTypes = (types) => {
    setAcceptedDataTypes(types);
  };

  const updateAvailableData = (data) => {
    setAvailableData(data);
  };

  const handleDataReceived = (dataPackage) => {
    setReceivedData(prev => [...prev, dataPackage]);
    console.log('=å PluginInsert: Data received:', dataPackage);
  };

  const handleError = (error) => {
    console.error('=å PluginInsert: Insert error:', error);
  };

  return {
    targetContext,
    acceptedDataTypes,
    receivedData,
    availableData,
    updateTargetContext,
    updateAcceptedTypes,
    updateAvailableData,
    handleDataReceived,
    handleError
  };
}