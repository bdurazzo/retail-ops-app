import React, { useState } from 'react';
import { Discovery } from './pages/Discovery';
import { Synthesis } from './pages/Synthesis';
import { Toolbox } from './pages/Toolbox';
import Assistant  from './pages/Assistant';
import Analytics from './pages/Analytics';

// ✅ Tabler Icons — install if needed: npm i @tabler/icons-react
import {
  IconFlask,
  IconRobot,
  IconBinoculars,
  IconTool,
  IconDeviceDesktopAnalytics, // ADD THIS FOR TEST TAB
} from '@tabler/icons-react';

export default function App() {
  // Start on a tab that actually exists in the bottom bar
  const [activeTab, setActiveTab] = useState('Discovery');

  // Map tab -> screen component
  const renderScreen = () => {
    switch (activeTab) {
      case 'Discovery':
        return <Discovery />;
      case 'Synthesis':
        return <Synthesis />;
      case 'Toolbox':
        return <Toolbox />;
      case 'Assistant':
        return <Assistant />;
      case 'Analytics':
        return <Analytics />;
      default:
        return <Discovery />;
    }
  };

  // Map tab -> Tabler icon component
  const ICONS = {
    Discovery: IconBinoculars,
    Synthesis: IconFlask,
    Toolbox: IconTool,
    Assistant: IconRobot,
    Analytics: IconDeviceDesktopAnalytics,
    Test: IconFlask, // ADD THIS
  };

  const TABS = ['Discovery', 'Synthesis', 'Toolbox', 'Analytics', 'Assistant']; 

  return (
    <div className="flex justify-center bg-gray-50 h-screen">
      <div className="w-[390px] h-[844px] flex flex-col bg-white shadow-md overflow-hidden">
        {/* 🔝 Header */}
        <div className="h-[50px] flex items-center justify-center border-b border-gray-200 text-lg font-semibold">
          Filson Portland
        </div>

        {/* 📄 Main Screen */}
        <div className="h-[738px] overflow-y-auto">
          {/* 🛠️ Tool Bar */}
          <div className="h-[50px] bg-gray-50 mt-2 rounded mx-4"></div>
          {renderScreen()}</div>

        {/* 🧭 Bottom Tab Bar */}
        <div className="h-[55px] rounded mx-4 mb-4 rounded-lg bg-gradient-to-b shadow-lg from-gray-50 via-white to-gray-50 flex justify-center items-center">
          {TABS.map((tab) => {
            const IconComp = ICONS[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-col w-[100px] h-[45px] px-1 flex items-center justify-center text-xs ${
                  isActive ? 'flex text-white font-semibold bg-gray-900 rounded-lg shadow-lg' : 'text-gray-700'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {IconComp ? (
                  <IconComp
                    size={22}
                    stroke={1.75}
                    className={isActive ? 'text-white  bg-gray-800 rounded' : 'text-gray-800 rounded'}
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