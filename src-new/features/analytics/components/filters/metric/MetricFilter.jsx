import React, { useEffect, useState } from "react";
import MetricSelection from "./MetricSelection.jsx";
import Toolbar from "../../../../../components/Toolbar.jsx";
import { IconBriefcaseFilled, IconTrash } from '@tabler/icons-react';

// Export the toolbar for PanelView
export function MetricFilterToolbar() {
  return (
    <Toolbar
      leftContent={
        <div className="flex items-center gap-1">
          <button className="p-1 rounded transition-colors text-gray-600 hover:bg-gray-100 flex flex-col items-center w-8">
            <IconBriefcaseFilled size={16} stroke={1.75} />
            <span className="text-[10px] leading-none">Metric</span>
          </button>
          <div className="w-[2px] h-8 bg-gray-200 ml-1"></div>
        </div>
      }
      centerContent={
        <span className="text-xs text-gray-600">No metrics selected</span>
      }
      rightContent={
        <button className="p-1 rounded hover:bg-gray-100 text-gray-600" title="Clear metrics">
          <IconTrash size={18} />
        </button>
      }
      height="9"
      borderWidth={0}
      shadowSize="md"
      rounded="rounded-md"
      paddingX={2}
    />
  );
}

// Simple MetricFilter with just toolbar and selection
export default function MetricFilter({ onRegister, resetNonce, query }) {
  const [selectedMetrics, setSelectedMetrics] = useState([]);

  // Register Apply: commit selected metrics
  useEffect(() => {
    if (!onRegister) return;
    onRegister(() => ({
      type: 'metric',
      config: {
        metric: selectedMetrics
      },
      isValid: selectedMetrics.length > 0
    }));
  }, [onRegister, selectedMetrics]);

  // Sync with external query changes (like from reset)
  useEffect(() => {
    if (query?.metric) {
      setSelectedMetrics(query.metric);
    }
  }, [query?.metric, resetNonce]);

  const handleMetricChange = (state) => {
    if (state?.selectedMetrics !== undefined) {
      setSelectedMetrics(Array.isArray(state.selectedMetrics) ? state.selectedMetrics : []);
    }

    if (state?.toggleMetric) {
      const { metricId, isSelected } = state.toggleMetric;
      setSelectedMetrics(prev => {
        if (isSelected && !prev.includes(metricId)) {
          return [...prev, metricId];
        } else if (!isSelected) {
          return prev.filter(id => id !== metricId);
        }
        return prev;
      });
    }
  };

  const handleClear = () => {
    setSelectedMetrics([]);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <Toolbar
        leftContent={
          <div className="flex items-center gap-1">
            <button className="p-1 rounded transition-colors text-gray-600 hover:bg-gray-100 flex flex-col items-center w-8">
              <IconBriefcaseFilled size={16} stroke={1.75} />
              <span className="text-[10px] leading-none">Metric</span>
            </button>
            <div className="w-[2px] h-8 bg-gray-200 ml-1"></div>
          </div>
        }
        centerContent={
          <span className="text-xs text-gray-600">
            {selectedMetrics.length > 0 
              ? `${selectedMetrics.length} metric${selectedMetrics.length !== 1 ? 's' : ''} selected`
              : 'No metrics selected'
            }
          </span>
        }
        rightContent={
          <button 
            className="p-1 rounded hover:bg-gray-100 text-gray-600" 
            title="Clear metrics"
            onClick={handleClear}
          >
            <IconTrash size={18} />
          </button>
        }
        height="9"
        borderWidth={0}
        shadowSize="md"
        rounded="rounded-md"
        paddingX={2}
      />
      
      {/* Direct metric selection */}
      <MetricSelection
        draft={{ selectedMetrics }}
        query={query}
        onPanelStateChange={handleMetricChange}
      />
    </div>
  );
}