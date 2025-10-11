import React, { useState } from 'react';
import { Store } from './pages/Store';
import { Catalog } from './pages/Catalog';
import { Zones } from './pages/Zones';
import Assistant  from './pages/Assistant';
import Analytics from './pages/Analytics';

// ✅ Tabler Icons — install if needed: npm i @tabler/icons-react
import {
  IconGauge,
  IconSearch,
  IconHanger,
  IconRobot,
  IconChartBar,
  IconFlask, // ADD THIS FOR TEST TAB
} from '@tabler/icons-react';

export default function App() {
  // Start on a tab that actually exists in the bottom bar
  const [activeTab, setActiveTab] = useState('Store');

  // Map tab -> screen component
  const renderScreen = () => {
    switch (activeTab) {
      case 'Store':
        return <Store />;
      case 'Catalog':
        return <Catalog />;
      case 'Zones':
        return <Zones />;
      case 'Assistant':
        return <Assistant />;
      case 'Analytics':
        return <Analytics />;
      default:
        return <Store />;
    }
  };

  // Map tab -> Tabler icon component
  const ICONS = {
    Store: IconGauge,
    Catalog: IconSearch,
    Zones: IconHanger,
    Assistant: IconRobot,
    Analytics: IconChartBar,
    Test: IconFlask, // ADD THIS
  };

  const TABS = ['Store', 'Catalog', 'Zones', 'Analytics', 'Assistant']; 

  return (
    <div className="flex justify-center bg-gray-50 h-screen">
      <div className="w-[390px] h-[844px] flex flex-col bg-white shadow-md overflow-hidden">
        {/* 🔝 Header */}
        <div className="h-[50px] flex items-center justify-center border-b border-gray-200 text-lg font-semibold">
          Filson Portland
        </div>

        {/* 📄 Main Screen */}
        <div className="h-[738px] overflow-y-auto">{renderScreen()}</div>

        {/* 🧭 Bottom Tab Bar */}
        <div className="h-[56px] border-t border-gray-200 flex justify-around items-center">
          {TABS.map((tab) => {
            const IconComp = ICONS[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex flex-col items-center gap-1 text-xs ${
                  isActive ? 'text-black font-semibold' : 'text-gray-500'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {IconComp ? (
                  <IconComp
                    size={22}
                    stroke={1.75}
                    className={isActive ? 'text-black' : 'text-gray-700'}
                    aria-hidden="true"
                  />
                ) : null}
                <span>{tab}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}