import React from 'react';
// import * as KPIs from '../../../adapters/metric/kpis/index.js';
const KPIs = {};

export default function MetricSelection({ draft = {}, query, onPanelStateChange }) {
  const selectedMetrics = draft.selectedMetrics || [];
  const availableKPIs = Object.keys(KPIs);

  const handleMetricToggle = (metricId) => {
    const isSelected = selectedMetrics.includes(metricId);
    onPanelStateChange?.({ 
      toggleMetric: { metricId, isSelected: !isSelected }
    });
  };

  const handleSelectAll = () => {
    onPanelStateChange?.({ selectedMetrics: [...availableKPIs] });
  };

  const handleClearAll = () => {
    onPanelStateChange?.({ selectedMetrics: [] });
  };


  return (
    <div className="bg-white">
      {/* Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-900">Select Metrics</div>
          <div className="flex gap-2">
            <button
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={handleSelectAll}
            >
              Select All
            </button>
            <button
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={handleClearAll}
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {selectedMetrics.length} of {availableKPIs.length} selected
        </div>
      </div>

      {/* Metric List */}
      <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
        {availableKPIs.map((metricId) => {
          const isSelected = selectedMetrics.includes(metricId);
          return (
            <div
              key={metricId}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                isSelected 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              onClick={() => handleMetricToggle(metricId)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleMetricToggle(metricId)}
                      className="rounded text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="text-sm font-medium text-gray-900">
                      {formatMetricName(metricId)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 ml-6">
                    {getMetricDescription(metricId)}
                  </div>
                  {getMetricTags(metricId).length > 0 && (
                    <div className="flex gap-1 mt-2 ml-6">
                      {getMetricTags(metricId).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {selectedMetrics.length > 0 && (
        <div className="p-3 border-t border-gray-100 flex justify-center">
          <div className="text-xs text-green-600">
            ✓ {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? 's' : ''} selected
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for metric display
function formatMetricName(metricId) {
  const names = {
    quantitySold: 'Quantity Sold',
    quantitySoldByVariant: 'Quantity by Variant', 
    totalRevenue: 'Total Revenue',
    averageOrderValue: 'Average Order Value'
  };
  return names[metricId] || metricId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function getMetricDescription(metricId) {
  const descriptions = {
    quantitySold: 'Total units sold grouped by product name',
    quantitySoldByVariant: 'Units sold grouped by product variant (name + color + size)',
    totalRevenue: 'Total revenue from all sales transactions',
    averageOrderValue: 'Average monetary value per order'
  };
  return descriptions[metricId] || 'Custom metric calculation';
}

function getMetricTags(metricId) {
  const tags = {
    quantitySold: ['Grouping', 'Product'],
    quantitySoldByVariant: ['Grouping', 'Variant', 'New'],
    totalRevenue: ['Revenue', 'Sum'],
    averageOrderValue: ['Revenue', 'Average']
  };
  return tags[metricId] || [];
}