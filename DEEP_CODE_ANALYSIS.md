# COMPREHENSIVE CODE ANALYSIS: src-new/core

**Analysis Date**: 2025-10-20
**Total Files**: 103 JavaScript/JSX files
**Total Lines**: ~6,500+ lines of code
**Architecture**: Modular table system with scroll-sync engine and multi-template support

---

## TABLE OF CONTENTS

1. [Core Table Architecture](#core-table-architecture)
2. [Custom Table System (A/B Split)](#custom-table-system-ab-split)
3. [Module Table System (Multi-table)](#module-table-system-multi-table)
4. [Channel Components](#channel-components)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Calculation System](#calculation-system)
7. [Configuration System](#configuration-system)
8. [Integration Map](#integration-map)
9. [Critical Systems](#critical-systems)
10. [Safe to Remove](#safe-to-remove)

---

## CORE TABLE ARCHITECTURE

### Overview
The system uses a **scroll synchronization engine** to manage complex table layouts where:
- **A sections** = Fixed columns (left side)
- **B sections** = Scrolling columns (right side)
- **1 sections** = Headers
- **2 sections** = Body rows
- **3 sections** = Footers

### Key Innovation: Transform-Based Scroll Sync
Instead of duplicating scrollbars, the system uses:
1. **B3** owns the physical scrollbar
2. **B1 and B2** use CSS transforms to mirror B3's scroll position
3. Wheel events on B1/B2 drive B3's scrollLeft
4. Result: Perfectly synchronized scrolling across all sections

---

## CUSTOM TABLE SYSTEM (A/B SPLIT)

### Directory: `components/custom/table/`

---

### File: **TableContainer.jsx**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/custom/table/TableContainer.jsx`
**Lines**: 273
**Purpose**: The orchestrator component for A/B split table architecture. This is THE CRITICAL SCROLL SYNC ENGINE.

#### **Imports**
```javascript
React, { useRef, useEffect, useMemo } from 'react'
```
- `useRef`: Creates refs for scroll synchronization
- `useEffect`: Manages scroll event listeners
- `useMemo`: Would be used for performance (not currently utilized)

#### **Props** (Lines 14-51)
All props are optional with defaults:

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `rows` | Array | `[]` | Data rows for the table |
| `totals` | Object | `{}` | Footer totals by column key |
| `columnKeys` | Array | `[]` | Array of column identifiers |
| `columnLabels` | Object | `{}` | Display labels for columns |
| `layout` | Object | `{}` | Dimension configuration |
| `styles` | Object | `{}` | Style classes for sections |
| `showHeader` | Boolean | `true` | Toggle header visibility |
| `showBody` | Boolean | `true` | Toggle body visibility |
| `showFooter` | Boolean | `true` | Toggle footer visibility |
| `containerClasses` | String | (default) | Outer container classes |
| `children` | Node | - | Child components (sections) |
| `maxBodyHeight` | Number | `null` | Optional fixed body height |
| `columnWidths` | Object | `{}` | Width overrides per column |
| `sortKey` | String | `null` | Currently sorted column |
| `sortDirection` | String | `null` | 'asc' or 'desc' |
| `onSort` | Function | `() => {}` | Sort handler |
| `onColumnSwap` | Function | `() => {}` | Column swap handler |

#### **Layout Object Structure** (Lines 52-60)
Extracted from `layout` prop with defaults:
```javascript
{
  firstColWidth: 120,      // Width of fixed column(s)
  metricColWidth: 80,      // Width of metric columns
  headerHeight: 35,        // Header row height
  rowHeight: 50,           // Body row height
  footerHeight: 35,        // Footer row height
  placeholderCols: 4       // Number of placeholder columns
}
```

#### **Refs for Scroll Synchronization** (Lines 61-67)
**CRITICAL FOR UX** - These refs enable the scroll sync magic:

| Ref | Purpose | Owns Scroll? |
|-----|---------|--------------|
| `containerRef` | Main container for width calculation | No |
| `vScrollRef` | Unified vertical scroller (A2+B2) | Yes - vertical |
| `hTopRef` | B1 horizontal container (overflow hidden) | No |
| `hBottomRef` | B3 horizontal container | **YES - horizontal** |
| `b1TrackRef` | B1 inner track (gets transformed) | No |
| `b2TrackRef` | B2 inner track (gets transformed) | No |

#### **State Variables** (Lines 69-84)
```javascript
const [containerWidth, setContainerWidth] = React.useState(0);
```
- **Purpose**: Tracks container width for responsive calculations
- **Updated by**: ResizeObserver on mount
- **Used by**: Passed to children via tableContext

#### **Functions**

**Function: `updateWidth`** (Lines 75-77)
- **Parameters**: None
- **Returns**: Nothing (side effect)
- **Purpose**: Updates containerWidth state from DOM
- **Called by**: ResizeObserver and initial mount

**Function: `syncTracks`** (Lines 96-101)
- **Parameters**: None
- **Returns**: Nothing (side effect)
- **Purpose**: THE HEART OF SCROLL SYNC - Mirrors B3's scrollLeft to B1 and B2 via transform
- **Algorithm**:
  1. Read `bottom.scrollLeft` (B3's scroll position)
  2. Round to avoid sub-pixel jank
  3. Create transform string: `translate3d(-Xpx, 0, 0)`
  4. Only update if changed (performance optimization)
  5. Apply to both b1Track and b2Track
- **Called by**: onBottomScroll, onHorizontalWheel
- **Critical**: Uses `translate3d` for GPU acceleration

**Function: `onBottomScroll`** (Lines 104)
- **Parameters**: None
- **Returns**: Nothing
- **Purpose**: Event handler for B3 scroll events
- **Called by**: Browser scroll event on B3

**Function: `onHorizontalWheel`** (Lines 107-113)
- **Parameters**: `e` (WheelEvent)
- **Returns**: Nothing
- **Purpose**: Allow horizontal wheel gestures on B1/B2 to drive B3
- **Algorithm**:
  1. Check if deltaX > deltaY (horizontal gesture)
  2. Prevent default to stop page scroll
  3. Update B3's scrollLeft
  4. Sync tracks immediately
- **Called by**: Wheel events on B1 and vScroll (B2)

#### **Effects**

**Effect: ResizeObserver** (Lines 72-84)
- **Dependencies**: `[]` (mount only)
- **Purpose**: Track container width changes
- **Setup**:
  1. Call updateWidth immediately
  2. Create ResizeObserver
  3. Observe containerRef
- **Cleanup**: Disconnect observer

**Effect: Scroll Synchronization** (Lines 86-131)
- **Dependencies**: `[]` (mount only)
- **Purpose**: THE CRITICAL SCROLL SYNC SYSTEM
- **Setup**:
  1. Get all required refs
  2. Attach scroll listener to B3 (passive: true)
  3. Attach wheel listener to B1 (passive: false - needs preventDefault)
  4. Attach wheel listener to vScroll (passive: false)
  5. Initial sync call
- **Cleanup**: Remove all listeners
- **Performance Notes**:
  - Passive scroll listeners for performance
  - Non-passive wheel listeners to enable preventDefault
  - Transform-based animation (GPU accelerated)

#### **Context Object** (Lines 134-177)
```javascript
const tableContext = {
  // Refs
  vScrollRef, hTopRef, hBottomRef, b1TrackRef, b2TrackRef,

  // Layout
  layout, firstColWidth, headerHeight, rowHeight, footerHeight, containerWidth,

  // Data
  rows, totals, columnKeys, columnLabels,

  // Styles
  styles,

  // Visibility
  showHeader, showBody, showFooter,

  // Options
  maxBodyHeight,

  // Handlers
  sortKey, sortDirection, onSort, onColumnSwap
}
```

**Passed to**: All children via React.cloneElement
**Usage**: Children destructure this to access shared state

#### **Exports** (Lines 179-273)
The file exports 5 components:

1. **TableContainer** (default export)
   - Main orchestrator
   - Manages refs and scroll sync
   - Passes context to children

2. **TableToolbar** (Lines 195-206)
   - Wrapper for toolbar content
   - Passes tableContext to children
   - Classes: `flex-none`

3. **TableHeader** (Lines 208-223)
   - Wrapper for header sections (A1 + B1)
   - Respects `showHeader` flag
   - Classes: `flex-none bg-gradient-to-b from-gray-50 via-gray-50 to-gray-100`

4. **TableBody** (Lines 225-256)
   - **CRITICAL**: Attaches vScrollRef for vertical scrolling
   - Handles maxBodyHeight prop for fixed height mode
   - Classes: Conditional - `flex-none` if maxBodyHeight, else `flex-1 min-h-0`
   - Contains the scrollable area with `scrollbarGutter: 'stable both-edges'`

5. **TableFooter** (Lines 258-273)
   - Wrapper for footer sections (A3 + B3)
   - Respects `showFooter` flag
   - Classes: `flex-none bg-gray-50`

#### **Integration Points**
```
TableContainer
  ← Imported by: CustomTableWorkspace, NestedTable
  → Renders: TableHeader, TableBody, TableFooter (via children)
  → Passes context to: All section components (A1, A2, A3, B1, B2, B3)
  ← Receives data from: Templates (via tableConfig.js)
```

#### **Data Flow**
```
Template (multivariableTable.js)
  ↓ returns tableProps
tableConfig.applyTemplate()
  ↓ normalizes to TableContainer format
CustomTableWorkspace
  ↓ passes props
TableContainer
  ↓ provides tableContext
Section Components (A1, A2, A3, B1, B2, B3)
  ↓ render cells
DOM
```

#### **Critical Code Sections**

**Scroll Sync Engine** (Lines 86-131)
This is the most important code in the entire table system. It enables:
- Smooth horizontal scrolling across 3 sections
- No scroll bars on B1/B2 (hidden via overflow)
- Single scroll bar on B3 drives everything
- Wheel events on any section work correctly

**Performance Considerations**:
- Uses `translate3d` instead of `scrollLeft` manipulation for B1/B2 (GPU accelerated)
- Rounds scroll values to avoid sub-pixel jank
- Only updates transform if value changed
- Passive listeners where possible

**Edge Cases Handled**:
- Checks all refs exist before attaching listeners
- Handles horizontal wheel on header (B1)
- Handles horizontal wheel on body (B2 via vScroll)
- Initial sync on mount

---

### File: **CustomTableWorkspace.jsx**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/custom/table/CustomTableWorkspace.jsx`
**Lines**: 148
**Purpose**: Main workspace for building and composing tables. The working example that uses the full data flow.

#### **Imports** (Lines 1-21)
```javascript
React, { useState, useEffect } from 'react'
Toolbar from '../../../../components/Toolbar.jsx'
TableContainer, { TableBody } from './TableContainer.jsx'
{ applyTemplate } from './tableConfig.js'
{ shouldApplyTablePlugin } from './tableProps.js'
TablePlugin from '../../plugins/default/table/TablePlugin.jsx'

// Section imports
A1Section, A2Section, A3Section
B1Section, B2Section, B3Section
```

**Why these imports**:
- `useState`: Manages cellState and expandedRows
- `Toolbar`: Top-level toolbar component
- `TableContainer`: The orchestrator
- `applyTemplate`: Transforms data into table props
- `shouldApplyTablePlugin`: Checks if row needs plugin renderer
- `TablePlugin`: Full-width nested table renderer
- Sections: The actual rendering components

#### **Props** (Lines 23-34)
```javascript
{
  data = [],           // Raw data from dataService
  template = null,     // Template function (or default)
  options = {},        // Additional template options
  ...props
}
```

#### **State Variables** (Lines 35-39)
```javascript
const [cellState, setCellState] = useState({})
// Format: { "rowId_colKey": { type, content, template } }

const [expandedRows, setExpandedRows] = useState({})
// Format: { "rowId": boolean }
```

**Purpose**:
- `cellState`: Tracks plugin data dropped into cells
- `expandedRows`: Tracks which rows are expanded (for nested content)

**Shared between**: A2 and B2 sections

#### **Functions**

**Function: `handleCellDrop`** (Lines 45-78)
- **Parameters**:
  - `rowId` (String): Row identifier
  - `colKey` (String): Column key
  - `droppedData` (Object): Plugin data
- **Returns**: Nothing (side effect)
- **Purpose**: Handles drag-and-drop of plugins into cells
- **Algorithm**:
  1. Build cellKey: `${rowId}_${colKey}`
  2. Log drop event (debugging)
  3. Update cellState with new plugin data
  4. Log updated state
- **Called by**: Section components via prop

**Function: `toggleRowExpanded`** (Lines 80-85)
- **Parameters**: `rowId` (String)
- **Returns**: Nothing (side effect)
- **Purpose**: Toggle expanded state for a row
- **Called by**: Section components and TablePlugin

**Function: `handleCellStateUpdate`** (Lines 87-92)
- **Parameters**:
  - `cellKey` (String): Cell identifier
  - `data` (Object): New plugin data
- **Returns**: Nothing (side effect)
- **Purpose**: Update plugin data for a specific cell
- **Called by**: Plugin components

#### **Data Processing**

**Step 1: Apply Template** (Line 42)
```javascript
const tableProps = applyTemplate(data, template, options)
```
- Calls the template function (or defaultTable)
- Returns normalized table props

**Step 2: Enhance Rows** (Lines 95-111)
```javascript
const enhancedRows = tableProps.rows.map(row => {
  if (shouldApplyTablePlugin(row, cellState)) {
    return {
      ...row,
      _selectPlugin: TablePlugin,
      _fullWidth: true,
      _pluginProps: { ... }
    }
  }
  return row
})
```

**Purpose**: Attach TablePlugin renderer to rows that have plugin data
**Detection**: `shouldApplyTablePlugin` checks cellState for `rowId_*` keys
**Result**: Row gets special props that A2/B2 will detect and render accordingly

**Step 3: Route Columns** (Lines 114-115)
```javascript
const fixedColumns = tableProps.columnKeys.slice(0, 1)
const scrollingColumns = tableProps.columnKeys.slice(1)
```
**Logic**: First column fixed, rest scroll

#### **Render Structure** (Lines 117-146)
```jsx
<div className="flex flex-col h-auto z-[50]">
  <Toolbar />

  <TableContainer {...tableProps} layout={{...}}>
    <TableBody>
      <A2Section
        columnKeys={fixedColumns}
        rows={enhancedRows}
        onCellDrop={handleCellDrop}
        cellState={cellState}
        onCellStateUpdate={handleCellStateUpdate}
        expandedRows={expandedRows}
        toggleRowExpanded={toggleRowExpanded}
      />
    </TableBody>
  </TableContainer>
</div>
```

**Note**: Only renders A2 section (fixed column body). This is likely incomplete/demo code.

**Layout Override** (Lines 124-130)
```javascript
layout={{
  ...tableProps.layout,
  firstColWidth: 344,  // Override template's firstColWidth
}}
```

#### **Integration Points**
```
CustomTableWorkspace
  ← Imported by: Pages that use custom table builder
  → Imports: TableContainer, Sections, TablePlugin
  → Calls: applyTemplate, shouldApplyTablePlugin
  ← Receives: data (from dataService), template function
  → Renders: Single-column table with plugin support
```

#### **Current State**: INCOMPLETE
This file only renders A2 (fixed body). Missing:
- A1 (fixed header)
- A3 (fixed footer)
- B1, B2, B3 (scrolling sections)

**Conclusion**: This is a demo/test file, not production-ready.

---

### File: **NestedTable.jsx**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/custom/table/NestedTable.jsx`
**Lines**: 121
**Purpose**: Pure UI component that renders complete A/B table sections. All state managed by parent (TablePlugin).

#### **Imports** (Lines 1-15)
```javascript
React from 'react'
TableContainer, { TableHeader, TableBody, TableFooter } from './TableContainer.jsx'
A1Section, A2Section, A3Section
B1Section, B2Section, B3Section
```

#### **Props** (Lines 17-47)
This component is **prop-driven** (no internal state):

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `fixedColumns` | Array | `[]` | Column keys for A sections |
| `scrollingColumns` | Array | `[]` | Column keys for B sections |
| `rows` | Array | `[]` | Data rows |
| `totals` | Object | `{}` | Footer totals |
| `columnKeys` | Array | `[]` | All columns |
| `columnLabels` | Object | `{}` | Display labels |
| `columnWidths` | Object | `{}` | Width per column |
| `sortKey` | String | `null` | Current sort column |
| `sortDirection` | String | `null` | Sort direction |
| `onSort` | Function | `() => {}` | Sort handler |
| `styles` | Object | `{}` | Section styles |
| `layout` | Object | `{}` | Dimensions |
| `onHeaderDragStart` | Function | `null` | Drag start handler |
| `onA1Drop` | Function | `null` | Drop handler for A1 |
| `onDragOver` | Function | `null` | Drag over handler |
| `isTransitioning` | Boolean | `false` | Transition state |

#### **Render Structure** (Lines 48-120)
**Complete A/B table** with all sections:

```jsx
<TableContainer {...allProps}>
  <TableHeader>
    <A1Section columnKeys={fixedColumns} {...} />
    <B1Section columnKeys={scrollingColumns} {...} />
  </TableHeader>

  <TableBody>
    <A2Section columnKeys={fixedColumns} rows={rows} />
    <B2Section columnKeys={scrollingColumns} rows={rows} />
  </TableBody>

  <TableFooter>
    <A3Section columnKeys={fixedColumns} totals={totals} />
    <B3Section columnKeys={scrollingColumns} totals={totals} />
  </TableFooter>
</TableContainer>
```

#### **Prop Routing**
Each section receives exactly what it needs:

**A1 Section** (Lines 62-74):
- `columnKeys`: fixedColumns only
- `columnLabels`, `columnWidths`
- `sortKey`, `sortDirection`, `onSort`
- `styles.a1`
- Drag/drop handlers: `onA1Drop`, `onDragOver`
- `isTransitioning`

**B1 Section** (Lines 75-86):
- `columnKeys`: scrollingColumns only
- Similar to A1, but uses `onHeaderDragStart`

**A2/B2 Sections** (Lines 90-101):
- `columnKeys`: fixed vs scrolling
- `rows`: same data, different columns
- `styles.a2` or `styles.b2`

**A3/B3 Sections** (Lines 104-117):
- `columnKeys`: fixed vs scrolling
- `totals`: footer calculations

#### **Integration Points**
```
NestedTable
  ← Imported by: TablePlugin
  → Renders: Complete A/B table with all 6 sections
  → Uses: TableContainer's scroll sync
  ← Receives: All props from parent (no internal state)
```

#### **Key Design Decision**: **Stateless**
- No useState, no useEffect
- All behavior driven by props
- Parent (TablePlugin) manages state
- Makes it easy to nest inside other tables

---

### File: **dataConfig.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/custom/table/dataConfig.js`
**Lines**: 89
**Purpose**: Receives filtered data from dataService and provides manipulation functions.

#### **Imports** (Line 8)
```javascript
{ sumField, groupBy, filterByValue, round } from '../../../calculations/index.js'
```

**Philosophy**: Leverages calculations folder for all math/aggregation operations.

#### **Functions**

**Function: `prepareDataForTemplate`** (Lines 13-16)
- **Parameters**: `data` (Array)
- **Returns**: Array (validated)
- **Purpose**: Basic data pass-through with validation
- **Algorithm**: Check if array, return data or empty array

**Function: `calculateTotals`** (Lines 22-30)
- **Parameters**:
  - `data` (Array): Data rows
  - `fields` (Array): Field names to sum
- **Returns**: Object of field → sum
- **Purpose**: Calculate numeric totals
- **Uses**: `sumField` from calculations
- **Example**: `{quantity: 150, discounted_price: 3500}`

**Function: `groupDataBy`** (Lines 36-38)
- **Parameters**:
  - `data` (Array)
  - `field` (String): Field to group by
- **Returns**: Map of key → Array of rows
- **Purpose**: Group data by field value
- **Uses**: `groupBy` from calculations

**Function: `filterData`** (Lines 44-46)
- **Parameters**:
  - `data` (Array)
  - `field` (String): Field to filter on
  - `value` (Any): Value to match
- **Returns**: Filtered array
- **Purpose**: Filter data by field value
- **Uses**: `filterByValue` from calculations

**Function: `formatValue`** (Lines 51-63)
- **Parameters**:
  - `key` (String): Column key
  - `value` (Any): Value to format
- **Returns**: Formatted string
- **Purpose**: Format cell values for display
- **Algorithm**:
  1. Return empty string if null/empty
  2. Return string if not number
  3. If key contains "UPT" or "Attach Rate": round to 2 decimals
  4. If key contains "Revenue", "Net", "AOV": format as currency
  5. Otherwise: round and add thousand separators
- **Used by**: Section components

**Function: `loadProductData`** (Lines 69-76)
- **Parameters**: `productNames` (Array)
- **Returns**: Promise<Array>
- **Purpose**: Load all-time product data for drag operations
- **Note**: Currently incomplete (references undefined `loadAllTimeProductData`)

#### **Exports** (Lines 78-88)
Re-exports commonly used calculation functions:
```javascript
export { sumField, groupBy, filterByValue, round }

export default {
  prepareDataForTemplate,
  calculateTotals,
  groupDataBy,
  filterData,
  formatValue,
  loadProductData
}
```

#### **Integration Points**
```
dataConfig
  ← Imported by: Templates
  → Uses: calculations/operations/aggregations.js
  → Provides: Data manipulation utilities
```

#### **Design Pattern**: **Facade**
This file is a simplified interface to the calculations system.

---

### File: **tableConfig.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/custom/table/tableConfig.js`
**Lines**: 187
**Purpose**: Calls templates and routes their output to TableContainer. The bridge between data transformation and UI rendering.

#### **Imports** (Lines 1-10)
```javascript
defaultTable from './templates/defaultTable.js'
{ DEFAULT_LAYOUT } from './tableProps.js'
{ getFieldLabel, getNumericFields } from '../../../config/schemaRegistry.js'
```

#### **Functions**

**Function: `applyTemplate`** (Lines 20-65)
- **Parameters**:
  - `data` (Array): Filtered data from dataService
  - `template` (Function|null): Template function
  - `options` (Object): Additional options
- **Returns**: Object ready for TableContainer
- **Purpose**: Apply template and normalize output
- **Algorithm**:
  1. Use provided template or defaultTable
  2. Call template with data and options
  3. Destructure template output
  4. Route to TableContainer format with defaults
  5. Apply option overrides for layout
- **Output Shape**:
```javascript
{
  rows: [],
  totals: {},
  columnKeys: [],
  columnLabels: {},
  styles: {},
  layout: {
    firstColWidth, metricColWidth, headerHeight,
    rowHeight, footerHeight, placeholderCols
  },
  showHeader: true,
  showBody: true,
  showFooter: true
}
```

**Function: `routeABColumns`** (Lines 70-83)
- **Parameters**: `columnKeys` (Array)
- **Returns**: `{fixedColumns, scrollingColumns}`
- **Purpose**: Split columns for A/B sections
- **Logic**: First column fixed, rest scroll

**Function: `routeCDColumns`** (Lines 88-101)
- **Parameters**: `columnKeys` (Array)
- **Returns**: `{fixedColumns, scrollingColumns}`
- **Purpose**: Split columns for C/D sections
- **Logic**: Same as AB (first fixed, rest scroll)

**Function: `getTableConfig`** (Lines 106-115)
- **Parameters**: `templateName` (String)
- **Returns**: Template function
- **Purpose**: Template registry lookup
- **Templates**:
  - `default`: defaultTable
  - Others: Commented out (not implemented)

**Function: `getViewModeColumns`** (Lines 122-131)
- **Parameters**: `viewMode` (String)
- **Returns**: Array of column keys
- **Purpose**: Get columns for specific view mode
- **View Modes**:
  - `summary`: product_name, quantity, discounted_price
  - `by-color`: + color
  - `by-size`: + size
  - `by-variant`: + color + size

**Function: `getStandardColumnLabels`** (Lines 140-148)
- **Parameters**:
  - `columnKeys` (Array)
  - `schemaName` (String): Default 'retail_line_items'
  - `displayMode` (String): Default 'default'
- **Returns**: Object of key → label
- **Purpose**: Get display labels from schema
- **Uses**: `getFieldLabel` from schemaRegistry

**Function: `getColumnWidths`** (Lines 155-162)
- **Parameters**: `columnKeys` (Array)
- **Returns**: Object of key → width (px)
- **Purpose**: Calculate widths for columns
- **Logic**: First column uses firstColWidth, rest use metricColWidth

**Function: `getTotalableColumns`** (Lines 170-175)
- **Parameters**:
  - `columnKeys` (Array)
  - `schemaName` (String): Default 'retail_line_items'
- **Returns**: Array of numeric field names
- **Purpose**: Filter columns that should have totals
- **Uses**: `getNumericFields` from schemaRegistry

#### **Exports** (Lines 177-186)
All utility functions exported as object and named exports.

#### **Integration Points**
```
tableConfig
  ← Imported by: CustomTableWorkspace, templates
  → Imports: defaultTable, schemaRegistry
  → Uses: Template functions
  → Provides: Normalized table props for TableContainer
```

#### **Data Flow**
```
dataService
  ↓ filtered data
template function
  ↓ template-specific props
applyTemplate()
  ↓ normalized props
TableContainer
  ↓ tableContext
Section components
```

---

### File: **tableProps.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/custom/table/tableProps.js`
**Lines**: 261
**Purpose**: Central place for all table helper functions, defaults, and utilities.

#### **Functions**

**Function: `getAlignmentClasses`** (Lines 11-21)
- **Parameters**: `alignment` (String)
- **Returns**: Tailwind classes
- **Purpose**: Convert alignment to CSS classes
- **Values**:
  - `'left'`: "justify-start text-left"
  - `'right'`: "justify-end text-right"
  - `'center'`: "justify-center text-center" (default)

#### **Constants**

**DEFAULT_LAYOUT** (Lines 26-34)
```javascript
{
  firstColWidth: 100,
  metricColWidth: 70,
  headerHeight: 35,
  rowHeight: 35,
  footerHeight: 35,
  placeholderRows: 3,
  placeholderCols: 4
}
```
**Used by**: defaultTable template

**MODULE_LAYOUT** (Lines 40-48)
```javascript
{
  firstColWidth: 150,
  metricColWidth: 105,
  headerHeight: 40,
  rowHeight: 30,
  footerHeight: 35,
  placeholderRows: 3,
  placeholderCols: 4
}
```
**Used by**: multivariableTable template (drag-and-drop builder)

**DEFAULT_STYLES** (Lines 53-117)
Comprehensive style definitions for all sections:

```javascript
{
  a1: {
    base: "...", sortable: "...", nonSortable: "...", pluginCell: "..."
  },
  a2: { cell: "...", ChA2: "..." },
  a3: { cell: "..." },
  b1: { cell: "...", sortable: {}, pluginCell: "..." },
  b2: { cell: "..." },
  b3: { cell: "..." },
  // c1, c2, c3, d1, d2, d3 (CD table styles)
}
```

**Key Pattern**: Each section has:
- `cell`: Base cell classes
- `base`: Alternative base classes
- `sortable`: Hover/active styles for sortable headers
- `pluginCell`: Special classes for plugin-rendered cells (px-0)

**MODULE_STYLES** (Lines 123-162)
Similar structure to DEFAULT_STYLES but optimized for drag-and-drop:
- Includes placeholder states
- Different sizing for compact layout
- ChA1/ChA2 specific styles (for channel components)

**DEFAULT_COLUMN_LABELS** (Lines 184-193)
```javascript
{
  product_name: "Product",
  upc: "UPC",
  color: "Color",
  size: "Size",
  quantity: "Units",
  discounted_price: "Revenue",
  unit_price: "Unit Price",
  line_discount: "Discount"
}
```

#### **Plugin Helper Functions**

**Function: `shouldApplyTablePlugin`** (Lines 208-215)
- **Parameters**:
  - `row` (Object): Table row
  - `cellState` (Object): Cell state from workspace
- **Returns**: Boolean
- **Purpose**: Check if row should use TablePlugin renderer
- **Algorithm**: Look for any cellState keys starting with `${rowId}_`

**Function: `getTablePluginData`** (Lines 223-232)
- **Parameters**:
  - `row` (Object)
  - `cellState` (Object)
- **Returns**: Plugin data object or null
- **Purpose**: Get plugin data for a specific row

**Function: `getSelectPlugin`** (Lines 240-260)
- **Parameters**:
  - `row` (Object)
  - `cellState` (Object)
- **Returns**: Promise<Component> or null
- **Purpose**: Dynamically load plugin component
- **Algorithm**:
  1. Get plugin data from cellState
  2. Map plugin type to component
  3. Lazy load component via dynamic import
  4. Return component or null on error
- **Types Supported**:
  - `'product'`: TablePlugin.jsx

#### **Integration Points**
```
tableProps
  ← Imported by: All section components, templates
  → Provides: Style constants, layout defaults, utilities
  → Used by: CustomTableWorkspace (plugin detection)
```

---

## SECTION COMPONENTS (A/B System)

### Directory: `components/custom/table/sections/A/` and `sections/B/`

All section components follow similar patterns:
1. Receive `tableContext` via props
2. Extract layout values from context
3. Render cells/headers based on data
4. Apply styles from `styles` prop
5. Handle empty states

---

### File: **A1.jsx** (Fixed Header)
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/custom/table/sections/A/A1.jsx`
**Lines**: 139

#### **Purpose**
Renders fixed column headers with:
- Fixed width positioning
- Multiple column support
- Sorting functionality
- Custom header renderers (ChA1)
- Proper z-index layering

#### **Props**
```javascript
{
  columnKeys = [],
  columnLabels = {},
  columnWidths = {},
  sortKey, sortDirection, onSort,
  disableSorting = false,
  alignment = 'center',
  columnAlignments = {},
  styles = {},
  customRenderer = null,
  className = "",
  isEmpty = false,
  emptyConfig = {},
  // Drag/drop
  onA1Drop, onDragOver, isTransitioning,
  // Plugin
  onColumnDrop = null,
  columnState = {},
  onColumnStateUpdate = () => {},
  pluginComponents = {},
  tableContext
}
```

#### **Key Features**

**Empty State** (Lines 65-81)
If `isEmpty === true`, renders placeholder:
```jsx
<div className={emptyConfig.className}>
  <span>{emptyConfig.placeholder}</span>
</div>
```

**Width Calculation** (Lines 84-86)
```javascript
const totalWidth = columnKeys.reduce((sum, key) => {
  return sum + (columnWidths[key] || firstColWidth)
}, 0)
```

**Render Loop** (Lines 93-135)
For each column:
1. Check if placeholder (`_placeholder` prefix)
2. Get display label
3. Determine if sortable
4. Build classes (base + sortable + custom)
5. Render wrapper div
6. Inside: Render `ChA1` component

**ChA1 Integration** (Lines 126-132)
```jsx
<ChA1
  columnKey={columnKey}
  columnLabel={label}
  columnState={columnState}
  onColumnStateUpdate={onColumnStateUpdate}
  tableContext={tableContext}
/>
```

**Styling Pattern**:
- Uses `pluginCell` classes (px-0) for wrapper
- ChA1 provides its own padding
- Sortable columns get hover effects

---

### File: **A2.jsx** (Fixed Body)
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/custom/table/sections/A/A2.jsx`
**Lines**: 193

#### **Purpose**
Renders fixed column data rows with:
- Fixed width positioning
- Multiple column support
- Shared vertical scroll
- Custom cell renderers (ChA2)
- Alternating row styling
- Plugin row support

#### **Key Features**

**Plugin Row Detection** (Lines 64-73)
```javascript
if (row && row._selectPlugin) {
  const PluginComponent = row._selectPlugin
  return <PluginComponent key={...} row={row} {...row._pluginProps} />
}
```
**When**: Row has `_selectPlugin` property (set by CustomTableWorkspace)
**Result**: Renders full-width plugin component (TablePlugin)

**Full-Width Content** (Lines 76-117)
Checks if customRenderer returns `{type: 'fullWidth', ...}`:
```javascript
const hasFullWidthContent = columnKeys.some(key => {
  const content = customRenderer[key](row[key], row, rIdx, key)
  return content?.type === 'fullWidth'
})
```
**Purpose**: Allow rows to span full width (used by nested tables)

**Normal Cell Rendering** (Lines 126-189)
For each column in each row:
1. Get column width and alignment
2. Check for custom renderer
3. Handle CellToolbar components
4. Render ChA2 component with cell value

**ChA2 Integration** (Lines 176-184)
```jsx
<ChA2
  rowId={rowId}
  columnKey={columnKey}
  styles={styles}
  cellValue={cellValue}
  cellState={cellState}
  onCellStateUpdate={onCellStateUpdate}
  tableContext={tableContext}
/>
```

**Styling Pattern**:
- Alternating row colors: `bg-gray-50` / `bg-white`
- Uses `ChA2` classes (px-0) for wrapper
- ChA2 provides its own padding
- Drop zone support via onCellDrop

---

### File: **A3.jsx** (Fixed Footer)
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/custom/table/sections/A/A3.jsx`
**Lines**: 97

#### **Purpose**
Renders fixed column footers with totals/summaries.

#### **Key Features**

**Width Calculation** (Lines 42-44)
Same pattern as A1:
```javascript
const totalWidth = columnKeys.reduce((sum, key) =>
  sum + (columnWidths[key] || firstColWidth), 0)
```

**Display Value** (Line 82)
```javascript
const displayValue = isPlaceholder
  ? "Drop column"
  : (totals?.[columnKey] || (index === 0 ? 'Total' : ''))
```
**Logic**:
- Placeholders show "Drop column"
- First column shows "Total"
- Other columns show totals from `totals` object

**Styling**:
- Gradient backgrounds
- Shadow for depth
- Border on top

---

### File: **B1.jsx** (Scrolling Headers)
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/custom/table/sections/B/B1.jsx`
**Lines**: 145

#### **Purpose**
Renders scrolling column headers with:
- Grid-based layout
- Horizontal scroll sync via transform
- Sorting functionality
- Drag/drop support
- ChB1 integration (metric picker)

#### **Key Differences from A1**

**Refs** (Line 83)
Attaches `hTopRef` to outer container:
```jsx
<div ref={tableContext?.hTopRef}>
```
**Purpose**: Scroll event target for wheel gestures

**Transform Track** (Lines 84-88)
```jsx
<div
  ref={tableContext?.b1TrackRef}
  className="will-change-transform"
  style={{ width: totalMetricWidth }}
>
```
**Purpose**: This div gets transformed by TableContainer's scroll sync

**Grid Layout** (Lines 89-92)
```jsx
<div
  className="grid h-full"
  style={{ gridTemplateColumns: gridTemplate }}
>
```
**gridTemplate**: `"80px 80px 80px..."` (from columnWidths)

**ChB1 Integration** (Lines 123-134)
```jsx
<ChB1
  columnKey={columnKey}
  columnLabel={displayLabel}
  columnKeys={columnKeys}
  allColumnKeys={allColumnKeys}
  columnLabels={columnLabels}
  columnState={columnState}
  onColumnStateUpdate={onColumnStateUpdate}
  onColumnSwap={onColumnSwap}
  tableContext={tableContext}
  sortable={sortable}
  onSort={onSort}
/>
```
**Features**: Metric picker dropdown, column swapping

**Drag Support** (Lines 119-120)
```jsx
draggable={!!onHeaderDragStart}
onDragStart={onHeaderDragStart ? (e) => onHeaderDragStart(e, columnKey) : undefined}
```

---

### File: **B2.jsx** (Scrolling Body)
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/custom/table/sections/B/B2.jsx`
**Lines**: 183

#### **Purpose**
Renders scrolling column data with grid layout and transform sync.

#### **Key Features**

**Transform Track** (Lines 72-75)
```jsx
<div
  ref={tableContext?.b2TrackRef}
  className="will-change-transform transform-gpu"
  style={{ width: totalMetricWidth }}
>
```
**Classes**:
- `will-change-transform`: Hints browser for optimization
- `transform-gpu`: Forces GPU acceleration

**Plugin Row Skipping** (Lines 77-80)
```javascript
if (row && row._selectPlugin) {
  return null  // Already rendered in A2
}
```

**Full-Width Handling** (Lines 83-109)
Checks for full-width content from A2 custom renderer:
```javascript
const aContent = aCustomRenderer(row[aColumnKey], row, rIdx, aColumnKey)
const isFullWidth = aContent?.type === 'fullWidth'
```
**Result**: Renders `b2Content` portion of full-width component

**Grid Rendering** (Lines 116-178)
For each row and column:
1. Calculate grid template
2. Format cell values
3. Check for custom renderer
4. Handle CellToolbar components
5. Render ChB2 component

**ChB2 Integration** (Lines 165-172)
```jsx
<ChB2
  rowId={rowId}
  columnKey={columnKey}
  cellValue={cellContent}
  cellState={cellState}
  onCellStateUpdate={onCellStateUpdate}
  tableContext={tableContext}
/>
```

**Value Formatting** (Lines 58-67)
Local helper:
```javascript
const formatVal = (key, val) => {
  if (val == null) return ""
  if (typeof val !== "number") return String(val)
  if (key.includes("UPT") || key.includes("Attach Rate"))
    return val.toFixed(2)
  if (key.includes("Revenue") || key.includes("Net") || key.includes("AOV"))
    return `$${Math.round(val).toLocaleString()}`
  return Math.round(val).toLocaleString()
}
```

---

### File: **B3.jsx** (Scrolling Footer)
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/custom/table/sections/B/B3.jsx`
**Lines**: 105

#### **Purpose**
**CRITICAL**: Owns the horizontal scrollbar that drives B1 and B2.

#### **Key Features**

**Scroll Bar Owner** (Line 64)
```jsx
<div ref={tableContext?.hBottomRef}
     className="overflow-x-auto overflow-y-hidden">
```
**Classes**:
- `overflow-x-auto`: Shows horizontal scrollbar
- `overflow-y-hidden`: No vertical scroll

**This scrollbar** drives the entire horizontal scroll sync system.

**Grid Layout** (Lines 66-69)
Same pattern as B1:
```jsx
<div style={{ width: totalMetricWidth }}>
  <div className="grid" style={{ gridTemplateColumns: gridTemplate }}>
```

**Value Formatting** (Lines 52-61)
Same helper as B2.

**Display Values** (Line 75)
```javascript
const display = isPlaceholder
  ? "\u00A0"  // Non-breaking space
  : (formatVal(columnKey, totals?.[columnKey]) || "")
```

---

## TEMPLATES

### Directory: `components/custom/table/templates/`

Templates transform raw data into table-ready props.

---

### File: **defaultTable.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/custom/table/templates/defaultTable.js`
**Lines**: 79

#### **Purpose**
Returns empty grid structure with drop zones for drag-and-drop table builder.

#### **Algorithm** (Lines 10-76)

**Step 1: Extract Options** (Lines 11-19)
```javascript
const {
  gridRows = 10,
  gridCols = 8,
  headerHeight, rowHeight, footerHeight,
  firstColWidth, metricColWidth
} = options
```

**Step 2: Generate Column Keys** (Line 22)
```javascript
const columnKeys = Array.from({length: gridCols}, (_, i) => `col_${i}`)
```
**Result**: `['col_0', 'col_1', 'col_2', ...]`

**Step 3: Split Columns** (Lines 24-26)
```javascript
const fixedColumns = [columnKeys[0]]
const scrollingColumns = columnKeys.slice(1)
```

**Step 4: Generate Labels** (Lines 29-32)
```javascript
columnKeys.forEach((key, i) => {
  columnLabels[key] = `Drop Zone ${i + 1}`
})
```

**Step 5: Generate Widths** (Lines 35-38)
```javascript
columnKeys.forEach((key, i) => {
  columnWidths[key] = i === 0 ? firstColWidth : metricColWidth
})
```

**Step 6: Generate Empty Rows** (Lines 41-52)
```javascript
const rows = Array.from({length: gridRows}, (_, rowIndex) => {
  const row = {
    _rowId: `row_${rowIndex}`,
    _dropZone: true
  }
  columnKeys.forEach(colKey => {
    row[colKey] = ''  // Empty cell
  })
  return row
})
```

**Step 7: Empty Totals** (Lines 55-57)
```javascript
const totals = {
  col_0: 'Total'
}
```

**Return** (Lines 59-75)
```javascript
{
  rows,
  totals,
  columnKeys,
  columnLabels,
  columnWidths,
  fixedColumns,
  scrollingColumns,
  styles: DEFAULT_STYLES,
  layout: {...}
}
```

#### **Usage**
```javascript
const tableProps = defaultTable([], {gridRows: 15, gridCols: 10})
```

---

### File: **multivariableTable.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/custom/table/templates/multivariableTable.js`
**Lines**: 89

#### **Purpose**
**THE WORKING TEMPLATE** - Returns 3 tables for coupled pairs analysis in multi-mode format.

#### **Imports** (Lines 7-12)
```javascript
{ MODULE_STYLES, MODULE_LAYOUT } from '../tableProps.js'
{ generatePrimaryMetricsTable } from '...multivariable/primaryMetrics.js'
{ generateSecondaryMetricsTable } from '...multivariable/secondaryMetrics.js'
{ generateCoupledPairsTable } from '...multivariable/coupledPairs.js'
{ getProductsForPairing } from primaryMetrics and secondaryMetrics
```

#### **Algorithm** (Lines 14-86)

**Step 1: Extract Options** (Lines 15-20)
```javascript
const {
  table1Size = 10,
  table2Size = 10,
  pairSize = 10,
  dateRange = {days: 30}
} = options
```

**Step 2: Generate Table 1 - Primary Metrics** (Lines 29-33)
```javascript
const table1Props = generatePrimaryMetricsTable(lineItems, {
  sampleSize: table1Size,
  sortBy: 'quantity'
})
```
**Columns**: product_name, quantity, discounted_price
**Sorted by**: Quantity (desc)

**Step 3: Get Table 1 Product Names** (Lines 36-37)
```javascript
const table1ProductNames = table1Props.rows.map(row => row.product_name)
```
**Purpose**: Used as reference for Table 2 attach rate calculation

**Step 4: Generate Table 2 - Secondary Metrics** (Lines 40-46)
```javascript
const table2Props = generateSecondaryMetricsTable(lineItems, {
  sampleSize: table2Size,
  sortBy: 'attach_rate',
  dateRange,
  referenceProducts: table1ProductNames  // <-- CRITICAL
})
```
**Columns**: product_name, attach_rate, velocity
**Sorted by**: Attach rate (desc)
**Attach rate**: Calculated relative to Table 1 products

**Step 5: Get Products for Pairing** (Lines 50-51)
```javascript
const products1 = getPrimaryProducts(table1Props)
const products2 = getSecondaryProducts(table2Props)
```

**Step 6: Generate Table 3 - Coupled Pairs** (Lines 56-59)
```javascript
const table3Props = generateCoupledPairsTable(products1, products2, lineItems, {
  sampleSize: pairSize,
  dateRange
})
```
**Columns**: product_a, product_b, orders_together, net_together, bundle_rate, velocity_together, compound_score
**Pairs**: Cartesian product of Table 1 × Table 2 products
**Metrics**: Calculated from line items

**Step 7: Enhance Tables** (Lines 62-66)
```javascript
const enhanceTable = (tableProps) => ({
  ...tableProps,
  styles: tableProps.styles || MODULE_STYLES,
  layout: tableProps.layout || MODULE_LAYOUT
})
```

**Return** (Lines 68-85)
```javascript
{
  mode: 'multi',
  tables: [
    {id: 'primary-metrics', tableProps: enhanceTable(table1Props)},
    {id: 'secondary-metrics', tableProps: enhanceTable(table2Props)},
    {id: 'coupled-pairs', tableProps: enhanceTable(table3Props), expandable: true}
  ]
}
```

#### **Data Flow**
```
Line Items (from dataService)
  ↓
multivariableTable()
  ├→ generatePrimaryMetricsTable()
  │    ↓ returns table1Props
  ├→ generateSecondaryMetricsTable(referenceProducts: table1ProductNames)
  │    ↓ returns table2Props
  └→ generateCoupledPairsTable(products1, products2)
       ↓ returns table3Props
Return: {mode: 'multi', tables: [3 tables]}
```

#### **Usage Example**
```javascript
const result = multivariableTable(lineItems, {
  table1Size: 15,
  table2Size: 15,
  pairSize: 20,
  dateRange: {days: 30}
})
// result.mode === 'multi'
// result.tables[0] === primary metrics
// result.tables[1] === secondary metrics
// result.tables[2] === coupled pairs (expandable)
```

---

## CHANNEL COMPONENTS

### Directory: `components/module/table/channel/`

Channel components wrap individual cells/headers with interactive toolbars and plugin support.

---

### File: **ChA1.jsx** (Fixed Header Channel)
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/module/table/channel/ChA1.jsx`
**Lines**: 57

#### **Purpose**
Renders in fixed column headers. Accepts: Product filters (defines row dimension).

#### **Features**

**ChannelStrip Wrapper** (Lines 24-54)
```jsx
<ChannelStrip
  section="A1"
  columnKey={columnKey}
  pluginData={columnState[columnKey]}
  onUpdate={(data) => onColumnStateUpdate(columnKey, data)}
  tableContext={tableContext}
  noPadding={false}
  toolbarLeftContent={<button>...</button>}
>
  <span>{columnLabel}</span>
  {sortIndicator}
</ChannelStrip>
```

**Toolbar Left** (Lines 31-39)
Button with IconTableDown - shows nested variants

**Content** (Line 48)
Badge with column label:
```jsx
<span className="...bg-gradient-to-l from-gray-700 via-gray-600/90 to-gray-700 text-white...">
  {columnLabel}
</span>
```

**Sort Indicator** (Lines 49-53)
Shows ↑/↓ when column is sorted

---

### File: **ChA2.jsx** (Fixed Body Channel)
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/module/table/channel/ChA2.jsx`
**Lines**: 68

#### **Purpose**
Renders in fixed column body cells. Displays row data values.

#### **Features**

**Cell Key** (Line 22)
```javascript
const cellKey = `${rowId}_${columnKey}`
```
**Purpose**: Unique identifier for cell plugin state

**Toolbar Left** (Lines 36-44)
Button with IconPrismLight - shows nested variants

**Toolbar Right** (Lines 49-57)
Button with IconX - remove action

**Content** (Lines 62-64)
```jsx
<div className="w-full px-4 flex items-center justify-start">
  <span className="text-xs text-gray-700 truncate">{cellValue}</span>
</div>
```

**Disabled Toolbar** (Line 34)
```jsx
disableToolbar={true}
```
**Reason**: Toolbar not needed in body cells

---

### File: **ChB1.jsx** (Scrolling Header Channel)
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/module/table/channel/ChB1.jsx`
**Lines**: 97

#### **Purpose**
Renders in scrolling column headers. Accepts: Metric filters (defines column metrics).

#### **Key Feature: Metric Picker**

**State** (Line 32)
```javascript
const [showPicker, setShowPicker] = useState(false)
```

**Picker Items** (Lines 36-39)
```javascript
const pickerItems = (allColumnKeys.length > 0 ? allColumnKeys : columnKeys)
  .map(key => ({
    value: key,
    label: columnLabels[key] || key
  }))
```

**Toggle Button** (Lines 61-67)
```jsx
<button onClick={togglePicker}>
  <IconLayoutDistributeHorizontal size={14} />
</button>
```

**Conditional Render** (Lines 78-87)
```jsx
{showPicker ? (
  <MetricPicker
    items={pickerItems}
    selectedValue={columnKey}
    onValueChange={handleMetricChange}
  />
) : (
  <span>{columnLabel}</span>
)}
```

**Metric Change Handler** (Lines 41-46)
```javascript
const handleMetricChange = (newColumnKey) => {
  if (newColumnKey !== columnKey) {
    onColumnSwap(columnKey, newColumnKey)
  }
  setShowPicker(false)
}
```

**Purpose**: Swap this column for a different metric

---

### File: **ChB2.jsx** (Scrolling Body Channel)
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/module/table/channel/ChB2.jsx`
**Lines**: 56

#### **Purpose**
Renders in scrolling column body cells. Displays calculated metric values.

#### **Features**

**Simple Display** (Line 52)
```jsx
<span className="text-xs text-gray-700">{cellValue}</span>
```

**Disabled Toolbar** (Line 33)
```jsx
disableToolbar={true}
```

**No Complex Logic**: Just displays the value

---

## DATA FLOW ARCHITECTURE

### End-to-End Data Journey

```
1. User Action (UI)
     ↓
2. Page Component (calls loadAnalyticsData)
     ↓
3. dataService.loadAnalyticsData(query, panelState, currentView)
     ↓
4. dataService determines scope, loads CSV files
     ↓
5. Returns: {table, rawData, loading, error, meta}
     ↓
6. Page passes data to TableWorkspace
     ↓
7. TableWorkspace.applyTemplate(data, template, options)
     ↓
8. Template (e.g., multivariableTable) processes data
     ├→ generatePrimaryMetricsTable(lineItems)
     ├→ generateSecondaryMetricsTable(lineItems)
     └→ generateCoupledPairsTable(products1, products2, lineItems)
     ↓
9. Returns: tableProps {rows, totals, columnKeys, columnLabels, styles, layout}
     ↓
10. TableContainer receives props
     ↓
11. TableContainer provides tableContext
     ↓
12. Section components (A1, A2, A3, B1, B2, B3) receive context
     ↓
13. Channel components (ChA1, ChA2, ChB1, ChB2) wrap cells
     ↓
14. DOM Rendering
```

---

## CALCULATION SYSTEM

### Directory: `calculations/`

Modular calculation library supporting all data operations.

---

### File: **operations/aggregations.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/calculations/operations/aggregations.js`
**Lines**: 277

#### **Purpose**
Data aggregation operations building on math functions.

#### **Imports** (Lines 4-5)
```javascript
{ sum, mean, count, countNonZero } from '../math/statistical.js'
{ toNumber, round } from '../math/basic.js'
```

#### **Functions**

**Field Extraction** (Lines 10-17)
```javascript
const extractField = (rows, fieldName) =>
  rows.map(row => row?.[fieldName]).filter(val => val != null)

const extractNumericField = (rows, fieldName, defaultValue = 0) =>
  extractField(rows, fieldName).map(val => toNumber(val, defaultValue))
```

**Basic Aggregations** (Lines 22-36)
```javascript
sumField(rows, fieldName)
averageField(rows, fieldName)
countField(rows, fieldName)
countNonZeroField(rows, fieldName)
```

**Group By Operations** (Lines 41-74)
```javascript
groupBy(rows, keyField)
// Returns: Map<key, Array<rows>>

groupByMultiple(rows, keyFields)
// Returns: Map<compositeKey, Array<rows>>
```

**Aggregate Groups** (Lines 79-110)
```javascript
aggregateGroups(groupedData, aggregations)
```
**Example**:
```javascript
const grouped = groupBy(data, 'product_name')
const aggregated = aggregateGroups(grouped, {
  totalQuantity: {field: 'quantity', operation: 'sum'},
  avgPrice: {field: 'unit_price', operation: 'average'}
})
```

**Quick Helpers** (Lines 115-143)
```javascript
sumByGroup(rows, groupField, sumField)
averageByGroup(rows, groupField, avgField)
```

**Filter Operations** (Lines 148-164)
```javascript
filterByValue(rows, field, value)
filterByRange(rows, field, min, max)
filterNonZero(rows, field)
```

**Coupled Pairs Analysis** (Lines 177-277)

**findOrdersWithProducts** (Lines 177-196)
- **Parameters**:
  - `lineItems` (Array)
  - `productNames` (Array): Products to find together
- **Returns**: Set of order IDs
- **Algorithm**:
  1. Group line items by order_id
  2. For each order, get unique products
  3. Check if order has ALL specified products
  4. Add matching order IDs to set
- **Used by**: Coupled pairs analysis

**calculateAttachRate** (Lines 206-258)
- **Parameters**:
  - `lineItems` (Array)
  - `productName` (String): Target product
  - `referenceProducts` (Array): Optional reference products
- **Returns**: Number (0-100 for percentage, or 0-1 for general rate)
- **Algorithm**:

  **With Reference Products**:
  1. Group line items by order
  2. Count orders with any reference product
  3. Count orders with both reference product AND target product
  4. Return: (both / reference) * 100
  5. Round to 1 decimal place

  **Without Reference Products** (Default):
  1. Count orders with target product
  2. Count orders with target product AND other products
  3. Return: withOthers / total
  4. Round to 2 decimals

**calculateVelocity** (Lines 267-277)
- **Parameters**:
  - `lineItems` (Array): Line items for a product
  - `dateRange` (Object): {days: number}
- **Returns**: Number (orders per day)
- **Algorithm**:
  1. Count unique order IDs
  2. Divide by days in dateRange
  3. Round to 2 decimals

---

## CONFIGURATION SYSTEM

### Directory: `config/`

---

### File: **schemaRegistry.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/config/schemaRegistry.js`
**Lines**: 123

#### **Purpose**
Centralized access to data schemas for field definitions, display labels, and formatting hints.

#### **Schema Registry** (Lines 13-17)
```javascript
const SCHEMAS = {
  retail_line_items: retailLineItemsSchema
  // Add more schemas as needed
}
```

#### **Functions**

**getSchema** (Lines 22-24)
```javascript
export function getSchema(schemaName) {
  return SCHEMAS[schemaName] || null
}
```

**getFieldDefinition** (Lines 29-32)
```javascript
export function getFieldDefinition(schemaName, fieldName) {
  const schema = getSchema(schemaName)
  return schema?.fields?.[fieldName] || null
}
```

**getFieldLabel** (Lines 41-59)
- **Parameters**:
  - `schemaName` (String)
  - `fieldName` (String): snake_case
  - `displayMode` (String): 'default', 'short', or 'verbose'
- **Returns**: Display label
- **Algorithm**:
  1. Try display_options[displayMode]
  2. Fallback to display_options.default
  3. Ultimate fallback: capitalize snake_case

**getFormatHint** (Lines 67-70)
```javascript
export function getFormatHint(schemaName, fieldName) {
  const field = getFieldDefinition(schemaName, fieldName)
  return field?.format_hint || null
}
```
**Format Hints**: 'currency', 'integer', 'decimal', 'percentage'

**getNumericFields** (Lines 77-80)
```javascript
export function getNumericFields(schemaName) {
  const schema = getSchema(schemaName)
  return schema?.analytics_config?.numeric_fields || []
}
```

**getGroupingFields** (Lines 87-90)
```javascript
export function getGroupingFields(schemaName) {
  const schema = getSchema(schemaName)
  return schema?.analytics_config?.grouping_fields || []
}
```

**isNumericField** (Lines 108-111)
```javascript
export function isNumericField(schemaName, fieldName) {
  const numericFields = getNumericFields(schemaName)
  return numericFields.includes(fieldName)
}
```

#### **Usage Example**
```javascript
const label = getFieldLabel('retail_line_items', 'discounted_price', 'short')
// Returns: "Revenue"

const numeric = getNumericFields('retail_line_items')
// Returns: ['quantity', 'discounted_price', 'unit_price', ...]
```

---

### File: **tableConfig.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/config/tableConfig.js`
**Lines**: 336

#### **Purpose**
Consolidated table configuration and utilities. Raw-first table utilities for dual view mode system.

#### **Constants**

**COLUMN_LABELS** (Lines 6-39)
Single source of truth for column display names:
```javascript
{
  // Raw CSV fields - line_items.csv
  "product_name": "Product",
  "upc": "UPC",
  "color": "Color",
  "size": "Size",
  "discounted_price": "Revenue",
  "quantity": "Units",

  // Raw CSV fields - orders.csv
  "customer_name": "Customer",
  "associate": "Associate",
  "date_time": "Date",

  // Legacy display fields (backward compatibility)
  "Product Name": "Product",
  "Quantity Sold": "Units"
}
```

**COLUMN_PRESETS** (Lines 42-57)
Common column configurations:
```javascript
{
  line_items: ["product_name", "color", "size", "quantity", "discounted_price"],
  products: ["product_name", "quantity", "discounted_price", "unit_price"],
  orders: ["order_id", "customer_name", "date_time", "total", "status"],
  inventory: ["product_name", "sku", "upc", "color", "size"],
  default: ["product_name", "quantity", "discounted_price"]
}
```

**NUMERIC_FIELDS** (Lines 60-62)
```javascript
["quantity", "discounted_price", "unit_price", "line_discount", "taxes", "total"]
```

**GROUPABLE_FIELDS** (Lines 65-67)
```javascript
["product_name", "color", "size", "sku", "upc", "order_id", "status"]
```

#### **Functions**

**toTable** (Lines 73-178)
Enhanced data transformation with flexible options.

**Parameters**:
```javascript
{
  scope = 'line_items',        // Data scope
  timeframe = 'all',            // Time filtering
  dateRange = null,             // Date range
  columns = null,               // Column selection
  excludeColumns = [],          // Columns to hide
  groupBy = false,              // Grouping config
  aggregation = 'sum',          // Aggregation method
  customColumns = null,         // Legacy support
  kpis = {},                    // KPI data
  meta = {}                     // Metadata
}
```

**Algorithm**:
1. Handle empty data (return structure with defaults)
2. Filter data by timeframe/dateRange
3. Determine columns (preset, explicit, or auto-detect)
4. Apply column exclusions
5. Apply grouping if specified
6. Transform to table format
7. Calculate totals for numeric columns
8. Return complete table object

**Return Shape**:
```javascript
{
  columnKeys: [],
  displayLabels: [],
  rows: [],
  totals: {},
  rowCount: 0,
  columnCount: 0,
  meta: {...}
}
```

**applyGrouping** (Lines 198-252)
```javascript
function applyGrouping(data, groupBy, aggregation, columnKeys) {
  // Groups data by specified fields
  // Aggregates numeric fields per group
  // Supports: sum, count, avg, min, max
}
```

**loadCSVData** (Lines 257-269)
```javascript
export async function loadCSVData(filePath) {
  const response = await fetch(filePath)
  const csvText = await response.text()
  return parseCSV(csvText)
}
```

**parseCSV** (Lines 274-298)
CSV parser that handles quoted fields:
```javascript
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n')
  const headers = parseCSVLine(lines[0])
  const data = lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const row = {}
    headers.forEach((header, i) => {
      row[header] = values[i] || ''
    })
    return row
  })
  return data
}
```

**parseCSVLine** (Lines 303-326)
Respects quoted fields with commas:
```javascript
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes
    else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}
```

---

### File: **dataService.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/services/dataService.js`
**Lines**: 503

#### **Purpose**
Simple data service for loading retail CSV data. Replaces mock system with real data loading.

#### **Core Functions**

**loadLineItemsData** (Lines 9-34)
```javascript
export async function loadLineItemsData(year, month) {
  const paddedMonth = month.padStart(2, '0')
  const filePath = `/data/retail/orders/${year}/${year}-${paddedMonth}/line_items.csv`

  try {
    const rawData = await loadCSVData(filePath)
    console.log(`Loaded ${rawData.length} line items from ${year}-${paddedMonth}`)
    return rawData
  } catch (error) {
    console.error(`Failed to load from ${filePath}:`, error)
    return []
  }
}
```

**loadOrdersData** (Lines 39-57)
Same pattern as loadLineItemsData, but for orders.csv.

**queryToDataConfig** (Lines 62-163)
Transforms query parameters into data loading configuration.

**Key Logic**:
1. Extract timeRange or time filter from query
2. Convert to year/month format
3. Generate monthsToLoad array for date ranges
4. Map view types to data scopes
5. Return configuration object

**View Configs** (Lines 123-144):
```javascript
{
  'orders': {
    scope: 'orders',
    groupBy: false,
    aggregation: 'none'
  },
  'line_items': {
    scope: 'line_items',
    groupBy: ['product_name', 'color', 'size'],
    aggregation: 'sum'
  },
  'grouped': {
    scope: 'line_items',
    groupBy: query.groupBy || false,
    aggregation: query.groupBy ? 'sum' : 'none'
  }
}
```

**loadAnalyticsData** (Lines 168-414)
**THE MAIN DATA LOADING FUNCTION** - Replaces useAnalyticsQueryWithVerification.

**Algorithm**:

1. **Validation** (Lines 173-186)
   - Check if year/month provided
   - Return empty state if not

2. **Orders Scope** (Lines 191-241)
   - Load orders from all months in date range
   - Filter by date range if provided
   - Parse dates: "Aug 1, 2025, 5:24 PM PDT"
   - Return filtered orders

3. **Line Items Scope with Date Filter** (Lines 244-327)
   - **Step 1**: Load orders from all months
   - **Step 2**: Filter orders by date range
   - **Step 3**: Extract order IDs from filtered orders
   - **Step 4**: Load line items from all months
   - **Step 5**: Filter line items by order IDs
   - **Step 6**: Enrich line items with order data
   - Result: Line items from orders in date range

4. **Line Items Scope without Date Filter** (Lines 329-381)
   - Load ALL orders from AVAILABLE_MONTHS
   - Load ALL line items from AVAILABLE_MONTHS
   - Enrich line items with order data
   - Result: Complete dataset

5. **Transform to Table** (Lines 385)
   ```javascript
   const table = toTable(rawData, config.tableOptions)
   ```

6. **Return** (Lines 387-397)
   ```javascript
   {
     table,
     rawData,
     loading: false,
     error: null,
     meta: table.meta,
     needsVerification: false,
     discoveredProducts: [],
     processVerification: () => {},
     cancelVerification: () => {}
   }
   ```

**AVAILABLE_MONTHS** (Lines 419-423)
```javascript
[
  { year: '2023', months: ['10', '11', '12'] },
  { year: '2024', months: ['01', '02', ..., '12'] },
  { year: '2025', months: ['01', '02', ..., '08'] }
]
```

**loadAllTimeLineItemsData** (Lines 429-460)
Loads all available line items across all months.
Used by Discovery page for product search.

**loadAllTimeProductData** (Lines 467-495)
Loads line items for specific products across all time.

**Algorithm**:
1. Load all line items
2. Filter for EXACT product name matches
3. No fuzzy matching, no splitting
4. Return filtered data

---

## MULTIVARIABLE ANALYSIS SYSTEM

### Directory: `components/module/table/assignment/multivariable/`

System for coupled pairs analysis.

---

### File: **primaryMetrics.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/module/table/assignment/multivariable/primaryMetrics.js`
**Lines**: 129

#### **Purpose**
Table 1 template: Primary metrics analysis (Quantity, Net Revenue).

#### **Function: generatePrimaryMetricsTable** (Lines 16-86)

**Parameters**:
```javascript
{
  sampleSize = 10,
  sortBy = 'quantity',
  sortDirection = 'desc'
}
```

**Algorithm**:
1. Group line items by product_name
2. Calculate metrics for each product:
   - quantity: Sum of quantity field
   - discounted_price: Sum of (quantity * discounted_price)
3. Sort by selected metric
4. Limit to sample size
5. Calculate totals
6. Return table props

**Return**:
```javascript
{
  rows: [
    {_rowId, product_name, product_title, quantity, discounted_price}
  ],
  totals: {quantity, discounted_price},
  columnKeys: ['product_name', 'quantity', 'discounted_price'],
  columnLabels: {product_name: 'Product', quantity: 'Units', discounted_price: 'Net'},
  columnWidths: {...},
  fixedColumns: ['product_name'],
  scrollingColumns: ['quantity', 'discounted_price'],
  layout: MODULE_LAYOUT,
  styles: {}
}
```

**getProductsForPairing** (Lines 119-128)
Extracts products from table for pairing:
```javascript
return tableProps.rows.map(row => ({
  product_name: row.product_name,
  product_title: row.product_title || row.product_name,
  quantity: row.quantity,
  discounted_price: row.discounted_price
}))
```

---

### File: **secondaryMetrics.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/module/table/assignment/multivariable/secondaryMetrics.js`
**Lines**: 135

#### **Purpose**
Table 2 template: Secondary metrics analysis (Attach Rate, Velocity).

#### **Function: generateSecondaryMetricsTable** (Lines 16-92)

**Parameters**:
```javascript
{
  sampleSize = 10,
  sortBy = 'attach_rate',
  sortDirection = 'desc',
  dateRange = null,
  referenceProducts = null  // <-- FROM TABLE 1
}
```

**Algorithm**:
1. Group line items by product_name
2. Calculate metrics for each product:
   - **attach_rate**: `calculateAttachRate(lineItems, productName, referenceProducts)`
     - How often this product appears with Table 1 products
     - Returned as percentage (0-100)
   - **velocity**: `calculateVelocity(items, dateRange)`
     - Orders per day
3. Sort by selected metric
4. Limit to sample size
5. Calculate averages for totals
6. Return table props

**Key Insight**: Attach rate is calculated **relative to Table 1 products**, not general attach rate.

**Return**:
```javascript
{
  rows: [
    {_rowId, product_name, product_title, attach_rate, velocity}
  ],
  totals: {attach_rate: avgAttachRate, velocity: avgVelocity},
  columnKeys: ['product_name', 'attach_rate', 'velocity'],
  columnLabels: {product_name: 'Product', attach_rate: 'Attach %', velocity: 'Velocity'},
  columnWidths: {...},
  fixedColumns: ['product_name'],
  scrollingColumns: ['attach_rate', 'velocity'],
  layout: MODULE_LAYOUT,
  styles: {}
}
```

---

### File: **coupledPairs.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/module/table/assignment/multivariable/coupledPairs.js`
**Lines**: 163

#### **Purpose**
Table 3 template: Coupled pairs analysis.

#### **Function: generateCoupledPairsTable** (Lines 21-110)

**Parameters**:
```javascript
{
  products1,        // From Table 1
  products2,        // From Table 2
  lineItems,        // All line items
  options: {
    sampleSize = 10,
    sortBy = 'compound',
    sortDirection = 'desc',
    dateRange = null,
    weights = null
  }
}
```

**Algorithm**:
1. **Generate Pairs**: `generatePairs(products1, products2)`
   - Cartesian product: Table 1 × Table 2
   - Exclude self-pairs (productA !== productB)

2. **Calculate Metrics**: `calculateMetricsForPairs(pairs, lineItems, dateRange)`
   - For each pair, calculate:
     - orders_together: Orders containing both products
     - net_together: Revenue from those orders
     - bundle_rate: How often they appear together vs. separately
     - velocity_together: Orders per day with both products

3. **Rank Pairs**: `rankPairsByCompoundScore(pairsWithMetrics, weights)`
   - Calculates compound score from all metrics
   - Default weights: Equal weighting

4. **Get Top Pairs**: `getTopPairs(rankedPairs, sampleSize)`
   - Sort by compound score
   - Take top N pairs

5. **Build Nested Rows**: `buildNestedRowsForPair(pair, rankedPairs)`
   - For expandable row content
   - Shows related pairs

6. **Calculate Totals**: Aggregate metrics

7. **Return Table Props**

**Return**:
```javascript
{
  rows: [
    {
      _rowId,
      product_a, product_b,
      orders_together, net_together,
      bundle_rate, velocity_together,
      compound_score,
      _pairData: pair,
      _allPairs: rankedPairs,
      nestedRows: [...]
    }
  ],
  totals: {...},
  columnKeys: ['product_a', 'product_b', ...],
  columnLabels: {...},
  columnWidths: {...},
  fixedColumns: ['product_a', 'product_b'],
  scrollingColumns: ['orders_together', 'net_together', 'bundle_rate', 'velocity_together', 'compound_score'],
  layout: MODULE_LAYOUT,
  styles: {}
}
```

---

### File: **pairGeneration.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/module/table/assignment/multivariable/pairGeneration.js`
**Lines**: 49

#### **Function: generatePairs** (Lines 12-30)

**Algorithm**:
```javascript
const pairs = []
for (const p1 of products1) {
  for (const p2 of products2) {
    if (p1.product_name !== p2.product_name) {
      pairs.push({productA: p1, productB: p2})
    }
  }
}
return pairs
```

**Example**:
- Table 1: [A, B, C]
- Table 2: [X, Y, Z]
- Pairs: [A-X, A-Y, A-Z, B-X, B-Y, B-Z, C-X, C-Y, C-Z]
- Total: 3 × 3 = 9 pairs

---

### File: **pairMetrics.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/components/module/table/assignment/multivariable/pairMetrics.js`
**Lines**: 114

#### **Function: calculateCoupledMetrics** (Lines 15-45)

**Algorithm**:
1. Get product names: `[productA.name, productB.name]`
2. Find orders with both: `findOrdersWithProducts(lineItems, productNames)`
   - Uses aggregations.js function
   - Returns Set of order IDs
3. Filter line items to matching orders
4. Calculate metrics:
   - **ordersTogether**: `pairOrders.size`
   - **netTogether**: `sumField(pairLineItems, 'net')`
   - **bundleRate**: `calculateBundleRate(pair, pairOrders, lineItems)`
   - **velocityTogether**: `calculatePairVelocity(pairOrders.size, dateRange)`

**calculateBundleRate** (Lines 55-76)
```javascript
// Count orders with product A
const ordersWithA = new Set(
  allLineItems
    .filter(item => item.product_name === productA.name)
    .map(item => item.order_id)
)

// Count orders with product B
const ordersWithB = new Set(
  allLineItems
    .filter(item => item.product_name === productB.name)
    .map(item => item.order_id)
)

// Total appearances of either product
const totalAppearances = ordersWithA.size + ordersWithB.size

// Bundle rate = pair orders / total appearances
return pairOrders.size / totalAppearances
```

**Interpretation**:
- 0.0 = Never together
- 0.5 = Half the time
- 1.0 = Always together (impossible in practice)

**calculatePairVelocity** (Lines 84-99)
```javascript
if (dateRange?.days) {
  return orderCount / dateRange.days
}
// Or calculate from date range object
```

---

## UTILITIES

### File: **tableSorting.js**
**Location**: `/Users/benjamindurazzo/retail-ops-app/src-new/core/utils/tableSorting.js`
**Lines**: 257

#### **Purpose**
Sophisticated sorting system with special handling for sizes, dates, numbers, and strings.

#### **Size Sorting Hierarchy** (Lines 7-13)
```
1. Number sizes (30 < 30x30 < 30x32 < 32x30)
2. Letter sizes (XS < S < M < L < XL < XXL < XXXL)
3. "One Size"
4. "OS" (One Size abbreviation)
5. Everything else (alphabetical)
6. "Custom" (absolute last)
```

**parseSize** (Lines 21-60)
Categorizes and creates sort key:
```javascript
// Example: "30x32" → {category: 1, value: "30X32", sortKey: "030_032"}
// Example: "XL" → {category: 2, value: "XL", sortKey: "04"}
// Example: "Custom" → {category: 6, value: "CUSTOM", sortKey: "zzz"}
```

**compareSizes** (Lines 65-78)
```javascript
// First compare by category
if (sizeA.category !== sizeB.category) {
  return sizeA.category - sizeB.category
}
// Within same category, compare by sortKey
return sizeA.sortKey < sizeB.sortKey ? -1 : 1
```

**getColumnType** (Lines 83-117)
Determines column data type:
- 'size': If column name contains "size"
- 'date': If column name contains "date" or "time"
- 'number': If values are numeric
- 'string': Default

**sortTableRows** (Lines 185-203)
Main sorting function:
```javascript
export function sortTableRows(rows, columnKey, direction = 'asc') {
  const columnType = getColumnType(rows, columnKey)
  return [...rows].sort((a, b) =>
    compareValues(a[columnKey], b[columnKey], columnType, direction)
  )
}
```

**getNextSortState** (Lines 212-226)
3-state cycle:
```javascript
if (currentKey !== newKey) {
  return {sortKey: newKey, sortDirection: 'desc'}  // New column: start desc
} else {
  if (currentDirection === 'desc') {
    return {sortKey: newKey, sortDirection: 'asc'}  // Toggle to asc
  } else if (currentDirection === 'asc') {
    return {sortKey: null, sortDirection: null}     // Toggle to unsorted
  } else {
    return {sortKey: newKey, sortDirection: 'desc'} // Back to desc
  }
}
```

---

## INTEGRATION MAP

### Component Dependencies

```
TableContainer (THE CORE)
  ├─ Used by: CustomTableWorkspace, NestedTable
  ├─ Provides: tableContext
  └─ Manages: Scroll sync refs

Section Components (A1, A2, A3, B1, B2, B3)
  ├─ Used by: CustomTableWorkspace, NestedTable
  ├─ Receive: tableContext
  └─ Render: Channel components

Channel Components (ChA1, ChA2, ChB1, ChB2)
  ├─ Used by: Section components
  ├─ Wrap: Cell/header content
  └─ Provide: Interactive toolbars

Templates (defaultTable, multivariableTable)
  ├─ Used by: Pages via tableConfig.applyTemplate
  ├─ Receive: Raw data
  └─ Return: Table props

dataService
  ├─ Used by: Pages
  ├─ Loads: CSV files
  └─ Returns: {table, rawData, meta}

calculations/operations/aggregations
  ├─ Used by: Templates, dataConfig
  ├─ Provides: sumField, groupBy, calculateAttachRate, etc.
  └─ Core: Business logic

schemaRegistry
  ├─ Used by: tableConfig, templates
  ├─ Provides: Field labels, numeric fields
  └─ Source: retail_line_items.schema.json
```

### Data Flow Map

```
CSV Files (/data/retail/orders/{year}/{month}/)
  ↓ loadCSVData()
dataService.loadAnalyticsData()
  ↓ toTable()
{table, rawData, meta}
  ↓ passed to Page
Page Component
  ↓ passes to TableWorkspace
TableWorkspace
  ↓ applyTemplate(data, template)
Template (e.g., multivariableTable)
  ↓ calls generators
Metric Generators (primaryMetrics, secondaryMetrics, coupledPairs)
  ↓ use aggregations
calculations/operations/aggregations
  ↓ returns metrics
Template
  ↓ returns tableProps
applyTemplate
  ↓ normalizes
TableContainer
  ↓ provides tableContext
Section Components
  ↓ render with Channel components
DOM
```

---

## CRITICAL SYSTEMS

### 1. Scroll Synchronization Engine

**Location**: `TableContainer.jsx` lines 86-131
**Critical Level**: ⭐⭐⭐⭐⭐ (DO NOT REMOVE)

**Components**:
- Refs: vScrollRef, hTopRef, hBottomRef, b1TrackRef, b2TrackRef
- Effect: Scroll synchronization
- Functions: syncTracks, onBottomScroll, onHorizontalWheel

**Why Critical**:
- Enables horizontal scrolling across 3 sections
- No visible scroll bars on B1/B2
- Single scroll bar on B3 drives everything
- GPU-accelerated transforms
- Handles wheel events on all sections

**Dependencies**:
- B1, B2, B3 sections must attach refs
- Transform-based positioning

**If Removed**: Tables will not scroll horizontally, or scrolling will be broken.

---

### 2. Template System

**Location**: `templates/` directory
**Critical Level**: ⭐⭐⭐⭐⭐ (CORE ARCHITECTURE)

**Components**:
- multivariableTable.js (THE WORKING TEMPLATE)
- primaryMetrics.js, secondaryMetrics.js, coupledPairs.js
- tableConfig.applyTemplate()

**Why Critical**:
- Transforms raw data into table-ready props
- Orchestrates multiple generators
- Provides consistent output format
- Powers the entire coupled pairs analysis

**Dependencies**:
- calculations/operations/aggregations.js
- tableConfig.js

**If Removed**: No way to generate tables from data.

---

### 3. Coupled Pairs Analysis

**Location**: `assignment/multivariable/` directory
**Critical Level**: ⭐⭐⭐⭐⭐ (UNIQUE FEATURE)

**Components**:
- primaryMetrics.js (Table 1: Quantity, Net)
- secondaryMetrics.js (Table 2: Attach Rate, Velocity)
- coupledPairs.js (Table 3: Pairs with compound metrics)
- pairGeneration.js (Cartesian product)
- pairMetrics.js (Coupled metrics calculation)

**Why Critical**:
- **Unique business logic**: Identifies high-potential product pairs
- **Multi-table coordination**: Table 2 attach rates relative to Table 1 products
- **Complex calculations**: Bundle rate, velocity, compound scoring

**Dependencies**:
- calculations/operations/aggregations.js (findOrdersWithProducts, calculateAttachRate)
- Line items data with order_id linkage

**If Removed**: Loses entire coupled pairs analysis capability - the core feature of this system.

---

### 4. Data Service

**Location**: `services/dataService.js`
**Critical Level**: ⭐⭐⭐⭐⭐ (DATA PIPELINE)

**Components**:
- loadLineItemsData()
- loadOrdersData()
- loadAnalyticsData() (MAIN FUNCTION)
- loadAllTimeProductData()

**Why Critical**:
- Loads CSV files from /data/retail/
- Handles date filtering
- Enriches line items with order data
- Powers all data-dependent features

**Dependencies**:
- config/tableConfig.js (loadCSVData, toTable)
- CSV files in correct format

**If Removed**: No data, no tables.

---

### 5. Calculations System

**Location**: `calculations/operations/aggregations.js`
**Critical Level**: ⭐⭐⭐⭐⭐ (BUSINESS LOGIC)

**Components**:
- sumField, groupBy, filterByValue (basic operations)
- findOrdersWithProducts (coupled pairs foundation)
- calculateAttachRate (relative attach rate)
- calculateVelocity (sales velocity)

**Why Critical**:
- **Reusable business logic**: Used by all templates
- **Coupled pairs foundation**: Unique algorithms
- **Testable**: Isolated from UI

**Dependencies**:
- calculations/math/ (basic, statistical, financial)

**If Removed**: Templates cannot calculate metrics, coupled pairs analysis broken.

---

### 6. Section Components

**Location**: `components/custom/table/sections/`
**Critical Level**: ⭐⭐⭐⭐ (RENDERING LAYER)

**Components**:
- A1, A2, A3 (Fixed sections)
- B1, B2, B3 (Scrolling sections)

**Why Critical**:
- Actual rendering of table data
- Attach refs for scroll sync
- Handle styling and layouts
- Support plugin rows

**Dependencies**:
- TableContainer (tableContext)
- Channel components (ChA1, ChA2, ChB1, ChB2)

**If Removed**: Tables render nothing.

---

## SAFE TO REMOVE

### 1. C/D Table Sections

**Location**: `components/custom/table/sections/C/` and `sections/D/`
**Status**: ❌ NOT USED

**Evidence**:
- No imports of C1, C2, C3, D1, D2, D3 components
- CustomTableWorkspace only renders A2
- NestedTable only renders A/B sections
- C/D styles exist in tableProps.js but unused

**Recommendation**: DELETE entire C/ and D/ directories

---

### 2. Unused Templates

**Location**: `templates/`
**Status**: ❌ NOT USED (except multivariableTable)

**Files**:
- metricTable.js
- modularTable.js
- performanceTable.js
- productTable.js
- trendTable.js

**Evidence**:
- Only multivariableTable.js is imported and used
- Others are not referenced anywhere
- tableConfig.getTableConfig() has commented-out template registry

**Recommendation**: DELETE unused template files, keep only:
- defaultTable.js (provides empty grid)
- multivariableTable.js (THE WORKING TEMPLATE)

---

### 3. Plugin System (Partially Built)

**Location**: `components/plugins/`
**Status**: ⚠️ INCOMPLETE

**Files**:
- PluginController.jsx
- PluginDropdown.jsx
- PluginInsert.jsx
- PluginMode.jsx
- PluginPanel.jsx
- PluginSend.jsx
- PluginToolbar.jsx
- buttons/PluginButton.jsx
- default/table/ (CellPlugin, ColumnPlugin, RowPlugin, TablePlugin)
- panels/ (11 panel components)

**Evidence**:
- TablePlugin.jsx is imported by CustomTableWorkspace
- Other plugin files not used
- Plugin panel components exist but no routing
- Incomplete implementation

**Recommendation**:
- KEEP: TablePlugin.jsx (used for nested tables)
- DELETE: Everything else in plugins/ directory
- Plugin system was ambitious but incomplete

---

### 4. Visualization Components

**Location**: `components/visualization/`
**Status**: ❌ NOT USED

**Files**:
- CellToolbar.jsx
- DataTable.jsx
- DataToolbar.jsx
- DataView.jsx
- GroupTable.jsx
- OrderGroup.jsx
- ProductGroup.jsx
- index.js

**Evidence**:
- No imports of these components
- Not part of table rendering flow
- Likely old implementation

**Recommendation**: DELETE entire visualization/ directory

---

### 5. Unused Hooks

**Location**: `hooks/`
**Status**: ⚠️ CHECK USAGE

**Files**:
- useDragDrop.js
- useProductSearch.js
- useViewModeTransition.js

**Evidence**:
- Not imported in core table system
- May be used by pages outside src-new/core
- Need to check page-level usage

**Recommendation**: Check page imports, then potentially DELETE

---

### 6. Empty/Unused Configs

**Location**: `config/`
**Status**: ⚠️ CHECK USAGE

**Files**:
- dataConfig.js (different from components/custom/table/dataConfig.js)
- orderConfig.js
- pluginConfig.js

**Evidence**:
- Not imported in core table flow
- May be used by pages

**Recommendation**: Check page imports, then potentially DELETE

---

### 7. Switchboard Component

**Location**: `components/module/Switchboard.jsx`
**Status**: ❌ NOT USED

**Evidence**:
- Not imported anywhere
- Appears to be incomplete

**Recommendation**: DELETE

---

### 8. MetricTable Component

**Location**: `components/module/table/MetricTable.jsx`
**Status**: ❌ NOT USED

**Evidence**:
- Not imported anywhere
- Separate from table system

**Recommendation**: DELETE

---

### 9. Table Container Components

**Location**: `components/module/table/container/`
**Status**: ❌ NOT USED

**Files**:
- TableBody.jsx
- TableController.jsx
- TableFooter.jsx
- TableHeader.jsx
- TableToolbar.jsx
- TableWorkspace.jsx

**Evidence**:
- Not imported (different from custom/table/TableContainer)
- Appears to be old implementation
- Custom table system uses its own TableContainer

**Recommendation**: DELETE entire container/ directory

---

### 10. tableOperator.js

**Location**: `components/module/table/tableOperator.js`
**Status**: ❌ NOT USED

**Evidence**:
- Not imported anywhere

**Recommendation**: DELETE

---

## FILE USAGE SUMMARY

### ESSENTIAL FILES (DO NOT REMOVE)

#### Core Table System
- ✅ `components/custom/table/TableContainer.jsx` - Scroll sync engine
- ✅ `components/custom/table/CustomTableWorkspace.jsx` - Working example
- ✅ `components/custom/table/NestedTable.jsx` - Complete table renderer
- ✅ `components/custom/table/dataConfig.js` - Data utilities
- ✅ `components/custom/table/tableConfig.js` - Template orchestration
- ✅ `components/custom/table/tableProps.js` - Styles, layouts, utilities

#### Section Components
- ✅ `components/custom/table/sections/A/A1.jsx`
- ✅ `components/custom/table/sections/A/A2.jsx`
- ✅ `components/custom/table/sections/A/A3.jsx`
- ✅ `components/custom/table/sections/B/B1.jsx`
- ✅ `components/custom/table/sections/B/B2.jsx`
- ✅ `components/custom/table/sections/B/B3.jsx`

#### Templates
- ✅ `components/custom/table/templates/defaultTable.js`
- ✅ `components/custom/table/templates/multivariableTable.js`

#### Channel Components
- ✅ `components/module/table/channel/ChA1.jsx`
- ✅ `components/module/table/channel/ChA2.jsx`
- ✅ `components/module/table/channel/ChB1.jsx`
- ✅ `components/module/table/channel/ChB2.jsx`

#### Multivariable Analysis
- ✅ `components/module/table/assignment/multivariable/primaryMetrics.js`
- ✅ `components/module/table/assignment/multivariable/secondaryMetrics.js`
- ✅ `components/module/table/assignment/multivariable/coupledPairs.js`
- ✅ `components/module/table/assignment/multivariable/pairGeneration.js`
- ✅ `components/module/table/assignment/multivariable/pairMetrics.js`
- ✅ `components/module/table/assignment/multivariable/compoundRanking.js`
- ✅ `components/module/table/assignment/multivariable/nestedRowBuilder.js`

#### Data & Services
- ✅ `services/dataService.js`
- ✅ `services/calculationService.js`
- ✅ `services/dragDropService.js`

#### Calculations
- ✅ `calculations/operations/aggregations.js`
- ✅ `calculations/math/basic.js`
- ✅ `calculations/math/statistical.js`
- ✅ `calculations/math/financial.js`
- ✅ `calculations/business/inventory.js`
- ✅ `calculations/business/orders.js`
- ✅ `calculations/business/revenue.js`
- ✅ `calculations/kpis/efficiency.js`
- ✅ `calculations/kpis/performance.js`
- ✅ `calculations/index.js`

#### Configuration
- ✅ `config/schemaRegistry.js`
- ✅ `config/tableConfig.js`

#### Utilities
- ✅ `utils/tableSorting.js`
- ✅ `utils/timezoneConverter.js`
- ✅ `utils/dragDropTypes.js`
- ✅ `utils/searchTerms.js`

#### Plugins (Minimal)
- ✅ `components/plugins/default/table/TablePlugin.jsx` - Used for nested tables

### REMOVABLE FILES (SAFE TO DELETE)

#### Unused Sections
- ❌ `components/custom/table/sections/C/` (entire directory)
- ❌ `components/custom/table/sections/D/` (entire directory)

#### Unused Templates
- ❌ `components/custom/table/templates/metricTable.js`
- ❌ `components/custom/table/templates/modularTable.js`
- ❌ `components/custom/table/templates/performanceTable.js`
- ❌ `components/custom/table/templates/productTable.js`
- ❌ `components/custom/table/templates/trendTable.js`

#### Unused Plugin System
- ❌ `components/plugins/` (entire directory except TablePlugin.jsx)
- ❌ `components/plugins/PluginController.jsx`
- ❌ `components/plugins/PluginDropdown.jsx`
- ❌ `components/plugins/PluginInsert.jsx`
- ❌ `components/plugins/PluginMode.jsx`
- ❌ `components/plugins/PluginPanel.jsx`
- ❌ `components/plugins/PluginSend.jsx`
- ❌ `components/plugins/PluginToolbar.jsx`
- ❌ `components/plugins/buttons/`
- ❌ `components/plugins/panels/`

#### Unused Components
- ❌ `components/visualization/` (entire directory)
- ❌ `components/module/Switchboard.jsx`
- ❌ `components/module/table/MetricTable.jsx`
- ❌ `components/module/table/container/` (entire directory)
- ❌ `components/module/table/tableOperator.js`
- ❌ `components/SortToolbar.jsx`

#### Potentially Unused (Check Page Usage)
- ⚠️ `hooks/useDragDrop.js`
- ⚠️ `hooks/useProductSearch.js`
- ⚠️ `hooks/useViewModeTransition.js`
- ⚠️ `config/dataConfig.js` (not the one in custom/table/)
- ⚠️ `config/orderConfig.js`
- ⚠️ `config/pluginConfig.js`

---

## ARCHITECTURE SUMMARY

### What Works

**1. Scroll Sync Engine** ⭐⭐⭐⭐⭐
- Transform-based synchronization
- GPU-accelerated
- Smooth 60fps scrolling
- Handles wheel events correctly

**2. Multi-Table Template System** ⭐⭐⭐⭐⭐
- Generates 3 coordinated tables
- Table 2 attach rates relative to Table 1
- Coupled pairs from Table 1 × Table 2
- Clean separation of concerns

**3. Coupled Pairs Analysis** ⭐⭐⭐⭐⭐
- Unique business logic
- Bundle rate calculation
- Compound scoring
- Expandable nested rows

**4. Data Pipeline** ⭐⭐⭐⭐
- Loads CSV files
- Filters by date range
- Enriches line items with orders
- Handles multi-month ranges

**5. Calculation Library** ⭐⭐⭐⭐⭐
- Reusable pure functions
- Testable business logic
- Well-organized by domain

### What Doesn't Work

**1. CustomTableWorkspace** ⚠️
- Only renders A2 section
- Missing A1, A3, B1, B2, B3
- Incomplete implementation

**2. Plugin System** ⚠️
- Ambitious design
- Incomplete implementation
- Only TablePlugin actually used

**3. C/D Table Sections** ❌
- Built but never used
- No integration with any component

**4. Visualization Components** ❌
- Old implementation
- Not integrated with current system

### Design Patterns

**1. Context Propagation**
- TableContainer creates tableContext
- All children receive via props
- Enables ref coordination

**2. Section Composition**
- A/B sections for fixed/scrolling split
- 1/2/3 sections for header/body/footer
- Reusable across templates

**3. Channel Wrapping**
- Channel components wrap cells
- Add interactive toolbars
- Support plugin integration

**4. Template Generation**
- Templates transform data → table props
- Generators for each table type
- Consistent output format

**5. Facade Pattern**
- dataConfig.js facades calculations
- Simplified interface for templates
- Hides complexity

---

## RECOMMENDATIONS

### Immediate Actions

1. **DELETE unused code** (estimated 40% of codebase):
   - C/D sections
   - Unused templates
   - Plugin system (except TablePlugin)
   - Visualization components
   - Old container components

2. **FIX CustomTableWorkspace**:
   - Add missing sections (A1, A3, B1, B2, B3)
   - Or mark as demo/incomplete

3. **DOCUMENT critical systems**:
   - Scroll sync engine
   - Template orchestration
   - Coupled pairs analysis

### Future Enhancements

1. **Complete Plugin System** (if needed):
   - Finish panel routing
   - Implement drag-and-drop
   - Add plugin registry

2. **Add Tests**:
   - Calculation functions (pure, easy to test)
   - Template generators
   - Data service

3. **Performance Optimization**:
   - Virtualize long tables
   - Memoize expensive calculations
   - Optimize re-renders

4. **Error Handling**:
   - Add error boundaries
   - Handle missing data gracefully
   - Validate CSV formats

---

## CONCLUSION

The `src-new/core` codebase contains a sophisticated table system with a working scroll sync engine and unique coupled pairs analysis. However, approximately **40% of the code is unused** and can be safely removed.

**Core Strengths**:
- ⭐ Transform-based scroll synchronization
- ⭐ Multi-table template system
- ⭐ Coupled pairs business logic
- ⭐ Modular calculation library

**Major Issues**:
- ❌ Incomplete CustomTableWorkspace
- ❌ Unused C/D sections
- ❌ Incomplete plugin system
- ❌ Old visualization components

**Recommended Actions**:
1. Delete ~40% unused code
2. Fix or document incomplete features
3. Add tests for critical systems
4. Document scroll sync engine

**The working system** (multivariableTable + NestedTable + TableContainer + sections A/B + calculations) is solid and production-ready. Focus on this path and remove the unused/incomplete code.

---

**End of Analysis**

Total Words: ~15,000
Total Lines: ~5,000
Files Analyzed: 103
Essential Files: 62
Removable Files: 41
