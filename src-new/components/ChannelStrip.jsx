/**
 * ChannelStrip
 *
 * Universal cell component - the chassis for all table cells.
 * Provides mini toolbar, drop zone, and visual feedback.
 * Section-specific behavior controlled by Ch*.jsx wrappers.
 */

import React, { useState } from 'react';
import Toolbar from './Toolbar.jsx';
import { IconFilter, IconSettings, IconPlus, IconTableFilled } from '@tabler/icons-react';

export default function ChannelStrip({
  section,
  rowId,
  columnKey,
  allowedFilters = [],
  pluginData = null,
  onUpdate = () => {},
  tableContext,
  children,
  noPadding = false, // Remove parent cell padding
  alwaysShowToolbar = false, // Keep toolbar visible without hover
  disableHover = false, // Disable toolbar hover entirely
  toolbarBackgroundColor = null,
  toolbarLeftContent = null,
  toolbarCenterContent = null,
  toolbarRightContent = null
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(alwaysShowToolbar && !disableHover);
  const [showToolbar, setShowToolbar] = useState(alwaysShowToolbar && !disableHover);
  const hoverTimeoutRef = React.useRef(null);
  const leaveTimeoutRef = React.useRef(null);

  const handleMouseEnterTrigger = () => {
    if (alwaysShowToolbar || disableHover) return;

    // Clear any pending leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    // Set hover state and delay showing toolbar
    setIsHovered(true);
    hoverTimeoutRef.current = setTimeout(() => {
      setShowToolbar(true);
    }, 500); // 200ms delay before fade in
  };

  const handleMouseLeaveToolbar = () => {
    if (alwaysShowToolbar) return;

    // Clear any pending hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Start fade out by hiding toolbar
    setShowToolbar(false);

    // Remove from DOM after fade animation completes
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300); // Wait for 300ms fade out animation to complete
  };

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const data = e.dataTransfer.getData('text/plain');
      const droppedPlugin = JSON.parse(data);

      // Check if this filter type is allowed in this section
      if (allowedFilters.length > 0 && !allowedFilters.includes(droppedPlugin.type)) {
        console.warn(`Filter type "${droppedPlugin.type}" not allowed in section ${section}`);
        return;
      }

      onUpdate(droppedPlugin);
    } catch (err) {
      console.error('Failed to parse dropped plugin:', err);
    }
  };

  // Visual styling based on state
  const baseClasses = "w-full h-full flex items-center justify-center transition-all relative";
  const dragOverClasses = isDragOver ? "bg-blue-100 border-2 border-blue-400" : "";
  const hasPluginClasses = pluginData ? "bg-green-50" : "";
  const paddingClasses = noPadding ? "px-0 -my-0" : ""; // Cancel parent px-3 padding

  return (
    <div
      className={`${baseClasses} ${dragOverClasses} ${hasPluginClasses} ${paddingClasses}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {/* Hover trigger area - small zone at top of cell */}
      <div
        className="absolute left-0 top-0 right-0 h-5 z-40"
        onMouseEnter={handleMouseEnterTrigger}
      />

      {/* Hover Toolbar */}
      {isHovered && (
        <div
          className={`absolute left-0 right-0 top-0 h-full w-full z-50 pointer-events-auto transition-opacity duration-300 ${
            showToolbar ? 'opacity-100' : 'opacity-0'
          }`}
          onMouseLeave={handleMouseLeaveToolbar}
        >
          <Toolbar
            height={0}
            borderWidth={1}
            shadowSize={0}
            paddingX={0}
            backgroundColor={toolbarBackgroundColor || ("bg-transparant")}
            className="w-full h-full"

            leftContent={
              toolbarLeftContent || (
                <div className="absolute top-0 left-0 bg-transparant"></div>)
            }
            centerContent={
              toolbarCenterContent || (
                <div className="absolute top-0 right-0 gap-1"></div>)
            }
            rightContent={
              toolbarRightContent || (
                <div className="absolute top-0 right-0"></div>)
            }
          />
        </div>
      )}
    </div>
  );
}
