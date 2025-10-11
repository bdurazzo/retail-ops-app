import React, { useEffect, useState } from 'react';
import { IconLayoutGrid, IconChartBar, IconSettings, IconTemplate } from '@tabler/icons-react';

export default function MetricControls({ panelState = {}, onCommand }) {
  const [activeSection, setActiveSection] = useState(() => panelState?.metricActiveSection || 'overview');

  const showSection = (section) => {
    // Deterministic: always show the requested section (no toggle-to-overview)
    if (activeSection !== section) setActiveSection(section);
    onCommand?.({ type: 'showSection', section, __ts: Date.now() });
  };

  // Keep toolbar highlighting in sync with panel's reported section
  useEffect(() => {
    if (panelState?.metricActiveSection && panelState.metricActiveSection !== activeSection) {
      setActiveSection(panelState.metricActiveSection);
    }
  }, [panelState?.metricActiveSection]);

  return (
    <div className="flex items-center gap-5 w-full">
      {/* Left buttons: section selectors */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => showSection('overview')}
          className={`p-1 rounded transition-all ${activeSection === 'overview' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          title="Overview"
        >
          <IconLayoutGrid size={20} />
        </button>
        <button
          onClick={() => showSection('selection')}
          className={`p-1 rounded transition-all ${activeSection === 'selection' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          title="Select Metrics"
        >
          <IconChartBar size={20} />
        </button>
        <button
          onClick={() => showSection('templates')}
          className={`p-1 rounded transition-all ${activeSection === 'templates' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          title="Metric Templates"
        >
          <IconTemplate size={20} />
        </button>
        <button
          onClick={() => showSection('settings')}
          className={`p-1 rounded transition-all ${activeSection === 'settings' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          title="Metric Settings"
        >
          <IconSettings size={20} />
        </button>
      </div>

      {/* Center: contextual display */}
      <div className="flex-1 flex items-center gap-2">
        <div className="text-xs text-gray-500">
          {getStatusText(activeSection, panelState)}
        </div>
      </div>

      {/* Right: reserved for future settings/export */}
      <div className="flex items-center gap-1" />
    </div>
  );
}

function getStatusText(activeSection, panelState) {
  const selectedCount = panelState?.draft?.selectedMetrics?.length || 0;
  
  switch (activeSection) {
    case 'overview':
      return selectedCount > 0 
        ? `${selectedCount} metric${selectedCount !== 1 ? 's' : ''} selected`
        : 'No metrics selected';
    case 'selection':
      return 'Choose metrics to calculate';
    case 'templates':
      return 'Pre-configured metric sets';
    case 'settings':
      return 'Calculation preferences';
    default:
      return '';
  }
}