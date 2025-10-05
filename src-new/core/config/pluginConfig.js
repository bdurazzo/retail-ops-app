// Plugin system configuration
// Defines plugin types, data contracts, and compatibility rules

/**
 * Plugin data type contracts
 * Defines what types of data can flow between Send and Insert plugins
 */
export const PLUGIN_DATA_TYPES = {
  TABLE_DATA: 'table_data',           // Table rows, columns, totals
  PRODUCT_SELECTION: 'product_selection', // Selected product names/IDs  
  KPI_METRICS: 'kpi_metrics',         // Calculated KPI values
  FILTER_CRITERIA: 'filter_criteria', // Search/filter parameters
  COMPARISON_SET: 'comparison_set',   // Products marked for comparison
  AGGREGATE_DATA: 'aggregate_data'    // Summarized/rolled-up data
};

/**
 * Plugin categories for organization
 */
export const PLUGIN_CATEGORIES = {
  DATA_FLOW: 'data_flow',       // Compare, Select, Filter
  PROCESSING: 'processing',     // Compile, Aggregate, Transform  
  ANALYSIS: 'analysis',         // Compute, Calculate, Analyze
  OUTPUT: 'output'              // Export, Display, Report
};

/**
 * Default plugin definitions
 * These are built-in plugins available to all users
 */
export const DEFAULT_PLUGINS = {
  // SEND plugins (data sources)
  SENDS: {
    compile: {
      id: 'compile',
      name: 'Compile',
      category: PLUGIN_CATEGORIES.PROCESSING,
      description: 'Send compiled/aggregated data',
      outputType: PLUGIN_DATA_TYPES.TABLE_DATA,
      icon: 'IconStack',
      color: 'orange'
    },
    select: {
      id: 'select',
      name: 'Select',
      category: PLUGIN_CATEGORIES.DATA_FLOW,
      description: 'Send current product selection',
      outputType: PLUGIN_DATA_TYPES.PRODUCT_SELECTION,
      icon: 'IconCheck',
      color: 'green'
    },
    export_data: {
      id: 'export_data',
      name: 'Export',
      category: PLUGIN_CATEGORIES.DATA_FLOW,
      description: 'Send table data for export',
      outputType: PLUGIN_DATA_TYPES.TABLE_DATA,
      icon: 'IconDownload',
      color: 'purple'
    }
  },

  // INSERT plugins (data receivers)
  INSERTS: {
    compare: {
      id: 'compare',
      name: 'Compare',
      category: PLUGIN_CATEGORIES.DATA_FLOW,
      description: 'Receive and compare data from multiple sources',
      acceptedTypes: [
        PLUGIN_DATA_TYPES.PRODUCT_SELECTION,
        PLUGIN_DATA_TYPES.TABLE_DATA
      ],
      outputType: PLUGIN_DATA_TYPES.COMPARISON_SET,
      icon: 'IconGitCompare',
      color: 'blue'
    },
    compute: {
      id: 'compute',
      name: 'Compute',
      category: PLUGIN_CATEGORIES.ANALYSIS,
      description: 'Perform KPI calculations on received data',
      acceptedTypes: [
        PLUGIN_DATA_TYPES.TABLE_DATA,
        PLUGIN_DATA_TYPES.AGGREGATE_DATA
      ],
      outputType: PLUGIN_DATA_TYPES.KPI_METRICS,
      icon: 'IconCalculator',
      color: 'indigo'
    },
    display: {
      id: 'display',
      name: 'Display',
      category: PLUGIN_CATEGORIES.OUTPUT,
      description: 'Display received data in table format',
      acceptedTypes: [
        PLUGIN_DATA_TYPES.TABLE_DATA,
        PLUGIN_DATA_TYPES.KPI_METRICS,
        PLUGIN_DATA_TYPES.COMPARISON_SET
      ],
      icon: 'IconTable',
      color: 'gray'
    }
  }
};

/**
 * Plugin compatibility matrix
 * Defines which plugin types can connect to each other
 */
export const PLUGIN_COMPATIBILITY = {
  [PLUGIN_DATA_TYPES.COMPARISON_SET]: [
    DEFAULT_PLUGINS.INSERTS.compute.id,
    DEFAULT_PLUGINS.INSERTS.display.id
  ],
  [PLUGIN_DATA_TYPES.PRODUCT_SELECTION]: [
    DEFAULT_PLUGINS.INSERTS.compare.id,
    DEFAULT_PLUGINS.INSERTS.compute.id
  ],
  [PLUGIN_DATA_TYPES.TABLE_DATA]: [
    DEFAULT_PLUGINS.INSERTS.compute.id,
    DEFAULT_PLUGINS.SENDS.compile.id,
    DEFAULT_PLUGINS.INSERTS.display.id
  ],
  [PLUGIN_DATA_TYPES.KPI_METRICS]: [
    DEFAULT_PLUGINS.INSERTS.display.id
  ]
};

/**
 * Check if a send plugin can connect to an insert plugin
 */
export function isPluginCompatible(sendPlugin, insertPlugin) {
  if (!sendPlugin?.outputType || !insertPlugin?.acceptedTypes) {
    return false;
  }
  
  return insertPlugin.acceptedTypes.includes(sendPlugin.outputType);
}

/**
 * Get all compatible insert plugins for a given send plugin
 */
export function getCompatibleInserts(sendPlugin) {
  if (!sendPlugin?.outputType) return [];
  
  return Object.values(DEFAULT_PLUGINS.INSERTS).filter(insert => 
    isPluginCompatible(sendPlugin, insert)
  );
}

/**
 * Get all compatible send plugins for a given insert plugin  
 */
export function getCompatibleSends(insertPlugin) {
  if (!insertPlugin?.acceptedTypes) return [];
  
  return Object.values(DEFAULT_PLUGINS.SENDS).filter(send =>
    isPluginCompatible(send, insertPlugin)
  );
}

/**
 * Plugin state management
 */
export const PLUGIN_STATES = {
  INACTIVE: 'inactive',     // Plugin not engaged
  READY: 'ready',          // Plugin ready to send/receive
  ACTIVE: 'active',        // Plugin currently processing
  CONNECTED: 'connected',   // Plugin connected to another plugin
  ERROR: 'error'           // Plugin in error state
};

/**
 * Default plugin configuration for UI components
 */
export const PLUGIN_UI_CONFIG = {
  dragThreshold: 5,         // Pixels to start drag
  hoverDelay: 200,         // MS to show compatibility feedback
  connectionTimeout: 5000,  // MS for plugin connections to timeout
  maxConnections: 5,       // Max connections per plugin
  animationDuration: 200   // MS for UI animations
};