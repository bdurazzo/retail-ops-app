import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock KPIs - will be replaced with actual KPIs from the architecture
const AVAILABLE_KPIS = {
  totalRevenue: 'Total Revenue',
  quantitySold: 'Quantity Sold',
  averageOrderValue: 'Avg Order Value',
  orderVelocity: 'Order Velocity',
  attachRate: 'Attach Rate'
};

// Mock options for dropdowns
const APPLY_TO_OPTIONS = ['All', 'Products', 'Category', 'Color', 'Size', 'Store'];
const FILTER_OPTIONS = ['None', 'Exclude Returns', 'Exclude Cancelled', 'Active Only', 'This Month', 'Top 10%'];

const KpiMenu = ({ value = [], onChange, onRegister, resetNonce }) => {
  const [configuredKpis, setConfiguredKpis] = useState([]);
  
  // Register the apply function with Menu.jsx
  useEffect(() => {
    if (onRegister) {
      onRegister(() => {
        const kpiNames = configuredKpis.map(k => k.kpiName);
        return kpiNames;
      });
    }
  }, [configuredKpis, onRegister]);

  // Handle reset from Menu.jsx
  useEffect(() => {
    if (resetNonce > 0) {
      setConfiguredKpis([]);
      onChange?.([]);
    }
  }, [resetNonce, onChange]);

  // Initialize from props value
  useEffect(() => {
    if (value && value.length > 0 && configuredKpis.length === 0) {
      const configured = value.map((kpiName, index) => ({
        id: `${kpiName}_${Date.now()}_${index}`,
        kpiName,
        applyTo: 'All',
        filter: 'None',
        combineWith: null
      }));
      setConfiguredKpis(configured);
    }
  }, [value]);

  const handleAddKpi = (e) => {
    const selectedKpi = e.target.value;
    
    if (!selectedKpi || selectedKpi === '' || configuredKpis.some(k => k.kpiName === selectedKpi)) {
      return;
    }
    
    const newKpiConfig = {
      id: `${selectedKpi}_${Date.now()}`,
      kpiName: selectedKpi,
      applyTo: 'All',
      filter: 'None',
      combineWith: null
    };
    
    setConfiguredKpis([...configuredKpis, newKpiConfig]);
    e.target.value = '';
    
    const kpiNames = [...configuredKpis, newKpiConfig].map(k => k.kpiName);
    onChange?.(kpiNames);
  };

  const handleRemoveKpi = (kpiId) => {
    const updated = configuredKpis.filter(k => k.id !== kpiId);
    setConfiguredKpis(updated);
    
    const kpiNames = updated.map(k => k.kpiName);
    onChange?.(kpiNames);
  };

  const handleUpdateKpi = (kpiId, field, value) => {
    setConfiguredKpis(configuredKpis.map(k => 
      k.id === kpiId ? { ...k, [field]: value } : k
    ));
  };

  const getCombineOptions = (currentKpiId) => {
    return configuredKpis.filter(k => k.id !== currentKpiId);
  };

  return (
    <div className="w-full">
      {/* KPI Selector */}
      <select
        onChange={handleAddKpi}
        defaultValue=""
        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-900 
                   cursor-pointer outline-none
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                   hover:border-gray-300"
      >
        <option value="">Add KPI...</option>
        {Object.entries(AVAILABLE_KPIS).map(([key, label]) => (
          <option 
            key={key} 
            value={key}
            disabled={configuredKpis.some(k => k.kpiName === key)}
          >
            {label} {configuredKpis.some(k => k.kpiName === key) ? '✓' : ''}
          </option>
        ))}
      </select>

      {/* Configured KPIs with animation */}
      <div className="mt-3 space-y-3">
        <AnimatePresence mode="sync">
          {configuredKpis.map((kpi) => (
            <motion.div
              key={kpi.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.1, ease: "easeInOut" },
                opacity: { duration: 0.1 }
              }}
              style={{ overflow: "hidden" }}
            >
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                {/* KPI Header */}
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-sm text-gray-900">
                    {AVAILABLE_KPIS[kpi.kpiName]}
                  </span>
                  <button
                    onClick={() => handleRemoveKpi(kpi.id)}
                    className="w-6 h-6 rounded-full bg-red-50 text-red-600 text-sm
                             flex items-center justify-center cursor-pointer
                             hover:bg-red-600 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                {/* Configuration Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Apply To */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Apply to
                    </label>
                    <select
                      value={kpi.applyTo}
                      onChange={(e) => handleUpdateKpi(kpi.id, 'applyTo', e.target.value)}
                      className="px-2 py-1.5 rounded-md border border-gray-200 text-xs bg-white text-gray-700
                               cursor-pointer outline-none
                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    >
                      {APPLY_TO_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  {/* Add Filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Add Filter
                    </label>
                    <select
                      value={kpi.filter}
                      onChange={(e) => handleUpdateKpi(kpi.id, 'filter', e.target.value)}
                      className="px-2 py-1.5 rounded-md border border-gray-200 text-xs bg-white text-gray-700
                               cursor-pointer outline-none
                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    >
                      {FILTER_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  {/* Combine With */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Combine with
                    </label>
                    <select
                      value={kpi.combineWith || ''}
                      onChange={(e) => handleUpdateKpi(kpi.id, 'combineWith', e.target.value || null)}
                      className="px-2 py-1.5 rounded-md border border-gray-200 text-xs bg-white text-gray-700
                               cursor-pointer outline-none
                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    >
                      <option value="">None</option>
                      {getCombineOptions(kpi.id).map(otherKpi => (
                        <option key={otherKpi.id} value={otherKpi.id}>
                          {AVAILABLE_KPIS[otherKpi.kpiName]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KpiMenu;