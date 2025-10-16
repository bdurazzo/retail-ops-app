# Table Channel System Migration Plan
**Date:** 2025-10-14

## Overview
Migrating from direct cell plugin rendering to a clean channel-based system where table sections are "dumb" layout components and Ch* channels handle all interactive behavior.

## Architecture Vision

### Data Flow (NEW)
```
PluginController
  ↓ (props)
TableController
  ↓ (props via tableContext)
TableHeader/TableBody/TableFooter (container layer - state & logic)
  ↓ (props)
A*/B* Sections (layout layer - dumb mapping)
  ↓ (props)
Ch* Channels (UI layer - interactive components with ChannelStrip)
```

### Responsibilities

**PluginController**
- Query builder panel
- Manages plugin configuration slots (product, metric, time, etc.)
- Sends configuration to TableController

**TableController**
- State management hub for table + plugin system
- Houses PluginToolbar (drag palette) and TableToolbar
- Receives props from PluginController
- Passes configuration through tableContext to container layer

**Container Layer** (TableHeader, TableBody, TableFooter)
- Manages state (columnState, cellState, expandedRows)
- Coordinates between sections
- Passes props to A*/B* sections
- **NEW:** Will receive plugin props from TableController instead of managing internally

**Section Layer** (A1, A2, B1, B2, etc.)
- **"Dumb" components** - no business logic
- Only responsibility: map columnKeys and rows to layout
- Render Ch* channels for each cell/column
- Handle layout-specific concerns (grid, scrolling, positioning)

**Channel Layer** (ChA1, ChA2, ChB1, ChB2)
- Wrap ChannelStrip for interactive behavior
- Receive props from sections
- Handle cell/column-specific UI (labels, buttons, toolbars)
- ChannelStrip provides hover toolbar, drag/drop, visual feedback

## What Needs to be Removed (OLD SYSTEM)

### From TableHeader.jsx (lines 23-40, 52-54)
```javascript
// REMOVE: Internal plugin state management
const [columnState, setColumnState] = useState({});
const handleColumnDrop = (columnKey, droppedData) => { ... };
const handleColumnStateUpdate = (columnKey, data) => { ... };

// REMOVE: pluginComponents prop
pluginComponents: {
  column: ColumnPlugin
}
```

### From TableBody.jsx (lines 28-80, 95-98, 114-117)
```javascript
// REMOVE: Internal plugin state management
const [cellState, setCellState] = useState({});
const handleCellDrop = (rowId, columnKey, droppedData) => { ... };
const handleCellStateUpdate = (cellKey, data) => { ... };

// REMOVE: Plugin checking functions
const hasTablePlugin = (row) => { ... };
const hasRowPlugin = (row) => { ... };
const getPluginData = (row) => { ... };

// REMOVE: pluginComponents prop
pluginComponents: {
  table: TablePlugin,
  row: RowPlugin
}
```

### From Sections (A1, A2, B1, B2)

**A1.jsx (lines 115-117, 86-113)**
```javascript
// REMOVE: Plugin component checking
const columnData = columnState[columnKey];
const ColumnPluginComponent = columnData?.type && pluginComponents?.[columnData.type];

// REMOVE: Plugin drop handlers
const handleColumnPluginDrop = (e) => { ... };
const handleColumnDragOver = (e) => { ... };

// REMOVE: Conditional plugin rendering logic
const baseClasses = ColumnPluginComponent
  ? (styles.pluginCell || styles.base || "")
  : isPlaceholder ? ...
```

**A2.jsx (lines 162-163, 174-181)**
```javascript
// REMOVE: Plugin component lookup
const PluginComponent = cellData?.type && pluginComponents?.[cellData.type];

// REMOVE: Cell drop handlers
const handleDrop = (e) => { ... };
const handleDragOver = (e) => { ... };
```

**B1.jsx (lines 102-104, 86-100, 106-111)**
```javascript
// REMOVE: Plugin component checking
const columnData = columnState[columnKey];
const ColumnPluginComponent = columnData?.type && pluginComponents?.[columnData.type];

// REMOVE: Plugin drop handlers
const handleColumnPluginDrop = (e) => { ... };
const handleColumnDragOver = (e) => { ... };

// REMOVE: Conditional plugin cell classes
const baseClasses = ColumnPluginComponent
  ? (styles.pluginCell || styles.base || "")
  : isPlaceholder ? ...
```

