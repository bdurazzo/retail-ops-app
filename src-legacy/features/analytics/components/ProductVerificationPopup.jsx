import React, { useState } from 'react';
import { IconX, IconCheck, IconAlertTriangle } from '@tabler/icons-react';

// ProductVerificationPopup: Shows discovered products for user verification
export default function ProductVerificationPopup({ 
  isOpen, 
  discoveredProducts = [], 
  onApprove, 
  onCancel 
}) {
  // Track user choices for each discovered product (use cached decisions or default to checked)
  const [choices, setChoices] = useState({});

  // Track whether to remember choices for future searches
  const [rememberChoices, setRememberChoices] = useState(true);

  // Update choices when discoveredProducts changes
  React.useEffect(() => {
    const initial = {};
    discoveredProducts.forEach(product => {
      // Always default to checked - no caching
      initial[product.name] = true;
    });
    setChoices(initial);
  }, [discoveredProducts]);

  const handleToggle = (productName) => {
    setChoices(prev => ({
      ...prev,
      [productName]: !prev[productName]
    }));
  };

  const handleSelectAll = () => {
    const newState = {};
    discoveredProducts.forEach(product => {
      newState[product.name] = true;
    });
    setChoices(newState);
  };

  const handleSelectNone = () => {
    const newState = {};
    discoveredProducts.forEach(product => {
      newState[product.name] = false;
    });
    setChoices(newState);
  };

  const handleApprove = () => {
    onApprove(choices, rememberChoices);
  };

  const selectedCount = Object.values(choices).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel}></div>
      
      {/* Modal - Mobile responsive */}
      <div className="relative bg-white rounded-lg shadow-xl w-full mx-2 sm:mx-4 max-w-sm sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col">
        {/* Header - Mobile responsive */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <IconAlertTriangle size={18} className="text-amber-500 sm:w-5 sm:h-5" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Additional Products Found
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Close"
          >
            <IconX size={18} className="text-gray-500 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content - Mobile responsive */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-gray-700 mb-2">
              Found {discoveredProducts.length} product{discoveredProducts.length !== 1 ? 's' : ''} in order data 
              not available in current catalog. These may be historical products from system migrations.
            </p>
            <p className="text-xs text-gray-500">
              Select which products to include in your analysis:
            </p>
          </div>

          {/* Select All/None Controls - Mobile responsive */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3 sm:mb-4 pb-3 border-b border-gray-100">
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Select All
              </button>
              <span className="text-xs text-gray-300">|</span>
              <button
                onClick={handleSelectNone}
                className="text-xs text-gray-600 hover:text-gray-800 underline"
              >
                Select None
              </button>
            </div>
            <span className="flex-1 sm:text-right">
              <span className="text-xs text-gray-500">
                {selectedCount} of {discoveredProducts.length} selected
              </span>
            </span>
          </div>

          {/* Product List - Mobile responsive */}
          <div className="space-y-2 sm:space-y-3">
            {discoveredProducts.map((product, index) => (
              <div
                key={product.name}
                className={`p-2 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
                  choices[product.name] 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleToggle(product.name)}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* Checkbox */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      choices[product.name]
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {choices[product.name] && (
                        <IconCheck size={12} className="text-white" />
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-xs sm:text-sm mb-1 break-words">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-600 flex flex-col sm:flex-row sm:space-x-4">
                      <span>{product.orderCount} orders</span>
                      <span>{product.totalQuantity} units sold</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer - Mobile responsive */}
        <div className="flex flex-col p-3 sm:p-4 border-t border-gray-200 gap-3">
          {/* Remember choices checkbox */}
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              <div 
                className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${
                  rememberChoices
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
                onClick={() => setRememberChoices(!rememberChoices)}
              >
                {rememberChoices && (
                  <IconCheck size={12} className="text-white" />
                )}
              </div>
            </div>
            <label 
              className="text-xs text-gray-600 cursor-pointer flex-1"
              onClick={() => setRememberChoices(!rememberChoices)}
            >
              Remember my choices for future searches (you won't see this popup again for these products)
            </label>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={onCancel}
              className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              className="px-3 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 w-full sm:w-auto"
            >
              Continue with {selectedCount} Product{selectedCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}