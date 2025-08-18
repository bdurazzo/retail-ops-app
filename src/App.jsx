import React, { useState } from 'react';
import StoreDashboard  from './pages/StoreDashboard';
import { InventoryLookup } from './pages/InventoryLookup';
import { Merchandising } from './pages/Merchandising';
import { AssistantPanel } from './pages/AssistantPanel';
import Analytics from "./pages/Analytics"

import {
  Gauge,
  Search,
  Shirt,
  BotMessageSquare,
  BarChart3
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('Sales');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Store':
        return <StoreDashboard />;
      case 'Inventory':
        return <InventoryLookup />;
      case 'Merch':
        return <Merchandising />;
      case 'Assistant':
        return <AssistantPanel />;
      case 'Analytics':
        return <Analytics />;
      default:
        return <StoreDashboard />;
    }
  };

  const iconMap = {
    Store: <Gauge size={20} />,
    Inventory: <Search size={20} />,
    Merch: <Shirt size={20} />,
    Assistant: <BotMessageSquare size={20} />,
    Analytics: <BarChart3 size={20} />
  };

  return (
    <div className="flex justify-center bg-gray-50 h-screen">
      <div className="w-[390px] h-[844px] flex flex-col bg-white shadow-md overflow-hidden">
        {/* 🔝 Header */}
        <div className="h-[60px] flex items-center justify-center border-b border-gray-200 text-lg font-semibold">
          Retail Ops App
        </div>

        {/* 📄 Main Screen */}
        <div className="h-[728px] overflow-y-auto">
          {renderScreen()}
        </div>

        {/* 🧭 Bottom Tab Bar */}
        <div className="h-[56px] border-t border-gray-200 flex justify-around items-center">
          {['Store', 'Inventory', 'Merch', 'Analytics', 'Assistant'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center gap-1 text-xs ${
                activeTab === tab ? 'text-black font-semibold' : 'text-gray-500'
              }`}
            >
              {iconMap[tab]}
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
