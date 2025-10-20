import React, { useState } from 'react';
import ControlPanel from '../../../components/ControlPanel.jsx';
import ProductPluginPanel from './panels/ProductPluginPanel.jsx';
import MetricPluginPanel from './panels/MetricPluginPanel.jsx';
import TimePluginPanel from './panels/TimePluginPanel.jsx';
import ElementPluginPanel from './panels/ElementPluginPanel.jsx';
import TrendPluginPanel from './panels/TrendPluginPanel.jsx';
import PairAnalysisPluginPanel from './panels/PairAnalysisPluginPanel.jsx';
import TableXPanel from './panels/TableXPanel.jsx';
import TableYPanel from './panels/TableYPanel.jsx';
import TableZPanel from './panels/TableZPanel.jsx';
import CellPluginPanel from './panels/CellPluginPanel.jsx';
import {
  IconShirtFilled,
  IconBriefcaseFilled,
  IconClockFilled,
  IconTemperaturePlusFilled,
  IconChartDots2Filled,
  IconHandGrab,
  IconSettings,
  IconPlug,
  IconOutlet,
  IconTable,
  IconRowInsertBottom,
  IconColumnInsertRight,
  IconSquare,
  IconTableColumn,
  IconTableDashed,
  IconLayoutSidebarFilled,
  IconLayoutSidebarRightFilled,
  IconSquareFilled,
  IconLayoutNavbarFilled,
  IconLayoutBottombarFilled,
  IconCrop11Filled
} from '@tabler/icons-react';

export default function PluginToolbar({
  activeTab,
  panelState,
  onPanelCommand,
  onPanelStateChange,
  isOpen,
  onToggleMenu,
  setActiveTab,
  onViewModeChange,
  configureToolbar,
}) {
  const [viewMode, setViewMode] = useState('send');

  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    onViewModeChange?.(newMode);
  };

  const handleCommand = (cmd) => {
    onPanelCommand?.(cmd);
  };

  const handleTabClick = (tabId) => {
    if (viewMode === 'insert') {
      setActiveTab?.(tabId);
      return;
    }

    if (activeTab === tabId) {
      setActiveTab?.(null);
      onToggleMenu?.();
    } else {
      setActiveTab?.(tabId);
      if (!isOpen) {
        onToggleMenu?.();
      }
    }
  };

  const handleViewModeClick = (mode) => {
    if (mode === 'insert') {
      setActiveTab?.('insert');
      if (!isOpen) {
        onToggleMenu?.();
      }
    } else if (mode === 'send') {
      setActiveTab?.('send');
      if (isOpen) {
        onToggleMenu?.();
      }
    }
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  const viewModeButtons = [
    {
      id: 'send',
      icon: <IconPlug size={24} />,
      title: 'Out'
    },
    {
      id: 'insert',
      icon: <IconTableDashed size={24} />,
      title: 'In'
    }
  ];

  const pluginButtons = [
    { id: 'PRODUCT', icon: <IconShirtFilled size={20} stroke={1.75} />, title: 'Product' },
    { id: 'METRIC', icon: <IconBriefcaseFilled size={20} stroke={1.75} />, title: 'Metric' },
    { id: 'TIME', icon: <IconClockFilled size={20} stroke={1.75} />, title: 'Time' },
    { id: 'ELEMENT', icon: <IconTemperaturePlusFilled size={20} stroke={1.75} />, title: 'Element' },
    { id: 'TREND', icon: <IconChartDots2Filled size={20} stroke={1.75} />, title: 'Trend' }
  ];

  const insertButtons = [
    { id: 'PAIRS', icon: <IconTableDashed size={18} stroke={1.75} />, label: 'Pairs', title: 'Pair Analysis' },
    { id: 'TABLE_X', icon: <IconTableDashed size={18} stroke={1.75} />, label: 'Table X', title: 'Table X' },
    { id: 'TABLE_Y', icon: <IconTableDashed size={18} stroke={1.75} />, label: 'Table Y', title: 'Table Y' },
    { id: 'TABLE_Z', icon: <IconTableDashed size={18} stroke={1.75} />, label: 'Table Z', title: 'Table Z' },
    { id: 'CELL', icon: <IconSquare size={20} stroke={1.75} />, title: 'Cell' }
  ];

  const centerControls = (
    <div className="flex gap-2 items-center">
      {pluginButtons.map(button => (
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

  const insertControls = (
    <div className="flex gap-2 justify-center items-center">
      {insertButtons.map(button => (
        <button
          key={button.id}
          className={`flex items-center justify-center px-2 py-2 text-xs rounded ${activeTab === button.id ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          onClick={() => handleTabClick(button.id)}
          title={button.title}
        >
          
          <div className="flex flex-col items-center gap-1">
            {button.icon}
            {button.label}

          </div>


          
        </button>
      ))}
    </div>
  );

  const activeCenterControls = viewMode === 'send' ? centerControls : insertControls;

  const menuContents = {
    'PRODUCT': <ProductPluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'METRIC': <MetricPluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'TIME': <TimePluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'ELEMENT': <ElementPluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'TREND': <TrendPluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'PAIRS': <PairAnalysisPluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'TABLE_X': <TableXPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'TABLE_Y': <TableYPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'TABLE_Z': <TableZPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'CELL': <CellPluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />
  };

  return (
    <div className="relative" data-ignore-outside="true">
      <ControlPanel
        centerControls={activeCenterControls}
        leftButtons={viewModeButtons}
        rightButtons={[]}
        activeMenu={activeTab}
        menuContents={menuContents}
        onMenuToggle={handleViewModeClick}
        showCenterControls={!!activeCenterControls}
      />
    </div>
  );

}
