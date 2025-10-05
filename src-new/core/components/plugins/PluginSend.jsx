import React, { useState, useRef, useEffect } from 'react';
import { IconSend, IconCheck, IconX, IconLoader } from '@tabler/icons-react';

/**
 * PluginSend - Data output plugin component
 * 
 * Handles sending data from a source component to other components
 * Provides UI for selecting data type and destination
 */
export default function PluginSend({
  sourceData = null, // The data to send
  sourceContext = {}, // Context about the data source
  availableDataTypes = [], // Which data types this source can send
  onDataSent = null, // Callback when data is successfully sent
  onError = null, // Callback for error handling
  containerStyle = "bg-blue-50 border border-blue-200 rounded",
  containerPadding = "p-2",
  isActive = false, // Whether this plugin is currently active/connected
  size = "sm" // sm, md, lg
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDataType, setSelectedDataType] = useState(null);
  const [sendStatus, setSendStatus] = useState('idle'); // idle, sending, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const componentRef = useRef(null);

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
    if (sendStatus === 'success' || sendStatus === 'error') {
      const timer = setTimeout(() => {
        setSendStatus('idle');
        setErrorMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sendStatus]);

  const handleSend = async () => {
    if (!selectedDataType || !sourceData) return;

    try {
      setSendStatus('sending');
      
      // Prepare data package
      const dataPackage = {
        type: selectedDataType,
        data: sourceData,
        source: sourceContext,
        timestamp: new Date().toISOString(),
        id: `send_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      };

      // Simulate sending (in real implementation, this would go to a data store or event system)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (onDataSent) {
        onDataSent(dataPackage);
      }
      
      setSendStatus('success');
      setIsExpanded(false);
    } catch (error) {
      setSendStatus('error');
      setErrorMessage(error.message || 'Failed to send data');
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
    switch (sendStatus) {
      case 'sending':
        return <IconLoader size={sizeClasses.icon} className="text-blue-600 animate-spin" />;
      case 'success':
        return <IconCheck size={sizeClasses.icon} className="text-green-600" />;
      case 'error':
        return <IconX size={sizeClasses.icon} className="text-red-600" />;
      default:
        return <IconSend size={sizeClasses.icon} className={isActive ? "text-blue-600" : "text-gray-400"} />;
    }
  };

  const getButtonStyle = () => {
    if (sendStatus === 'success') return 'bg-green-50 border-green-300 hover:bg-green-100';
    if (sendStatus === 'error') return 'bg-red-50 border-red-300 hover:bg-red-100';
    if (isActive) return 'bg-blue-50 border-blue-300 hover:bg-blue-100';
    return 'bg-gray-50 border-gray-300 hover:bg-gray-100';
  };

  return (
    <div ref={componentRef} className="relative">
      {/* Send Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`${sizeClasses.button} flex items-center justify-center rounded border transition-all ${getButtonStyle()}`}
        title={isActive ? "Send data" : "Send plugin (not connected)"}
        disabled={sendStatus === 'sending'}
      >
        {getStatusIcon()}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className={`absolute top-full mt-1 left-0 ${sizeClasses.panel} ${containerStyle} ${containerPadding} shadow-lg z-50`}>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Send Data</h4>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IconX size={14} />
              </button>
            </div>

            {/* Data Type Selection */}
            {availableDataTypes.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Data Type
                </label>
                <select
                  value={selectedDataType || ''}
                  onChange={(e) => setSelectedDataType(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select data type...</option>
                  {availableDataTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Source Info */}
            {sourceContext.productName && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Source
                </label>
                <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                  {sourceContext.productName}
                </div>
              </div>
            )}

            {/* Error Message */}
            {sendStatus === 'error' && errorMessage && (
              <div className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                {errorMessage}
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!selectedDataType || !sourceData || sendStatus === 'sending'}
              className={`w-full text-xs py-1 px-2 rounded transition-colors ${
                !selectedDataType || !sourceData || sendStatus === 'sending'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {sendStatus === 'sending' ? 'Sending...' : 'Send Data'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing PluginSend state
 */
export function usePluginSend(initialData = null, initialContext = {}) {
  const [sourceData, setSourceData] = useState(initialData);
  const [sourceContext, setSourceContext] = useState(initialContext);
  const [sentData, setSentData] = useState([]);

  const updateSourceData = (data) => {
    setSourceData(data);
  };

  const updateSourceContext = (context) => {
    setSourceContext(prev => ({ ...prev, ...context }));
  };

  const handleDataSent = (dataPackage) => {
    setSentData(prev => [...prev, dataPackage]);
    console.log('=� PluginSend: Data sent:', dataPackage);
  };

  const handleError = (error) => {
    console.error('=� PluginSend: Send error:', error);
  };

  return {
    sourceData,
    sourceContext,
    sentData,
    updateSourceData,
    updateSourceContext,
    handleDataSent,
    handleError
  };
}