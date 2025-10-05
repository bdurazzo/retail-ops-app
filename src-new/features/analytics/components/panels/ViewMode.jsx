import React, { useState } from 'react';
import ControlPanel from '../../../../components/ControlPanel';
import PanelView from './PanelView.jsx';
import {
  IconShirtFilled,
  IconBriefcaseFilled,
  IconClockFilled,
  IconTemperaturePlusFilled,
  IconChartDots2Filled,
  IconLayoutSidebar,
  IconLayoutGrid
} from '@tabler/icons-react';

export default function ViewMode({
  activeTab,
  panelState,
  onPanelCommand,
  onPanelStateChange,
  isOpen,
  onToggleMenu,
  onToolbarApply,
  onToolbarReset,
  setActiveTab,
  onViewModeChange, // New callback to inform parent of view mode changes
  panelViewToolbar, // Toolbar content to show in panel view mode
}) {
  // View mode state: 'full' or 'panel'
  const [viewMode, setViewMode] = useState('full');

  // Notify parent when view mode changes
  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    onViewModeChange?.(newMode);
  };

  const handleCommand = (cmd) => {
    // Restore: only FilterPanel tab clicks control the dropdown open/close.
    // The center controls simply forward commands to the active panel.
    // Provide an optimistic hint so the Product panel doesn't flash/freeze waiting on round-trip state
    if (activeTab === 'TAB 1' && cmd && cmd.type === 'showSection' && cmd.section) {
      onPanelStateChange?.({ productActiveSection: cmd.section });
    }
    onPanelCommand?.(cmd);
  };

  const handleTabClick = (tabId) => {
    // Disable dropdown behavior when in panel view mode
    if (viewMode === 'panel') {
      // Just set active tab for visual state, no dropdown
      setActiveTab?.(tabId);
      return;
    }

    // Full view mode: normal dropdown behavior
    if (activeTab === tabId) {
      // Close if same tab clicked
      setActiveTab?.(null);
      onToggleMenu?.();
    } else {
      // Open new tab
      setActiveTab?.(tabId);
      if (!isOpen) {
        onToggleMenu?.();
      }
    }
  };

  const handleViewModeClick = (mode) => {
    if (mode === 'panel') {
      // Panel view: set activeTab to 'panel' and open dropdown
      setActiveTab?.('panel');
      if (!isOpen) {
        onToggleMenu?.();
      }
    } else if (mode === 'full') {
      // Full view: close dropdown and clear activeTab
      setActiveTab?.(null);
      if (isOpen) {
        onToggleMenu?.();
      }
    }
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  // View mode toggle buttons - use handleViewModeClick instead of handleViewModeChange
  const viewModeButtons = [
    { 
      id: 'full', 
      icon: <IconLayoutGrid size={20} />, 
      title: 'Full View'
    },
    { 
      id: 'panel', 
      icon: <IconLayoutSidebar size={20} />, 
      title: 'Panel View'
    }
  ];

  // Filter buttons for center
  const filterButtons = [
    { id: 'TAB 1', icon: <IconShirtFilled size={20} stroke={1.75} />, title: 'Product' },
    { id: 'TAB 2', icon: <IconBriefcaseFilled size={20} stroke={1.75} />, title: 'Metric' },
    { id: 'TAB 3', icon: <IconClockFilled size={20} stroke={1.75} />, title: 'Time' },
    { id: 'TAB 4', icon: <IconTemperaturePlusFilled size={20} stroke={1.75} />, title: 'Element' },
    { id: 'TAB 5', icon: <IconChartDots2Filled size={20} stroke={1.75} />, title: 'Trend' }
  ];

  const centerControls = (
    <div className="flex gap-2 items-center">
      {filterButtons.map(button => (
        <button
          key={button.id}
          className={`flex items-center justify-center px-1 py-1 text-xs rounded ${activeTab === button.id ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          onClick={() => handleTabClick(button.id)}
          title={button.title}
        >
          {button.icon}
        </button>
      ))}
    </div>
  );

  // Choose center content based on view mode
  const activeCenterControls = viewMode === 'full' ? centerControls : panelViewToolbar;

  return (
    <div className="relative px-4 p-1" data-ignore-outside="true">
      <ControlPanel 
        centerControls={activeCenterControls}
        rightButtons={viewModeButtons}
        activeMenu={viewMode}
        onMenuToggle={handleViewModeClick}
        showCenterControls={!!activeCenterControls}
      />
    </div>
  );

}

