# Dependency Analysis: NestedTable/RowPlugin/A2/B2 System

## Overview
This report analyzes all dependencies in the current nested table rendering system to understand what creates coupling and prevents reusability.

---

## Dependency Map

### 1. A2Section → RowPlugin (shouldApplyRowPlugin)
**File:** `src-new/core/components/custom/table/sections/A/A2.jsx:3`
```javascript
import { shouldApplyRowPlugin } from '../../../../plugins/default/table/RowPlugin.jsx';
```

**What it does:**
- A2Section imports a helper function to check if a row needs special rendering
- Called on line 52: `const usePlugin = shouldApplyRowPlugin(row, cellState);`

**Why it exists:**
- A2Section needs to know: "Should I render normal cells or something special?"
- Decision is based on cellState having data for this row

**The coupling:**
- A2Section KNOWS about the concept of "plugins"
- A2Section KNOWS about RowPlugin's helper functions
- A2Section cannot be reused without this dependency

---

### 2. A2Section → NestedTable (component)
**File:** `src-new/core/components/custom/table/sections/A/A2.jsx:4`
```javascript
import NestedTable from '../../NestedTable.jsx';
```

**What it does:**
- A2Section imports NestedTable to render it when `shouldApplyRowPlugin` returns true
- Renders on lines 64-75

**Why it exists:**
- When a row needs special rendering, A2Section needs to know WHAT to render
- Hardcoded to render NestedTable specifically

**The coupling:**
- A2Section KNOWS about NestedTable specifically
- A2Section cannot render other types of special content without code changes
- If NestedTable changes its props, A2Section must change

---

### 3. B2Section → RowPlugin (shouldApplyRowPlugin)
**File:** `src-new/core/components/custom/table/sections/B/B2.jsx:3`
```javascript
import { shouldApplyRowPlugin } from '../../../../plugins/default/table/RowPlugin.jsx';
```

**Same as A2Section dependency #1**
- Exact same coupling
- Duplicated logic between A2 and B2

---

### 4. B2Section → NestedTable (component)
**File:** `src-new/core/components/custom/table/sections/B/B2.jsx:4`
```javascript
import NestedTable from '../../NestedTable.jsx';
```

**Same as A2Section dependency #2**
- Exact same coupling
- Duplicated logic between A2 and B2

---

### 5. NestedTable → section prop ('A2' or 'B2')
**File:** `src-new/core/components/custom/table/NestedTable.jsx:29`
```javascript
section = 'A2', // 'A2' or 'B2'
```

**What it does:**
- NestedTable receives a string indicating which section is calling it
- Used on line 200 to conditionally render C sections or D sections

**Why it exists:**
- NestedTable is called TWICE (once from A2, once from B2)
- Needs to know which caller it is to render the appropriate half
- A2 call renders C sections (fixed columns)
- B2 call renders D sections (scrolling columns)

**The coupling:**
- NestedTable KNOWS about A2/B2 sections
- NestedTable cannot work independently
- Must be called exactly twice to render completely

---

### 6. NestedTable → C/D sections (conditional rendering)
**File:** `src-new/core/components/custom/table/NestedTable.jsx:200-252`
```javascript
{section === 'A2' ? (
  <>
    <C1Section ... />
    <C2Section ... />
    <C3Section ... />
  </>
) : (
  <>
    <D1Section ... />
    <D2Section ... />
    <D3Section ... />
  </>
)}
```

**What it does:**
- Based on `section` prop, renders either C sections OR D sections
- Never renders both at the same time

**Why it exists:**
- C and D sections need to appear side-by-side in the outer table's flex layout
- Outer table's TableBody puts A2 and B2 side-by-side
- NestedTable's C content goes in A2's space, D content goes in B2's space

**The coupling:**
- NestedTable KNOWS it will be split across two calls
- Cannot render as a unified component
- Depends on outer table's layout to position its halves

---

### 7. RowPlugin → section prop ('A2' or 'B2')
**File:** `src-new/core/components/plugins/default/table/RowPlugin.jsx:51`
```javascript
section = 'A2',
```

**What it does:**
- RowPlugin receives section prop from NestedTable
- Used on lines 121 and 168 to conditionally render toolbar or spacer

**Why it exists:**
- When section='A2': Render the full-width toolbar
- When section='B2': Render just a spacer (same height as toolbar)
- Prevents toolbar from rendering twice

