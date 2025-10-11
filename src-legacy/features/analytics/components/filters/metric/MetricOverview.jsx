import React from 'react';
import * as KPIs from '../../../adapters/metric/kpis/index.js';

export default function MetricOverview({ draft = {}, query, onPanelStateChange, onEdit }) {
  const selectedMetrics = draft.selectedMetrics || [];
  const availableKPIs = Object.keys(KPIs);

  const handleEdit = () => {
    onEdit?.('selection');
  };

  const clearMetrics = () => {
    onPanelStateChange?.({ selectedMetrics: [] });
  };

  return (
    <div className="bg-white p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900">Selected Metrics</div>
        <div className="flex gap-2">
          <button
            className="text-xs text-blue-600 hover:text-blue-800"
            onClick={handleEdit}
          >
            {selectedMetrics.length > 0 ? 'Edit' : 'Add Metrics'}
          </button>
          {selectedMetrics.length > 0 && (
            <button
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={clearMetrics}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Selected Metrics Display */}
      {selectedMetrics.length > 0 ? (
        <div className="space-y-2">
          {selectedMetrics.map((metricId, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {formatMetricName(metricId)}
                </div>
                <div className="text-xs text-gray-500">
                  {getMetricDescription(metricId)}
                </div>
              </div>
              <button
                className="text-xs text-red-600 hover:text-red-800"
                onClick={() => onPanelStateChange?.({ 
                  selectedMetrics: selectedMetrics.filter(id => id !== metricId) 
                })}
                title="Remove metric"
              >
                Remove
              </button>
            </div>
          ))}
          
          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
            <div className="text-xs text-blue-700">
              <strong>{selectedMetrics.length}</strong> metric{selectedMetrics.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm mb-2">No metrics selected</div>
          <div className="text-xs text-gray-400 mb-4">
            Choose metrics to see data calculations and grouping
          </div>
          <button
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
            onClick={handleEdit}
          >
            Select Metrics
          </button>
        </div>
      )}

      {/* Available Metrics Count */}
      <div className="text-xs text-gray-400 text-center">
        {availableKPIs.length} metrics available
      </div>
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
  return names[metricId] || metricId;
}

function getMetricDescription(metricId) {
  const descriptions = {
    quantitySold: 'Total units sold grouped by product',
    quantitySoldByVariant: 'Units sold grouped by product variant (color/size)',
    totalRevenue: 'Total revenue from all sales',
    averageOrderValue: 'Average value per order'
  };
  return descriptions[metricId] || 'Custom metric calculation';
}