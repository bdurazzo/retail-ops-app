# Custom Table Architecture: Comprehensive Audit Report

**Report Date:** October 7, 2025
**System Version:** Current (src-new/core/components/custom/table/)
**Audit Focus:** Architecture, Data Flow, Modularity, Refactoring Strategy

---

## Executive Summary

The custom table system is a sophisticated, scroll-synchronized table architecture built on a **pure UI sections pattern**. The system separates data transformation (templates) from UI rendering (sections) through a well-defined flow: `dataService → template → tableConfig → TableContainer → Sections`.

**Key Strengths:**
- Elegant scroll synchronization (B3 owns scrollbar, syncs B1/B2 via transform)
- Clean separation: data transformation vs UI rendering
- Proven A/B split architecture (fixed vs scrolling columns)
- Slot-based component pattern for flexible composition
- Foundation for C/D nested tables exists

**Current Gaps:**
- Sections are **tightly coupled** to specific data structures
- No "canvas" pattern for sections to accept arbitrary content
- Templates and sections need explicit coordination
- MODULE_STYLES and MODULE_LAYOUT exist but not fully integrated
- Missing abstraction layer for truly modular, drag-and-drop table building

**Vision Alignment:**
The current system is 60% toward the MODULAR_TABLE_PLAN.md vision. The foundation is solid, but sections need to become "content-agnostic canvases" to enable the drag-and-drop plugin system described in README.md.

---

## Table of Contents

