import React from 'react';
import Toolbar from '../../../../components/Toolbar';
import { IconMenu2, IconSettings } from '@tabler/icons-react';
import TimeControls from '../filters/time/TimeControls.jsx';
import ProductControls from '../filters/product/ProductControls.jsx';
import MetricControls from '../filters/metric/MetricControls.jsx';

export default function ControlPanel({
  activeTab,
  panelState,
  onPanelCommand,
  onPanelStateChange,
  isOpen,
  onToggleMenu,
  onToolbarApply,
  onToolbarReset,
}) {

  const leftContent = (
    <button
      className="ml-4 rounded text-gray-600 hover:bg-gray-100"
      onClick={() => onToggleMenu?.()}
      aria-label="Toggle filter menu"
      title="Filters"
    >
      <IconMenu2 size={18} />
    </button>
  );

  const handleCommand = (cmd) => {
    // Restore: only FilterPanel tab clicks control the dropdown open/close.
    // The center controls simply forward commands to the active panel.
    // Provide an optimistic hint so the Product panel doesn't flash/freeze waiting on round-trip state
    if (activeTab === 'TAB 1' && cmd && cmd.type === 'showSection' && cmd.section) {
      onPanelStateChange?.({ productActiveSection: cmd.section });
    }
    onPanelCommand?.(cmd);
  };

  const centerContent = (
    <div className="flex justify-items-center p-1">
      {activeTab === 'TAB 1' ? (
        <ProductControls panelState={panelState} onCommand={handleCommand} />
      ) : activeTab === 'TAB 2' ? (
        <MetricControls panelState={panelState} onCommand={handleCommand} />
      ) : activeTab === 'TAB 3' ? (
        <TimeControls panelState={panelState} onCommand={handleCommand} />
      ) : (
        <div className="text-center">
          <span className="text-sm text-gray-500">Select a filter</span>
        </div>
      )}
    </div>
  );

  const rightContent = (
    <div className="flex items-center gap-1 px-1" data-ignore-outside="true">
      <button
        className="text-xs text-gray-600 hover:bg-gray-100 rounded px-1 py-1"
        onClick={() => onToolbarReset?.()}
        title="Reset"
      >
        Reset
      </button>
      <button
        className="text-xs bg-gray-900 text-white px-1 py-1 rounded hover:bg-gray-800"
        onClick={() => onToolbarApply?.()}
        title="Apply"
      >
        Apply
      </button>
    </div>
  );

  return (
    <div className="relative" data-ignore-outside="true">
      <Toolbar 
        leftContent={leftContent}
        centerContent={centerContent}
        centerJustify="start"
        rightContent={rightContent}
      />
      {/* Inline host removed; dropdown remains the rendering surface */}
    </div>
  );
}
