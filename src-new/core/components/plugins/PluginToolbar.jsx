import React, { useState } from 'react';
import ControlPanel from '../../../components/ControlPanel.jsx';
import ProductPluginPanel from './panels/ProductPluginPanel.jsx';
import MetricPluginPanel from './panels/MetricPluginPanel.jsx';
import TimePluginPanel from './panels/TimePluginPanel.jsx';
import ElementPluginPanel from './panels/ElementPluginPanel.jsx';
import TrendPluginPanel from './panels/TrendPluginPanel.jsx';
import TablePluginPanel from './panels/TablePluginPanel.jsx';
import RowPluginPanel from './panels/RowPluginPanel.jsx';
import ColumnPluginPanel from './panels/ColumnPluginPanel.jsx';
import CellPluginPanel from './panels/CellPlugin.jsx';
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
  IconSquare
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
      icon: <IconPlug size={20} />,
      title: 'Out'
    },
    {
      id: 'insert',
      icon: <IconOutlet size={20} />,
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
    { id: 'TABLE', icon: <IconTable size={20} stroke={1.75} />, title: 'Table' },
    { id: 'ROW', icon: <IconRowInsertBottom size={20} stroke={1.75} />, title: 'Row' },
    { id: 'COLUMN', icon: <IconColumnInsertRight size={20} stroke={1.75} />, title: 'Column' },
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
    <div className="flex gap-2 items-center">
      {insertButtons.map(button => (
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

  const activeCenterControls = viewMode === 'send' ? centerControls : insertControls;

  const menuContents = {
    'PRODUCT': <ProductPluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'METRIC': <MetricPluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'TIME': <TimePluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'ELEMENT': <ElementPluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'TREND': <TrendPluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'TABLE': <TablePluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'ROW': <RowPluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
    'COLUMN': <ColumnPluginPanel onPanelStateChange={onPanelStateChange} panelCommand={onPanelCommand} />,
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