1. [File Inventory & Responsibilities](#1-file-inventory--responsibilities)
2. [Data Flow Analysis](#2-data-flow-analysis)
3. [Component Architecture Diagrams](#3-component-architecture-diagrams)
4. [Pattern Documentation](#4-pattern-documentation)
5. [Current State vs Goals](#5-current-state-vs-goals)
6. [Refactoring Strategy](#6-refactoring-strategy)
7. [Implementation Roadmap](#7-implementation-roadmap)

---

## 1. File Inventory & Responsibilities

### Core Architecture Files

#### `TableContainer.jsx` (257 lines)
**Role:** Orchestrator and scroll synchronization engine

**Responsibilities:**
- Manages scroll synchronization between A and B sections
- Provides refs (vScrollRef, hTopRef, hBottomRef, b1TrackRef, b2TrackRef)
- Creates tableContext object with layout, data, styles, refs
- Propagates context to children via React.cloneElement
- Handles ResizeObserver for container width tracking
- Implements transform-based scroll sync (B3 → B1/B2)

**Key Pattern:**
```javascript
// Scroll sync effect - the heart of Table.jsx's UX
useEffect(() => {
  const syncTracks = () => {
    const x = Math.round(bottom.scrollLeft);
    const tx = `translate3d(${-x}px,0,0)`;
    if (b1Track.style.transform !== tx) b1Track.style.transform = tx;
    if (b2Track.style.transform !== tx) b2Track.style.transform = tx;
  };

  bottom.addEventListener("scroll", onBottomScroll);
  top.addEventListener("wheel", onHorizontalWheel);
}, []);
```

**Exports:**
- `TableContainer` (main orchestrator)
- `TableToolbar` (slot component)
- `TableHeader` (slot component)
- `TableBody` (slot component)
- `TableFooter` (slot component)

**Dependencies:**
- React core
- No external UI libs

---

#### `NestedTable.jsx` (121 lines)
**Role:** Pure UI component - assembles A/B sections

**Responsibilities:**
- Receives all props from parent (no state management)
- Routes columns to fixedColumns (A) vs scrollingColumns (B)
- Assembles sections A1-A3 and B1-B3 within slot components
- Passes drag/drop handlers to sections
- Manages isTransitioning state for visual feedback

**Key Pattern:**
```javascript
// Pure assembly - no logic, just composition
<TableContainer {...props}>
  <TableHeader>
    <A1Section columnKeys={fixedColumns} {...a1Props} />
    <B1Section columnKeys={scrollingColumns} {...b1Props} />
  </TableHeader>
  <TableBody>
    <A2Section columnKeys={fixedColumns} {...a2Props} />
    <B2Section columnKeys={scrollingColumns} {...b2Props} />
  </TableBody>
  <TableFooter>
    <A3Section columnKeys={fixedColumns} {...a3Props} />
    <B3Section columnKeys={scrollingColumns} {...b3Props} />
  </TableFooter>
</TableContainer>
```

**Dependencies:**
- TableContainer + slots
- All 6 A/B sections

---

#### `tableProps.js` (252 lines)
**Role:** Central utilities and style registry

**Responsibilities:**
- Alignment utilities (`getAlignmentClasses`)
- Layout constants (`DEFAULT_LAYOUT`, `MODULE_LAYOUT`)
- Style registries (`DEFAULT_STYLES`, `MODULE_STYLES`)
- Value formatting (`formatValue`)
- Column label defaults
- Plugin helper functions (shouldApplyTablePlugin, getTablePluginData)

**Key Constants:**
```javascript
DEFAULT_LAYOUT = {
  firstColWidth: 100,
  metricColWidth: 70,
  headerHeight: 35,
  rowHeight: 35,
  footerHeight: 35,
  placeholderRows: 3,
  placeholderCols: 4
}

MODULE_LAYOUT = {
  firstColWidth: 100,
  metricColWidth: 100,
  headerHeight: 35,
  rowHeight: 35,
  footerHeight: 35,
  placeholderRows: 3,
  placeholderCols: 4
}
```

**Style Pattern:**
Each section has `{ base, sortable, nonSortable, cell, classes }` structure for full customization.

**Dependencies:**
- None (pure utilities)

---

#### `tableConfig.js` (187 lines)
**Role:** Template orchestration and column routing

**Responsibilities:**
- Calls templates and routes output to TableContainer
- Column routing (routeABColumns, routeCDColumns)
- View mode column configuration (getViewModeColumns)
- Standard column labels from schema (getStandardColumnLabels)
- Column width calculation (getColumnWidths)
- Totalable column detection (getTotalableColumns)
- Template registry (extensible)

**Key Function:**
```javascript
export function applyTemplate(data = [], template = null, options = {}) {
  const templateFn = template || defaultTable;
  const templateOutput = templateFn(data, options);

  return {
    rows, totals, columnKeys, columnLabels, styles,
    layout: { /* merge template + options */ }
  };
}
```

**Dependencies:**
- Templates (defaultTable.js, etc.)
- schemaRegistry for labels
- tableProps for defaults

---

#### `dataConfig.js` (89 lines)
**Role:** Data preparation and calculation bridge

**Responsibilities:**
- Prepare data for templates (prepareDataForTemplate)
- Calculate totals (calculateTotals)
- Group data (groupDataBy)
- Filter data (filterData)
- Format values (formatValue)
- Re-exports calculation functions from calculations/index.js

**Key Pattern:**
```javascript
// Delegates to calculations folder, doesn't implement logic
export function calculateTotals(data = [], fields = []) {
  const totals = {};
  fields.forEach(field => {
    totals[field] = sumField(data, field);
  });
  return totals;
}
```

**Dependencies:**
- calculations/index.js (for all math operations)

---

### Section Files (A1-A3, B1-B3, C1-C3, D1-D3)

#### A/B Sections (Primary Table)

**A1Section** (152 lines) - Fixed Header
- Renders fixed column headers
- Handles sorting clicks
- Supports custom renderers
- Drop zone for column headers
- Placeholder support (`_placeholder` prefix)

**A2Section** (182 lines) - Fixed Body
- Renders fixed column cells
- Supports full-width plugin rows (`_selectPlugin`)
- Alternating row styling
- Cell drop zones for plugins
- Custom cell renderers

**A3Section** (97 lines) - Fixed Footer
- Renders totals for fixed columns
- Multi-column support
- Placeholder support
- Simpler than headers (no sorting)

**B1Section** (114 lines) - Scrolling Headers
- Grid-based layout (`gridTemplateColumns`)
- Transform-based scroll sync (receives b1TrackRef)
- Draggable headers (onHeaderDragStart)
- Sorting support
- Width calculated from columnWidths

**B2Section** (190 lines) - Scrolling Body
- Grid-based cell rendering
- Transform-based scroll sync (receives b2TrackRef)
- Full-width content support
- Custom cell renderers
- Value formatting (currency, decimals)

**B3Section** (98 lines) - Scrolling Footer (CRITICAL)
- **Owns horizontal scrollbar** (overflow-x-auto)
- Drives B1/B2 scroll sync via hBottomRef
- Renders totals with formatting
- Grid-based layout

#### C/D Sections (Nested Table)

**Pattern:** C/D sections mirror A/B but with:
- Different z-index layering (C higher than A)
- Smaller text sizes (11px vs 12px)
- Additional shadow effects
- Support for empty states when no columns

**Key Differences:**
- C1: No placeholder labels, uses "Drop here"
- C2: Transition opacity support via `isTransitioning`
- D1-D3: Use same refs as B1-B3 (shared scroll context)

---

### Template Files

#### `defaultTable.js` (79 lines)
**Purpose:** Empty grid with drop zones

**Output:**
```javascript
{
  rows: [{_rowId, _dropZone: true, col_0: '', col_1: '', ...}],
  totals: {col_0: 'Total'},
  columnKeys: ['col_0', 'col_1', ...],
  columnLabels: {'col_0': 'Drop Zone 1', ...},
  columnWidths: {'col_0': firstColWidth, ...},
  fixedColumns: ['col_0'],
  scrollingColumns: ['col_1', 'col_2', ...],
  styles: DEFAULT_STYLES,
  layout: { firstColWidth, metricColWidth, ... }
}
```

**Use Case:** Initial workspace for drag-and-drop table building

---

#### `productTable.js` (214 lines)
**Purpose:** Transform line items into product analysis views

**View Modes:**
- `summary`: Single row with totals
- `by-color`: Grouped by color
- `by-size`: Grouped by size
- `by-variant`: Grouped by color + size

**Key Functions:**
```javascript
transformSummaryView(rawData) → single aggregated row
transformByColorView(rawData) → rows per color
transformBySizeView(rawData) → rows per size
transformByVariantView(rawData) → rows per variant
```

**Integration:**
- Uses `getViewModeColumns` from tableConfig
- Uses `getStandardColumnLabels` from tableConfig
- Uses `getTotalableColumns` for footer calculation
- Uses `sumField` from dataConfig

---

#### `modularTable.js` (79 lines)
**Purpose:** Empty grid using MODULE_STYLES and MODULE_LAYOUT

**Differences from defaultTable:**
- Uses MODULE_STYLES (placeholder-ready styling)
- Uses MODULE_LAYOUT (100px metric columns vs 70px)
- 15 rows vs 10 rows default
- Designed for plugin system

---

#### `CustomTableWorkspace.jsx` (148 lines)
**Purpose:** Demo workspace showing complete data flow

**Features:**
- Cell state management (`cellState` object)
- Row expansion state (`expandedRows`)
- Drop handlers (handleCellDrop)
- Plugin row enhancement (shouldApplyTablePlugin)
- Template application (applyTemplate)

**Key Pattern:**
```javascript
// Enhance rows with plugin renderers
const enhancedRows = tableProps.rows.map(row => {
  if (shouldApplyTablePlugin(row, cellState)) {
    return {
      ...row,
      _selectPlugin: TablePlugin,
      _fullWidth: true,
      _pluginProps: { cellState, expandedRows, ... }
    };
  }
  return row;
});
```

---

## 2. Data Flow Analysis

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA PIPELINE                            │
└─────────────────────────────────────────────────────────────────┘

[1] DATA SOURCE
    │
    ├─→ dataService.js
    │   - loadData(timeframe, filters)
    │   - Returns: Array<lineItems>
    │
    ↓

[2] TEMPLATE TRANSFORMATION
    │
    ├─→ template(data, options)
    │   - productTable.js
    │   - defaultTable.js
    │   - modularTable.js
    │
    │   Uses: dataConfig.js for calculations
    │   - calculateTotals()
    │   - groupDataBy()
    │   - sumField()
    │
    │   Returns: {
    │     rows: Array<row>,
    │     totals: Object,
    │     columnKeys: Array<string>,
    │     columnLabels: Object,
    │     styles: Object,
    │     layout: Object
    │   }
    │
    ↓

[3] TABLE CONFIG ROUTING
    │
    ├─→ applyTemplate(data, template, options)
    │   - Calls template function
    │   - Merges layout (template + options)
    │   - Routes columns (routeABColumns)
    │
    │   Returns: {
    │     rows, totals, columnKeys, columnLabels,
    │     styles, layout,
    │     showHeader, showBody, showFooter
    │   }
    │
    ↓

[4] TABLE CONTAINER (ORCHESTRATION)
    │
    ├─→ TableContainer receives props
    │   - Creates tableContext {
    │       vScrollRef, hTopRef, hBottomRef,
    │       b1TrackRef, b2TrackRef,
    │       layout, rows, totals,
    │       columnKeys, columnLabels,
    │       styles, containerWidth
    │     }
    │
    │   - Sets up scroll sync effect
    │   - Propagates via React.cloneElement
    │
    ↓

[5] SLOT COMPONENTS
    │
    ├─→ TableHeader, TableBody, TableFooter
    │   - Receive tableContext
    │   - Clone children with tableContext
    │   - Manage visibility (showHeader, etc.)
    │
    ↓

[6] SECTION COMPONENTS
    │
    ├─→ A1, A2, A3 (Fixed columns)
    ├─→ B1, B2, B3 (Scrolling columns)
    ├─→ C1, C2, C3 (Nested fixed)
    └─→ D1, D2, D3 (Nested scrolling)

        Each section:
        - Receives tableContext
        - Extracts needed props
        - Renders UI elements
        - Applies styles
        - Handles interactions

┌─────────────────────────────────────────────────────────────────┐
│                    SCROLL SYNCHRONIZATION                        │
└─────────────────────────────────────────────────────────────────┘

ARCHITECTURE: B3 owns scrollbar, syncs B1 and B2

[Setup Phase]
    TableContainer creates refs:
    ├─→ hTopRef (B1 container)
    ├─→ hBottomRef (B3 container) ← OWNS SCROLLBAR
    ├─→ b1TrackRef (B1 inner track)
    └─→ b2TrackRef (B2 inner track)

[Runtime Phase]
    User scrolls B3 horizontally
    │
    ├─→ bottom.scrollLeft changes
    │
    ├─→ onBottomScroll event fires
    │
    ├─→ syncTracks() calculates transform
    │   const x = Math.round(bottom.scrollLeft);
    │   const tx = `translate3d(${-x}px,0,0)`;
    │
    ├─→ Apply to B1 track
    │   b1Track.style.transform = tx;
    │
    └─→ Apply to B2 track
        b2Track.style.transform = tx;

[Alternative: Wheel on B1/B2]
    User scrolls horizontally on B1 or B2
    │
    ├─→ onHorizontalWheel event (deltaX > deltaY)
    │
    ├─→ bottom.scrollLeft += e.deltaX
    │
    └─→ Triggers onBottomScroll → syncTracks()

RESULT: All three sections (B1, B2, B3) scroll in perfect sync
```

### Props Flow (TableContainer → Sections)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TABLECONTEXT PROPAGATION                      │
└─────────────────────────────────────────────────────────────────┘

TableContainer (creates context)
    │
    │  tableContext = {
    │    // Refs for scroll sync
    │    vScrollRef,
    │    hTopRef,
    │    hBottomRef,
    │    b1TrackRef,
    │    b2TrackRef,
    │
    │    // Layout from template
    │    layout: {
    │      firstColWidth: 120,
    │      metricColWidth: 80,
    │      headerHeight: 35,
    │      rowHeight: 50,
    │      footerHeight: 35
    │    },
    │
    │    // Dimensions (computed)
    │    firstColWidth,
    │    headerHeight,
    │    rowHeight,
    │    footerHeight,
    │    containerWidth,
    │
    │    // Data (from template)
    │    rows,
    │    totals,
    │    columnKeys,
    │    columnLabels,
    │
    │    // Styles (from template)
    │    styles,
    │
    │    // Visibility
    │    showHeader,
    │    showBody,
    │    showFooter,
    │
    │    // Body height
    │    maxBodyHeight
    │  }
    │
    ↓

Slot Components (TableHeader, TableBody, TableFooter)
    │
    │  Receive tableContext
    │  Clone children:
    │    React.cloneElement(child, { tableContext, ...child.props })
    │
    ↓

Section Components
    │
    ├─→ A1Section extracts:
    │   const { headerHeight, firstColWidth } = tableContext;
    │
    ├─→ B1Section extracts:
    │   const { layout, hTopRef, b1TrackRef } = tableContext;
    │
    ├─→ A2Section extracts:
    │   const { firstColWidth, rowHeight } = tableContext;
    │
    ├─→ B2Section extracts:
    │   const { layout, b2TrackRef, rowHeight } = tableContext;
    │
    ├─→ A3Section extracts:
    │   const { firstColWidth, footerHeight } = tableContext;
    │
    └─→ B3Section extracts:
        const { layout, hBottomRef, footerHeight } = tableContext;
```

### Row Rendering Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROW RENDERING FLOW                            │
└─────────────────────────────────────────────────────────────────┘

Template Output
    │
    ├─→ rows: [
    │     { product_name: 'Widget', quantity: 10, revenue: 1000 },
    │     { product_name: 'Gadget', quantity: 5, revenue: 500 }
    │   ]
    │
    ↓

Parent Enhancement (optional)
    │
    ├─→ Check if row should have plugin
    │   if (shouldApplyTablePlugin(row, cellState)) {
    │     row._selectPlugin = TablePlugin;
    │     row._fullWidth = true;
    │   }
    │
    ↓

A2Section (Fixed Columns)
    │
    ├─→ For each row:
    │   │
    │   ├─→ Has _selectPlugin?
    │   │   └─→ YES: Render <PluginComponent {...row._pluginProps} />
    │   │
    │   ├─→ Has full-width content?
    │   │   └─→ YES: Render custom full-width div
    │   │
    │   └─→ NO: Render normal cells
    │       ├─→ For each columnKey in fixedColumns:
    │       │   ├─→ Check customRenderer[columnKey]
    │       │   ├─→ Handle CellToolbar type
    │       │   ├─→ Render normal cell
    │       │   └─→ Apply drop handlers (onCellDrop)
    │
    ↓

B2Section (Scrolling Columns)
    │
    ├─→ For each row:
    │   │
    │   ├─→ Has _selectPlugin?
    │   │   └─→ YES: Skip (already rendered in A2)
    │   │
    │   ├─→ Has full-width content?
    │   │   └─→ YES: Render b2Content portion
    │   │
    │   └─→ NO: Render grid cells
    │       ├─→ gridTemplateColumns from columnWidths
    │       ├─→ For each columnKey in scrollingColumns:
    │       │   ├─→ formatVal(columnKey, row[columnKey])
    │       │   ├─→ Check customCellRenderer[columnKey]
    │       │   └─→ Render cell with alignment
```

---

## 3. Component Architecture Diagrams

### Layer 1: Container + Slot Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                        TableContainer                            │
│  - Creates tableContext                                          │
│  - Manages scroll sync                                           │
│  - Provides refs                                                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      TableToolbar (optional)                │ │
│  │  - Slot for toolbar components                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      TableHeader                            │ │
│  │  - Slot for A1 + B1 (or C1 + D1)                          │ │
│  │  - Conditional render (showHeader)                         │ │
│  │  ┌──────────────┐  ┌─────────────────────────────────────┐ │ │
│  │  │   A1/C1      │  │           B1/D1                     │ │ │
│  │  │  Fixed       │  │         Scrolling                   │ │ │
│  │  │  Header      │  │         Header                      │ │ │
│  │  └──────────────┘  └─────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      TableBody                              │ │
│  │  - Slot for A2 + B2 (or C2 + D2)                          │ │
│  │  - Owns vertical scroll (vScrollRef)                       │ │
│  │  ┌──────────────┐  ┌─────────────────────────────────────┐ │ │
│  │  │   A2/C2      │  │           B2/D2                     │ │ │
│  │  │  Fixed       │  │         Scrolling                   │ │ │
│  │  │  Body        │  │         Body                        │ │ │
│  │  └──────────────┘  └─────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      TableFooter                            │ │
│  │  - Slot for A3 + B3 (or C3 + D3)                          │ │
│  │  - B3/D3 owns scrollbar                                    │ │
│  │  ┌──────────────┐  ┌─────────────────────────────────────┐ │ │
│  │  │   A3/C3      │  │           B3/D3 (SCROLLBAR)        │ │ │
│  │  │  Fixed       │  │         Scrolling                   │ │ │
│  │  │  Footer      │  │         Footer                      │ │ │
│  │  └──────────────┘  └─────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Layer 2: A/B/C/D Section Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECTION GRID ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────┘

AB Table (Primary)
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  A1 (Fixed Header)         B1 (Scrolling Headers)            │
│  ┌──────────────┐          ┌──────────────────────────────┐  │
│  │  Column 1    │          │ Col 2 │ Col 3 │ Col 4 │ ... │  │
│  └──────────────┘          └──────────────────────────────┘  │
│  z-index: 50               z-index: 50                       │
│  overflow: hidden          overflow: hidden (hTopRef)        │
│                            transform synced via b1TrackRef   │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  A2 (Fixed Body)           B2 (Scrolling Body)               │
│  ┌──────────────┐          ┌──────────────────────────────┐  │
│  │  Row 1 Data  │          │  Data │  Data │  Data │ ... │  │
│  │  Row 2 Data  │          │  Data │  Data │  Data │ ... │  │
│  │  ...         │          │  ...  │  ...  │  ...  │ ... │  │
│  └──────────────┘          └──────────────────────────────┘  │
│  z-index: 20               z-index: 10                       │
│  overflow: visible         overflow: visible                 │
│                            transform synced via b2TrackRef   │
│                                                               │
│  ← Shared vertical scroll (vScrollRef) →                     │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  A3 (Fixed Footer)         B3 (Scrolling Footer) **OWNS**    │
│  ┌──────────────┐          ┌──────────────────────────────┐  │
│  │  Total       │          │ Total │ Total │ Total │ ... │  │
│  └──────────────┘          └──────────────────────────────┘  │
│  z-index: 60               z-index: 50                       │
│  overflow: hidden          overflow-x: auto (hBottomRef)    │
│                            **SCROLLBAR OWNER**               │
└───────────────────────────────────────────────────────────────┘

CD Table (Nested - same pattern)
┌───────────────────────────────────────────────────────────────┐
│  C1, C2, C3 (Fixed)        D1, D2, D3 (Scrolling)            │
│  Higher z-index            Uses same refs as B sections      │
│  Smaller text (11px)       Shares scroll context             │
│  Additional shadows        Independent column config         │
└───────────────────────────────────────────────────────────────┘
```

### Layer 3: Z-Index Layering

```
┌─────────────────────────────────────────────────────────────────┐
│                       Z-INDEX STACK                              │
└─────────────────────────────────────────────────────────────────┘

z-index: 60    ┌─────────────────────────────────────────┐
               │  A3 / C3 (Fixed Footers)                │
               │  - Always on top of body                │
               │  - Shadow over scrolling content        │
               └─────────────────────────────────────────┘

z-index: 50    ┌─────────────────────────────────────────┐
               │  A1 / C1 (Fixed Headers)                │
               │  B1 / D1 (Scrolling Headers)            │
               │  B3 / D3 (Scrolling Footers)            │
               │  - Headers above body                   │
               │  - Footers at same level as headers     │
               └─────────────────────────────────────────┘

z-index: 30    ┌─────────────────────────────────────────┐
               │  C2 (Nested Fixed Body)                 │
               │  - Higher than AB body                  │
               │  - Creates layered effect               │
               └─────────────────────────────────────────┘

z-index: 20    ┌─────────────────────────────────────────┐
               │  A2 (Fixed Body)                        │
               │  - Above B2 for shadow effect           │
               └─────────────────────────────────────────┘

z-index: 10    ┌─────────────────────────────────────────┐
               │  B2 (Scrolling Body)                    │
               │  - Base layer for content               │
               └─────────────────────────────────────────┘

z-index: 0     ┌─────────────────────────────────────────┐
               │  D2 (Nested Scrolling Body)             │
               │  - Nested content below parent          │
               └─────────────────────────────────────────┘
```

---

## 4. Pattern Documentation

### Pattern 1: Pure UI Sections

**Concept:** Sections are presentation-only components that receive all data via props.

**Implementation:**
```javascript
// Section receives everything, manages nothing
export default function A1Section({
  columnKeys = [],
  columnLabels = {},
  columnWidths = {},
  sortKey,
  sortDirection,
  onSort,
  styles = {},
  tableContext
}) {
  // Extract from context
  const { headerHeight, firstColWidth } = tableContext;

  // Pure rendering - no state, no side effects
  return (
    <div>
      {columnKeys.map(columnKey => (
        <div onClick={() => onSort(columnKey)}>
          {columnLabels[columnKey]}
        </div>
      ))}
    </div>
  );
}
```

**Benefits:**
- Sections are predictable (same props → same output)
- No hidden state
- Easy to test
- Can be reused in different contexts

**Limitation:**
- Parent must manage all state
- Props drilling can get verbose

---

### Pattern 2: Slot Component Pattern

**Concept:** Container provides slots that inject context into children.

**Implementation:**
```javascript
// Container creates context
const tableContext = { layout, rows, totals, refs, ... };

// Slot receives context and clones children
export function TableHeader({ children, tableContext }) {
  return (
    <div className="header-wrapper">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            tableContext,
            ...child.props
          });
        }
        return child;
      })}
    </div>
  );
}
```

**Usage:**
```javascript
<TableContainer {...props}>
  <TableHeader>
    <A1Section columnKeys={fixed} />
    <B1Section columnKeys={scrolling} />
  </TableHeader>
</TableContainer>
```

**Benefits:**
- Clean composition
- Context flows implicitly
- Easy to add/remove sections
- Parent controls structure

---

### Pattern 3: CloneElement Prop Injection

**Concept:** Parent components inject props into children without wrapper elements.

**Key Code:**
```javascript
// In TableContainer
return (
  <div ref={containerRef} className={containerClasses}>
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          tableContext,
          ...child.props
        });
      }
      return child;
    })}
  </div>
);
```

**Why This Pattern:**
- Preserves DOM structure (no extra divs)
- Implicit context passing
- Sections don't need to import context
- Flexible - works with any children

**Trade-off:**
- Less explicit than Context API
- Requires valid React elements

---

### Pattern 4: Transform-Based Scroll Sync

**Concept:** One element owns scroll, others sync via CSS transforms.

**Architecture:**
```
B3 (Scrollbar Owner)
  │
  ├─→ scrollLeft changes
  │
  ├─→ Event listener fires
  │
  ├─→ Calculate transform: `translate3d(${-scrollLeft}px, 0, 0)`
  │
  ├─→ Apply to B1 track
  │   b1TrackRef.current.style.transform = tx;
  │
  └─→ Apply to B2 track
      b2TrackRef.current.style.transform = tx;
```

**Why Transforms:**
- GPU-accelerated (hardware rendering)
- Smooth 60fps scrolling
- No layout thrashing
- Better than scrollTo() or scrollLeft manipulation

**Critical Rules:**
1. B3 must have `overflow-x: auto`
2. B1/B2 must have `overflow: hidden`
3. Inner tracks must have `will-change-transform`
4. Transform must match scrollbar position exactly

---

### Pattern 5: Column Routing (A/B Split)

**Concept:** First column fixed, rest scroll horizontally.

**Implementation:**
```javascript
// In tableConfig.js
export function routeABColumns(columnKeys = []) {
  return {
    fixedColumns: [columnKeys[0]],      // A sections
    scrollingColumns: columnKeys.slice(1) // B sections
  };
}

// In NestedTable.jsx
<A1Section columnKeys={fixedColumns} />
<B1Section columnKeys={scrollingColumns} />
```

**Extension for CD:**
```javascript
// Same pattern, different columns
export function routeCDColumns(columnKeys = []) {
  return {
    fixedColumns: [columnKeys[0]],
    scrollingColumns: columnKeys.slice(1)
  };
}
```

**Flexibility:**
- Could route multiple fixed columns: `columnKeys.slice(0, 2)`
- Could route no fixed columns: `fixedColumns: []`
- Routing logic is centralized, easy to change

---

### Pattern 6: Custom Renderers

**Concept:** Sections check for custom rendering functions before default rendering.

**Implementation:**
```javascript
// In A2Section
{columnKeys.map(columnKey => {
  // Check for custom renderer
  const customContent = customRenderer?.[columnKey]
    ? customRenderer[columnKey](row[columnKey], row, rIdx, columnKey)
    : null;

  // Handle special types
  if (customContent?.type === 'fullWidth') {
    return <FullWidthComponent {...customContent} />;
  }

  if (customContent?.type === 'cellToolbar') {
    return <CellToolbar {...customContent} />;
  }

  // Default rendering
  return <div>{row[columnKey]}</div>;
})}
```

**Use Cases:**
- Full-width plugin rows (TablePlugin)
- Cell toolbars (expand/collapse buttons)
- Custom formatters (currency, dates)
- Interactive elements (dropdowns, checkboxes)

**Pattern:**
```javascript
customRenderer = {
  product_name: (value, row, index, key) => ({
    type: 'fullWidth',
    a2Content: <ProductToolbar />,
    b2Content: <ProductMetrics />
  }),
  quantity: (value, row, index, key) => ({
    type: 'cellToolbar',
    component: <EditableCell value={value} />
  })
}
```

---

## 5. Current State vs Goals

### Comparison Matrix

| Feature | Current State | MODULAR_TABLE_PLAN.md Goal | Gap |
|---------|---------------|---------------------------|-----|
| **Table Structure** | A/B sections exist, C/D exist | A/B + nested C/D with toolbars | C/D toolbars not implemented |
| **Scroll Sync** | ✅ Working (B3 → B1/B2) | ✅ Same pattern | No gap |
| **Templates** | 3 templates (default, product, modular) | Multiple templates for all use cases | Need more templates |
| **Data Pipeline** | dataService → template → sections | ✅ Same flow | No gap |
| **Sections Modularity** | ❌ Hardcoded to data structure | ✅ Sections accept any content | **Major gap** |
| **Plugin System** | Partial (TablePlugin exists) | Full drag-and-drop plugins | **Major gap** |
| **Canvas Pattern** | ❌ Not implemented | Sections as canvases accepting modules | **Critical gap** |
| **Toolbar Plugins** | Basic toolbar exists | Drag-and-drop toolbar plugins | **Major gap** |
| **Cell State** | ✅ Working (cellState object) | ✅ Same pattern | No gap |
| **MODULE_STYLES** | ✅ Defined in tableProps.js | ✅ Fully integrated | Needs integration |
| **MODULE_LAYOUT** | ✅ Defined in tableProps.js | ✅ Fully integrated | Needs integration |

### Vision from README.md (lines 10-55)

**Target Architecture:**
1. User drops "top performers plugin" on A1
2. System generates product rows in A2
3. Each A2 row has C/D toolbar
4. User drops "variant breakdown" on C/D toolbar
5. C1 shows variant types, C2 shows variant rows
6. D1 shows variant metrics, D2 shows values
7. User can collapse/expand C/D tables
8. Toolbars accept plugin inserts and sends
9. Signal paths aggregate data across nested tables

**Current Capability:**
- ✅ Can render A/B table
- ✅ Can render C/D table
- ✅ Can detect plugin data (shouldApplyTablePlugin)
- ✅ Can render TablePlugin in rows
- ⚠️ Toolbars exist but no drag-and-drop
- ❌ No plugin insert/send system
- ❌ No signal path aggregation
- ❌ Sections still expect specific data shapes

---

### Key Architectural Gaps

#### Gap 1: Sections Are Data-Aware
**Problem:** Sections expect specific column structures.

**Current Code:**
```javascript
// A2Section expects row[columnKey] to exist
const cellValue = row?.[columnKey];
```

**What's Needed:**
```javascript
// Sections should accept any content
const cellContent = contentProvider?.[columnKey]
  ? contentProvider[columnKey](row, columnKey)
  : row?.[columnKey];
```

---

#### Gap 2: No Canvas Abstraction
**Problem:** Sections don't have a "content slot" mechanism.

**Current:** Section hardcodes cell rendering logic
**Needed:** Section provides "slots" for content modules

**Proposed Pattern:**
```javascript
<A2Section
  columnKeys={['col_0']}
  cellRenderer={{
    col_0: {
      type: 'module',
      module: ProductNameModule,
      props: { showIcon: true }
    }
  }}
/>
```

---

#### Gap 3: Template → Section Coupling
**Problem:** Templates must know section structure.

**Current:** Template returns `{ rows, columnKeys, ... }` that sections expect
**Needed:** Template returns data, separate "canvas config" defines rendering

---

#### Gap 4: No Module Registry
**Problem:** No central place to register/discover plugins.

**Needed:**
```javascript
// moduleRegistry.js
export const MODULE_REGISTRY = {
  'product-toolbar': ProductToolbarModule,
  'variant-breakdown': VariantBreakdownModule,
  'metric-insert': MetricInsertModule,
  'top-performers': TopPerformersModule
};

// Usage
const module = MODULE_REGISTRY[droppedItem.type];
```

---

## 6. Refactoring Strategy

### Strategy Overview

**Goal:** Make sections truly reusable by introducing a "canvas" system where sections render whatever content they're given, without knowing the data structure.

**Approach:** Preserve current architecture, add abstraction layer on top.

**Principles:**
1. Don't break existing templates (backward compatibility)
2. Introduce canvas pattern gradually
3. Keep scroll sync untouched (it works perfectly)
4. Use composition over configuration

---

### Phase 1: Canvas Prop System

**Concept:** Sections accept a `canvas` prop that defines what to render in each cell.

#### New Section Interface

```javascript
// Before (current)
<A2Section
  columnKeys={['product_name', 'quantity']}
  rows={[{product_name: 'Widget', quantity: 10}]}
/>

// After (canvas pattern)
<A2Section
  columns={[
    { id: 'col_0', width: 200 },
    { id: 'col_1', width: 100 }
  ]}
  rows={[
    { id: 'row_0', data: {...} },
    { id: 'row_1', data: {...} }
  ]}
  canvas={{
    type: 'grid',
    cellRenderer: (row, column) => {
      // Canvas decides what to render
      return <ProductCell data={row.data} column={column} />;
    }
  }}
/>
```

#### Canvas Types

```javascript
// 1. Grid Canvas (current behavior)
canvas = {
  type: 'grid',
  cellRenderer: (row, column) => <div>{row.data[column.id]}</div>
}

// 2. Plugin Canvas (full-width)
canvas = {
  type: 'plugin',
  rowRenderer: (row) => <TablePlugin {...row.pluginProps} />
}

// 3. Module Canvas (composed)
canvas = {
  type: 'module',
  modules: {
    col_0: { component: ProductNameModule, props: {...} },
    col_1: { component: MetricModule, props: {...} }
  }
}

// 4. Hybrid Canvas (mix of above)
canvas = {
  type: 'hybrid',
  rowType: (row) => row._hasPlugin ? 'plugin' : 'grid',
  renderers: {
    plugin: (row) => <TablePlugin />,
    grid: (row, col) => <div>{row.data[col.id]}</div>
  }
}
```

---

### Phase 2: Module System

**Concept:** Create reusable modules that can be dropped into any cell.

#### Module Interface

```javascript
// modules/base/ModuleInterface.js
export class TableModule {
  constructor(config) {
    this.type = config.type;
    this.props = config.props;
  }

  // Render in a cell
  renderCell(row, column, context) {
    return <div>Override this</div>;
  }

  // Render full-width
  renderFullWidth(row, context) {
    return null; // Optional
  }

  // Handle drop events
  onDrop(data, context) {
    // Optional
  }
}
```

#### Example Modules

```javascript
// modules/product/ProductNameModule.js
export class ProductNameModule extends TableModule {
  renderCell(row, column, context) {
    return (
      <div className="flex items-center gap-2">
        <ProductIcon />
        <span>{row.data.product_name}</span>
        {context.isExpandable && <ExpandButton />}
      </div>
    );
  }
}

// modules/metrics/RevenueModule.js
export class RevenueModule extends TableModule {
  renderCell(row, column, context) {
    const value = row.data[column.id];
    return (
      <div className="text-right font-mono">
        ${value.toLocaleString()}
      </div>
    );
  }
}
```

---

### Phase 3: Toolbar Plugin System

**Concept:** Toolbars become containers for draggable plugins.

#### Toolbar Architecture

```javascript
// components/toolbar/ModularToolbar.jsx
export function ModularToolbar({
  plugins = [],        // Array of installed plugins
  slots = ['left', 'center', 'right'],
  onPluginDrop,
  onPluginAction
}) {
  return (
    <div className="toolbar-container">
      {slots.map(slot => (
        <ToolbarSlot
          key={slot}
          id={slot}
          plugins={plugins.filter(p => p.slot === slot)}
          onDrop={(data) => onPluginDrop(slot, data)}
        />
      ))}
    </div>
  );
}
```

#### Plugin Interface

```javascript
// plugins/base/ToolbarPlugin.js
export class ToolbarPlugin {
  constructor(config) {
    this.id = config.id;
    this.type = config.type;
    this.slot = config.slot;
    this.icon = config.icon;
    this.label = config.label;
  }

  // Render in toolbar
  render(context) {
    return <button>{this.label}</button>;
  }

  // Handle click
  onClick(context) {
    // Override
  }

  // Accept drops
  onDrop(data, context) {
    // Override
  }

  // Send data
  send(target, context) {
    // Override
  }
}
```

---

### Phase 4: Signal Path System

**Concept:** Data flows through toolbar plugins via signal paths.

#### Signal Path Architecture

```javascript
// state/signalPath.js
export class SignalPath {
  constructor() {
    this.nodes = [];  // Array of toolbar plugins
    this.data = {};   // Aggregated data flowing through
  }

  addNode(toolbarId, pluginId) {
    this.nodes.push({ toolbarId, pluginId });
  }

  aggregate(data) {
    // Each node can transform the data
    this.nodes.forEach(node => {
      const plugin = getPlugin(node.toolbarId, node.pluginId);
      this.data = plugin.transform(this.data, data);
    });
  }

  send(targetTable) {
    // Send aggregated data to new table
    targetTable.receive(this.data);
  }
}
```

---

### Code Examples: Canvas Pattern Implementation

#### Example 1: Backward-Compatible Section

```javascript
// sections/A/A2Section.jsx (refactored)
export default function A2Section({
  // Old API (backward compatible)
  columnKeys = [],
  columnWidths = {},
  rows = [],
  customRenderer = null,

  // New API (canvas pattern)
  columns = null,
  canvas = null,

  tableContext
}) {
  // Normalize to new format
  const normalizedColumns = columns || columnKeys.map((key, i) => ({
    id: key,
    width: columnWidths[key] || 100
  }));

  const normalizedRows = rows.map((row, i) => ({
    id: row._rowId || `row_${i}`,
    data: row,
    _legacy: !columns  // Flag for legacy rendering
  }));

  // Use canvas if provided, else fallback to legacy
  const renderCell = canvas?.cellRenderer || ((row, col) => {
    // Legacy rendering
    return customRenderer?.[col.id]
      ? customRenderer[col.id](row.data[col.id], row.data, i, col.id)
      : row.data[col.id];
  });

  return (
    <div className="flex-none bg-white">
      {normalizedRows.map((row, rIdx) => (
        <div key={row.id} className="flex">
          {normalizedColumns.map(col => (
            <div key={col.id} style={{ width: col.width }}>
              {renderCell(row, col, tableContext)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

#### Example 2: Module-Based Canvas

```javascript
// Usage in parent component
import { ProductNameModule, RevenueModule, QuantityModule } from './modules';

<A2Section
  columns={[
    { id: 'name', width: 200 },
    { id: 'quantity', width: 100 },
    { id: 'revenue', width: 120 }
  ]}
  rows={productRows}
  canvas={{
    type: 'module',
    modules: {
      name: new ProductNameModule({ expandable: true }),
      quantity: new QuantityModule({ format: 'abbreviated' }),
      revenue: new RevenueModule({ currency: 'USD' })
    },
    cellRenderer: (row, column) => {
      const module = canvas.modules[column.id];
      return module ? module.renderCell(row, column, tableContext) : null;
    }
  }}
/>
```

#### Example 3: Hybrid Canvas (Mixed Content)

```javascript
<A2Section
  columns={columns}
  rows={enhancedRows}
  canvas={{
    type: 'hybrid',

    // Determine rendering strategy per row
    getRowType: (row) => {
      if (row._hasPlugin) return 'plugin';
      if (row._hasToolbar) return 'toolbar';
      return 'grid';
    },

    // Renderers for each type
    renderers: {
      plugin: (row) => (
        <TablePlugin
          data={row.pluginData}
          {...row.pluginProps}
        />
      ),

      toolbar: (row) => (
        <ModularToolbar
          plugins={row.toolbarPlugins}
          onPluginAction={(action) => handleAction(row, action)}
        />
      ),

      grid: (row, column) => {
        const module = getModule(column.id);
        return module.renderCell(row, column);
      }
    }
  }}
/>
```

---

### Integration Strategy: Preserve Existing, Add New

#### Step 1: Add Canvas Support (No Breaking Changes)

```javascript
// sections/A/A2Section.jsx
export default function A2Section(props) {
  // Detect mode
  const isLegacyMode = !props.canvas;

  if (isLegacyMode) {
    return <LegacyA2Section {...props} />;
  }

  return <CanvasA2Section {...props} />;
}

function LegacyA2Section({ columnKeys, rows, customRenderer, ... }) {
  // Current implementation - unchanged
}

function CanvasA2Section({ columns, rows, canvas, ... }) {
  // New canvas-based rendering
}
```

#### Step 2: Create Canvas Wrapper

```javascript
// wrappers/CanvasWrapper.jsx
export function withCanvas(SectionComponent) {
  return function CanvasSection(props) {
    // If canvas provided, use new rendering
    if (props.canvas) {
      return <CanvasRenderer
        Section={SectionComponent}
        {...props}
      />;
    }

    // Else, use legacy mode
    return <SectionComponent {...props} />;
  };
}

// Usage
export default withCanvas(A2Section);
```

#### Step 3: Gradual Migration

```javascript
// templates/canvasTable.js (new template)
export function canvasTable(data, options) {
  return {
    // New format
    columns: [
      { id: 'col_0', width: 200, module: 'product-name' },
      { id: 'col_1', width: 100, module: 'quantity' },
      { id: 'col_2', width: 120, module: 'revenue' }
    ],

    rows: data.map(item => ({
      id: item.id,
      data: item,
      modules: {
        col_0: { type: 'product-name', props: { expandable: true } },
        col_1: { type: 'quantity', props: {} },
        col_2: { type: 'revenue', props: { currency: 'USD' } }
      }
    })),

    canvas: {
      type: 'module',
      cellRenderer: (row, column) => {
        const moduleConfig = row.modules[column.id];
        const Module = MODULE_REGISTRY[moduleConfig.type];
        return <Module {...moduleConfig.props} data={row.data} />;
      }
    }
  };
}
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Add canvas support without breaking existing code

#### Tasks:
1. **Create Canvas Interfaces**
   - [ ] Define `Canvas` type (TypeScript/JSDoc)
   - [ ] Define `TableModule` base class
   - [ ] Define `ToolbarPlugin` base class
   - [ ] Create module registry structure

2. **Refactor Sections for Dual Mode**
   - [ ] Add canvas detection to A2Section
   - [ ] Implement `LegacyA2Section` (current code)
   - [ ] Implement `CanvasA2Section` (new rendering)
   - [ ] Repeat for B2, C2, D2

3. **Create First Modules**
   - [ ] `TextModule` (basic text rendering)
   - [ ] `ProductNameModule` (with icon, expand)
   - [ ] `NumberModule` (formatted numbers)
   - [ ] `CurrencyModule` (money formatting)

**Files to Create:**
```
src-new/core/components/custom/table/
├── canvas/
│   ├── CanvasInterface.js
│   ├── TableModule.js
│   └── CanvasRenderer.jsx
├── modules/
│   ├── registry.js
│   ├── base/
│   │   ├── TextModule.jsx
│   │   └── NumberModule.jsx
│   └── product/
│       └── ProductNameModule.jsx
```

**Success Criteria:**
- Existing templates still work
- New canvas-based template works side-by-side
- No regressions in scroll sync

---

### Phase 2: Module System (Weeks 3-4)
**Goal:** Build library of reusable modules

#### Tasks:
1. **Core Modules**
   - [ ] Create 10 essential modules (text, number, currency, date, boolean, etc.)
   - [ ] Create module composition system (nested modules)
   - [ ] Add module props validation

2. **Module Registry**
   - [ ] Implement `MODULE_REGISTRY` object
   - [ ] Add module discovery system
   - [ ] Create module loader (dynamic imports)

3. **Module Testing**
   - [ ] Unit tests for each module
   - [ ] Integration tests with sections
   - [ ] Visual regression tests

**Files to Create:**
```
src-new/core/components/custom/table/modules/
├── base/
│   ├── TextModule.jsx
│   ├── NumberModule.jsx
│   ├── CurrencyModule.jsx
│   ├── DateModule.jsx
│   ├── BooleanModule.jsx
│   └── IconModule.jsx
├── product/
│   ├── ProductNameModule.jsx
│   ├── VariantModule.jsx
│   └── SKUModule.jsx
├── metrics/
│   ├── RevenueModule.jsx
│   ├── QuantityModule.jsx
│   └── PercentModule.jsx
└── registry.js
```

---

### Phase 3: Toolbar Plugins (Weeks 5-6)
**Goal:** Drag-and-drop toolbar system

#### Tasks:
1. **Toolbar Infrastructure**
   - [ ] Create `ModularToolbar` component
   - [ ] Implement toolbar slots (left, center, right)
   - [ ] Add drag-and-drop handlers
   - [ ] Create toolbar state management

2. **Core Plugins**
   - [ ] `ExpandPlugin` (expand/collapse rows)
   - [ ] `FilterPlugin` (filter table data)
   - [ ] `SortPlugin` (sort columns)
   - [ ] `ExportPlugin` (export data)
   - [ ] `InsertPlugin` (add metrics)
   - [ ] `SendPlugin` (send to other tables)

3. **Plugin Communication**
   - [ ] Event system (plugin → toolbar → table)
   - [ ] State propagation (toolbar state → sections)

**Files to Create:**
```
src-new/core/components/plugins/toolbar/
├── ModularToolbar.jsx
├── ToolbarSlot.jsx
├── ToolbarPlugin.js (base class)
├── plugins/
│   ├── ExpandPlugin.jsx
│   ├── FilterPlugin.jsx
│   ├── SortPlugin.jsx
│   ├── ExportPlugin.jsx
│   ├── InsertPlugin.jsx
│   └── SendPlugin.jsx
└── registry.js
```

---

### Phase 4: Signal Path System (Weeks 7-8)
**Goal:** Data aggregation across nested tables

#### Tasks:
1. **Signal Path Core**
   - [ ] Create `SignalPath` class
   - [ ] Implement node registration
   - [ ] Add data transformation pipeline
   - [ ] Create target resolution system

2. **Integration**
   - [ ] Connect toolbars to signal paths
   - [ ] Add path visualization (dev tool)
   - [ ] Implement path serialization (save/load)

3. **Advanced Features**
   - [ ] Path branching (one source → multiple targets)
   - [ ] Path merging (multiple sources → one target)
   - [ ] Conditional paths (if/then logic)

**Files to Create:**
```
src-new/core/state/
├── signalPath.js
├── pathRegistry.js
├── pathVisualizer.jsx (dev tool)
└── pathSerializer.js
```

---

### Phase 5: Production Polish (Weeks 9-10)
**Goal:** Production-ready system

#### Tasks:
1. **Documentation**
   - [ ] API reference for all modules
   - [ ] Tutorial: Building custom modules
   - [ ] Tutorial: Creating toolbar plugins
   - [ ] Examples for all use cases

2. **Performance**
   - [ ] Virtualization for large tables
   - [ ] Lazy loading for modules
   - [ ] Memoization for expensive renders
   - [ ] Bundle size optimization

3. **Developer Experience**
   - [ ] TypeScript types for all components
   - [ ] ESLint rules for module development
   - [ ] CLI tool for scaffolding modules
   - [ ] Visual module builder (UI tool)

---

### Migration Strategy: Old → New

#### Backward Compatibility Rules
1. **Never remove old props** - deprecate, don't delete
2. **Always support legacy mode** - detect and route to old code
3. **Gradual deprecation** - warn in dev, break in major version

#### Template Migration Path

```javascript
// Step 1: Current template (keep working)
export function productTable(data) {
  return {
    rows: [...],
    columnKeys: [...],
    // ...legacy format
  };
}

// Step 2: Add canvas output (dual mode)
export function productTable(data, options = {}) {
  const useCanvas = options.canvas || false;

  if (!useCanvas) {
    // Legacy format
    return { rows, columnKeys, ... };
  }

  // New canvas format
  return {
    columns: [...],
    rows: [...],
    canvas: { type: 'module', ... }
  };
}

// Step 3: Deprecate legacy (warnings)
export function productTable(data, options = {}) {
  if (!options.canvas) {
    console.warn('Legacy format deprecated, use canvas: true');
  }
  // ...
}

// Step 4: Remove legacy (breaking change, next major version)
export function productTable(data, options = {}) {
  // Only canvas mode
}
```

---

### Testing Strategy

#### Unit Tests
- Each module in isolation
- Canvas rendering logic
- Toolbar plugin behavior
- Signal path transformations

#### Integration Tests
- Template → Section rendering
- Scroll sync with canvas mode
- Drag-and-drop flow (toolbar → cell)
- Nested table expansion

#### Visual Regression Tests
- Screenshot comparison for each module
- Layout stability tests
- Z-index layering verification

#### Performance Tests
- 1000+ row rendering
- Scroll performance (60fps)
- Memory usage (no leaks)
- Bundle size limits

---

## Appendix A: File Dependency Graph

```
TableContainer.jsx
  ├─→ Uses: React
  ├─→ Exports: TableContainer, TableToolbar, TableHeader, TableBody, TableFooter
  └─→ Used by: NestedTable.jsx, CustomTableWorkspace.jsx

NestedTable.jsx
  ├─→ Imports: TableContainer, A1-A3, B1-B3
  ├─→ Uses: tableProps.js (alignment)
  └─→ Used by: Parent components, TableWorkspace

tableProps.js
  ├─→ Imports: None (pure utilities)
  ├─→ Exports: DEFAULT_LAYOUT, MODULE_LAYOUT, DEFAULT_STYLES, MODULE_STYLES
  └─→ Used by: All sections, templates, tableConfig

tableConfig.js
  ├─→ Imports: templates, schemaRegistry, tableProps
  ├─→ Exports: applyTemplate, routeABColumns, routeCDColumns, getViewModeColumns
  └─→ Used by: CustomTableWorkspace, parent components

dataConfig.js
  ├─→ Imports: calculations/index.js
  ├─→ Exports: calculateTotals, groupDataBy, filterData
  └─→ Used by: Templates

Templates (defaultTable.js, productTable.js, modularTable.js)
  ├─→ Imports: tableProps, dataConfig, tableConfig
  ├─→ Exports: template function
  └─→ Used by: tableConfig.applyTemplate

Sections (A1-A3, B1-B3, C1-C3, D1-D3)
  ├─→ Imports: tableProps (utilities), tableSorting (utils)
  ├─→ Receives: tableContext via cloneElement
  └─→ Used by: NestedTable, parent assemblies
```

---

## Appendix B: Props Reference

### TableContainer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| rows | Array | [] | Data rows |
| totals | Object | {} | Footer totals |
| columnKeys | Array | [] | Column identifiers |
| columnLabels | Object | {} | Display labels |
| layout | Object | {} | Dimensions config |
| styles | Object | {} | Style overrides |
| showHeader | Boolean | true | Header visibility |
| showBody | Boolean | true | Body visibility |
| showFooter | Boolean | true | Footer visibility |
| containerClasses | String | (default) | Container CSS |
| maxBodyHeight | Number | null | Max body height |
| columnWidths | Object | {} | Width per column |

### Section Props (A1 Example)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columnKeys | Array | [] | Columns to render |
| columnLabels | Object | {} | Display labels |
| columnWidths | Object | {} | Width per column |
| sortKey | String | null | Active sort column |
| sortDirection | String | null | 'asc' or 'desc' |
| onSort | Function | () => {} | Sort handler |
| disableSorting | Boolean | false | Disable sorting |
| alignment | String | 'center' | Default alignment |
| columnAlignments | Object | {} | Per-column alignment |
| styles | Object | {} | Style overrides |
| customRenderer | Object | null | Custom renderers |
| className | String | "" | Additional CSS |
| tableContext | Object | {} | Injected context |

---

## Appendix C: Quick Reference

### Adding a New Module

```javascript
// 1. Create module file
// modules/custom/MyModule.jsx
import { TableModule } from '../base/TableModule.js';

export class MyModule extends TableModule {
  renderCell(row, column, context) {
    return <div>{/* Your rendering */}</div>;
  }
}

// 2. Register module
// modules/registry.js
import { MyModule } from './custom/MyModule.jsx';

export const MODULE_REGISTRY = {
  // ...
  'my-module': MyModule
};

// 3. Use in template
canvas: {
  type: 'module',
  modules: {
    col_0: new MyModule({ /* config */ })
  }
}
```

### Adding a New Template

```javascript
// 1. Create template file
// templates/myTemplate.js
import { DEFAULT_STYLES, DEFAULT_LAYOUT } from '../tableProps.js';

export function myTemplate(data, options) {
  // Transform data
  const rows = transformData(data);

  return {
    rows,
    totals: calculateTotals(rows),
    columnKeys: ['col_0', 'col_1'],
    columnLabels: { col_0: 'Label 1', col_1: 'Label 2' },
    styles: DEFAULT_STYLES,
    layout: DEFAULT_LAYOUT
  };
}

// 2. Register in tableConfig.js
import myTemplate from './templates/myTemplate.js';

const templates = {
  // ...
  myTemplate: myTemplate
};
```

---

## Conclusion

The custom table system has a **solid foundation** with elegant scroll synchronization and clean separation of concerns. The primary architectural challenge is making sections **content-agnostic** to enable the modular, drag-and-drop vision.

**Recommended Next Steps:**
1. Implement Phase 1 (Canvas Foundation) - 2 weeks
2. Validate with one complete use case (product table with canvas)
3. Build Module System (Phase 2) - 2 weeks
4. Prototype Toolbar Plugins (Phase 3) - 2 weeks
5. Complete Signal Path System (Phase 4) - 2 weeks

**Success Metric:** A store manager can build a complex product analysis table with nested variants by dragging 5 plugins onto toolbars, without writing any code.

The architecture is 60% there. The refactoring strategy preserves all existing functionality while adding the flexibility needed for the ultimate vision: **endless tables with endless configurations (within reason)**.

---

**Report End**
For questions or clarification on any section, refer to the specific file paths and line numbers provided throughout this document.