**The coupling:**
- RowPlugin KNOWS it will be called twice
- RowPlugin KNOWS about A2/B2 section concept
- Cannot work independently

---

### 8. RowPlugin → toolbar/spacer conditional rendering
**File:** `src-new/core/components/plugins/default/table/RowPlugin.jsx:121-170`
```javascript
{section === 'A2' && (
  <div ...>
    <Toolbar ... />
  </div>
)}

{section === 'B2' && (
  <div style={{ height: rowHeight }} className="bg-white" />
)}
```

**What it does:**
- Renders toolbar when called from A2
- Renders empty spacer when called from B2

**Why it exists:**
- Toolbar needs to appear once, full-width
- But RowPlugin is called twice (once for C sections, once for D sections)
- Spacer maintains layout alignment

**The coupling:**
- RowPlugin layout depends on being called exactly twice
- Height of spacer must match toolbar height
- Cannot render standalone

---

### 9. A2/B2 → cellState (shared state)
**Props:** `cellState={cellState}`

**What it does:**
- Both A2 and B2 receive the same cellState object
- Used to determine if row needs plugin rendering
- Used by NestedTable to get plugin data

**Why it exists:**
- Drop events update cellState in parent (TableWorkspace)
- Both A2 and B2 need to check same state to coordinate
- NestedTable instances (A2 and B2 calls) need to share view mode, sort state

**The coupling:**
- All components depend on cellState structure: `${rowId}_${colKey}: { type, content, ... }`
- Changes to cellState structure break multiple components
- State is external but structure is hardcoded

---

### 10. A2/B2 → expandedRows (shared state)
**Props:** `expandedRows={expandedRows}, toggleRowExpanded={toggleRowExpanded}`

**What it does:**
- Both A2 and B2 receive same expanded state
- NestedTable instances coordinate to show/hide content together

**Why it exists:**
- When you expand a row, both the A2 and B2 instances of NestedTable should expand
- State must be shared to keep them in sync

**The coupling:**
- Both A2 and B2 NestedTable calls must receive same expand state
- If one expands without the other, layout breaks

---

### 11. A2/B2 → tableContainerWidth (context from parent)
**Props:** `tableContainerWidth={tableContainerWidth}`

**What it does:**
- Passed from TableBody to A2/B2 sections
- Passed through to NestedTable
- Passed through to RowPlugin
- Used to size the toolbar

**Why it exists:**
- RowPlugin's toolbar needs to be full-width
- Width value comes from parent TableContainer measuring itself

**The coupling:**
- Deep prop drilling: TableContainer → TableBody → A2Section → NestedTable → RowPlugin
- Multiple components in chain must pass it through
- RowPlugin cannot determine its own width

---

### 12. NestedTable → C/D sections have NO scroll container
**Observation:** C1/C2/C3 and D1/D2/D3 are just plain divs with content

**Why this matters:**
- C/D sections render inside outer table's scroll container
- They share outer table's scroll, not their own
- No way to have independent scroll per nested table

**The coupling:**
- Nested content depends on outer table's scroll system
- Cannot have independent scroll without wrapping in own scroll container
- But wrapping in scroll container breaks flex layout (C and D need to be side-by-side)

---

## Summary of Root Causes

### Why these dependencies exist:

1. **Split rendering pattern**
   - NestedTable must render in two pieces (C and D) to fit in outer table's A2/B2 columns
   - This forces: section prop, dual calls, conditional rendering, toolbar/spacer logic

2. **Hardcoded knowledge**
   - A2/B2 know about shouldApplyRowPlugin
   - A2/B2 know about NestedTable specifically
   - Cannot plug in different special renderers without changing A2/B2 code

3. **Shared state coordination**
   - cellState, expandedRows must be shared between both NestedTable instances
   - Complex state structure that multiple components depend on

4. **Layout constraints**
   - C and D sections need to appear side-by-side
   - Achieved by rendering them in separate columns (A2 and B2)
   - This prevents them from being in same scroll container

5. **No independent scroll**
   - C/D sections are just content, not scroll containers
   - Nested tables share outer table's scroll
   - Cannot have per-table scroll without breaking layout

### What prevents making it reusable:

- A2/B2 sections have hardcoded imports and logic for NestedTable
- NestedTable cannot render as unified component (split into C/D halves)
- RowPlugin depends on being called twice with different section values
- All components tightly coupled through props and shared assumptions