**B2.jsx (lines 176-181, 160-173, 77-80)**
```javascript
// REMOVE: Plugin component lookup
const PluginComponent = cellData?.type && pluginComponents?.[cellData.type];

// REMOVE: Cell drop handlers
const handleDrop = (e) => { ... };
const handleDragOver = (e) => { ... };

// REMOVE: Plugin row skipping logic
if (row && row._selectPlugin) {
  return null;
}
```

### Props to Remove from Section Interfaces
```javascript
// REMOVE from all section components:
onColumnDrop = null,
onCellDrop = null,
pluginComponents = {},
```

## What to Keep

### Ch* Channels (ChA1, ChA2, ChB1, ChB2)
- These are the NEW system
- Wrap ChannelStrip for interactive behavior
- Receive props: columnKey, columnLabel (or rowId, cellValue)
- Handle UI: labels, toolbar buttons via toolbarLeftContent/toolbarCenterContent/toolbarRightContent
- ChannelStrip provides: hover detection, toolbar overlay, drag/drop zones

### ChannelStrip Component
- Universal cell wrapper
- Provides mini toolbar on hover
- Drop zone for future drag/drop if needed
- Props: section, rowId, columnKey, allowedFilters, toolbarLeftContent, toolbarCenterContent, toolbarRightContent, noPadding

### Section Layout Responsibilities
- Grid/flex positioning
- Scroll synchronization (transform refs)
- Width/height calculations
- Alternating row colors
- Placeholder states
- Mapping columnKeys → Ch* components
- Mapping rows → Ch* components

## Migration Steps

1. **Move state management up to TableController**
   - TableController receives plugin configuration from PluginController
   - TableController manages columnState/cellState based on plugin config
   - Pass state down via tableContext

2. **Simplify TableHeader/TableBody**
   - Remove internal state management
   - Receive columnState/cellState from TableController via props
   - Pass through to sections without modification

3. **Clean up sections (A1, A2, B1, B2)**
   - Remove all plugin checking code
   - Remove drag/drop handlers
   - Remove conditional className logic based on plugins
   - Simplify to: map → render Ch* → done

4. **Update Ch* channels as needed**
   - Already wrapping ChannelStrip correctly
   - May need additional props from TableController for plugin-driven behavior

5. **Remove old plugin components**
   - ColumnPlugin.jsx (if not used elsewhere)
   - TablePlugin.jsx (if not used elsewhere)
   - RowPlugin.jsx (if not used elsewhere)

## Benefits

- **Separation of concerns**: Layout vs. interaction vs. state
- **Easier testing**: Sections are pure layout functions
- **Better performance**: No prop drilling of plugin state through sections
- **Clearer data flow**: Props flow one direction from controller
- **Channel reusability**: Ch* components can be used in other table contexts
- **Simpler sections**: Just map arrays, no complex conditional logic

## Current Status

- ✅ ChA1 integrated with ChannelStrip
- ✅ ChannelStrip accepts toolbar props for customization
- ✅ A1 section renders ChA1 correctly (with no padding wrapper)
- ⏳ Need to clean up old plugin code from all sections
- ⏳ Need to move state management to TableController
- ⏳ Need to update TableHeader/TableBody to be pure pass-through

## Files to Modify

### Core Architecture
- `src-new/core/components/module/table/container/TableController.jsx`
- `src-new/core/components/module/table/container/TableHeader.jsx`
- `src-new/core/components/module/table/container/TableBody.jsx`

### Sections (Clean up)
- `src-new/core/components/custom/table/sections/A/A1.jsx`
- `src-new/core/components/custom/table/sections/A/A2.jsx`
- `src-new/core/components/custom/table/sections/B/B1.jsx`
- `src-new/core/components/custom/table/sections/B/B2.jsx`
- (Also C* and D* sections if they exist)

### Channels (Already good)
- `src-new/core/components/module/table/channel/ChA1.jsx` ✅
- `src-new/core/components/module/table/channel/ChA2.jsx`
- `src-new/core/components/module/table/channel/ChB1.jsx`
- `src-new/core/components/module/table/channel/ChB2.jsx`

### Shared Components
- `src-new/components/ChannelStrip.jsx` ✅

## Notes

- Old plugin system had cells/columns directly render plugin components
- New system has TableController receive config and pass to channels via props
- ChannelStrip is the universal wrapper - provides consistent UX across all cells
- Sections remain layout-only, which makes them highly testable and maintainable
