/**
 * Drag and Drop Type Registry
 *
 * Centralized constants and schemas for all drag/drop operations
 * across the application.
 */

export const DRAG_TYPES = {
  PRODUCT: 'product',
  VIEW_MODE: 'view-mode',
  FILTER: 'filter',        // Future: drag filters
  COLUMN: 'column',        // Future: reorder columns
  ROW: 'row',              // Future: reorder rows

  // Assignment types (module/table)
  COLUMN_ASSIGNMENT: 'column-assignment',
  ROW_ASSIGNMENT: 'row-assignment',
  LABEL_ASSIGNMENT: 'label-assignment',
  BUTTON_ASSIGNMENT: 'button-assignment'
};

/**
 * Schema definitions for each drag type
 * Provides structure and defaults for drag data payloads
 */
export const dragDataSchemas = {
  [DRAG_TYPES.PRODUCT]: {
    type: DRAG_TYPES.PRODUCT,
    title: '',
    content: [],
    options: {}
  },

  [DRAG_TYPES.VIEW_MODE]: {
    type: DRAG_TYPES.VIEW_MODE,
    viewMode: '',
    label: ''
  },

  [DRAG_TYPES.FILTER]: {
    type: DRAG_TYPES.FILTER,
    filterType: '',
    filterValue: '',
    label: ''
  },

  [DRAG_TYPES.COLUMN]: {
    type: DRAG_TYPES.COLUMN,
    columnKey: '',
    columnIndex: -1
  },

  [DRAG_TYPES.ROW]: {
    type: DRAG_TYPES.ROW,
    rowId: '',
    rowIndex: -1
  },

  // Assignment schemas
  [DRAG_TYPES.COLUMN_ASSIGNMENT]: {
    type: DRAG_TYPES.COLUMN_ASSIGNMENT,
    id: '',
    columnKey: '',
    label: null,
    width: null,
    alignment: null,
    nestedAssignments: []
  },

  [DRAG_TYPES.ROW_ASSIGNMENT]: {
    type: DRAG_TYPES.ROW_ASSIGNMENT,
    id: '',
    dataSource: null,
    filter: null,
    plugin: null,
    nestedAssignments: []
  },

  [DRAG_TYPES.LABEL_ASSIGNMENT]: {
    type: DRAG_TYPES.LABEL_ASSIGNMENT,
    id: '',
    label: '',
    sourceField: null
  },

  [DRAG_TYPES.BUTTON_ASSIGNMENT]: {
    type: DRAG_TYPES.BUTTON_ASSIGNMENT,
    id: '',
    label: '',
    action: '',
    params: {},
    nestedAssignments: []
  }
};

/**
 * View mode mappings for header → view mode conversions
 */
export const VIEW_MODE_MAP = {
  'Color': 'by-color',
  'Size': 'by-size',
  'Variant': 'by-variant',
  'Summary': 'summary'
};
