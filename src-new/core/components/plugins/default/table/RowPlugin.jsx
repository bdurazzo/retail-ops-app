/**
 * RowPlugin
 *
 * Logic hub for row-based plugins
 * Manages state, coordinates behavior, and renders Toolbar with ToolbarPlugin
 */

import React, { useState } from 'react';
import Toolbar from '../../../../../components/Toolbar.jsx';
import ToolbarPlugin from '../../ToolbarPlugin.jsx';
import { DEFAULT_LAYOUT } from '../../../custom/table/tableProps.js';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

/**
 * Check if row should use RowPlugin
 */
export function shouldApplyRowPlugin(row, cellState = {}) {
  const rowId = row?._rowId;
  if (!rowId) return false;

  return Object.keys(cellState).some(key => {
    return key.startsWith(`${rowId}_`) && cellState[key]?.type;
  });
}

/**
 * Get plugin data for this row
 */
export function getRowPluginData(row, cellState = {}) {
  const rowId = row?._rowId;
  if (!rowId) return null;

  const cellKey = Object.keys(cellState).find(key =>
    key.startsWith(`${rowId}_`)
  );

  return cellState[cellKey] || null;
}

/**
 * RowPlugin Component
 * Logic coordinator that manages configuration state and uses Toolbar + ToolbarPlugin
 */
export default function RowPlugin({
  title = 'Content',
  subtitle = '',
  isExpanded = false,
  onToggle = () => {},
  rowHeight = DEFAULT_LAYOUT.rowHeight,
  showToolbar = false,
  section = 'A2',
  tableContainerWidth = 0,
  onConfigChange = null,
  productData = [],
  tableOutput = null,
  children,
  ...props
}) {
  // Internal state for plugin configuration - update when productData changes
  const [config, setConfig] = useState({
    type: 'product',
    data: productData,
    tableOutput: tableOutput,
    metadata: {
      title,
      rowCount: productData.length
    }
  });

  // Update config when productData changes
  React.useEffect(() => {
    setConfig({
      type: 'product',
      data: productData,
      tableOutput: tableOutput,
      metadata: {
        title,
        rowCount: productData.length
      }
    });
  }, [productData, tableOutput, title]);

  const handlePluginData = (data) => {
    if (onConfigChange) {
      onConfigChange({
        action: 'plugin_data',
        data: data,
        config: config
      });
    }
  };

  const handlePluginConnect = (connection) => {
    if (onConfigChange) {
      onConfigChange({
        action: 'plugin_connect',
        connection: connection,
        config: config
      });
    }
  };

  // Build plugin context from product data
  const pluginContext = {
    productData: config.data,
    tableData: config.tableOutput,
    productName: config.metadata?.title,
    ...config.metadata
  };

  console.log('🔌 RowPlugin pluginContext:', {
    productDataCount: config.data?.length,
    tableDataRows: config.tableOutput?.rows?.length,
    productName: config.metadata?.title,
    section
  });

  return (
    <div className="relative border-b border-t w-full flex flex-col">
      {/* Single Toolbar with ToolbarPlugin in same container - A2 only */}
      {section === 'A2' && (
        <div
          className="flex"
          style={{
            width: tableContainerWidth,
            height: rowHeight,
            zIndex: 100
          }}
        >
          <Toolbar
            height={rowHeight}
            borderWidth={1}
            shadowSize=""
            paddingX={3}
            backgroundColor="bg-gradient-to-r from-gray-100 via-white to-gray-100"
            className="w-full cursor-pointer hover:bg-gray-300 rounded-none"
            leftContent={
              <div className="absolute h-6 w-6 shadow bg-gradient-to-t from-gray-100 via-gray-50 to-gray-200">
              <div onClick={onToggle} className="flex py-1 justify-center items-center">
                {isExpanded ? (
                  <IconChevronDown size={18} />
                ) : (
                  <IconChevronRight size={18} />
                )}
              </div>
              </div>
            }
            centerContent={
                <div className="flex-1 items-center px-9">
                <span className="text-[12px] text-gray-700 font-semibold"> {title}  </span>
                    </div>
            }
            rightContent={
              <div onClick={(e) => e.stopPropagation()}>
                <ToolbarPlugin
                  pluginContext={pluginContext}
                  onPluginData={handlePluginData}
                  onPluginConnect={handlePluginConnect}
                  enabledPlugins={{ send: true, insert: true }}
                />
              </div>
            }
          />
        </div>
      )}

      {/* B2 section: just a spacer since A2 has the full-width toolbar */}
      {section === 'B2' && (
        <div style={{ height: rowHeight }} className="bg-white" />
      )}

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}
