# Refactor Game Plan: Preserve Plugin Logic, Pure AB Sections

## Goal
Make A/B sections pure rendering components while preserving all the plugin logic (C/D assignments, productTable config, drag/drop column behavior, aggregate data recalculation).

---

## Critical Logic to Preserve

### 1. TablePlugin + NestedTable Logic
**Location:** `NestedTable.jsx` lines 75-96
```javascript
// Column routing based on view mode
if (currentViewMode === 'by-color') {
  fixedColumns = ['color'];
  scrollingColumns = ['size', 'quantity', 'discounted_price'];
} else if (currentViewMode === 'by-size') {
  fixedColumns = ['size'];
  scrollingColumns = ['color', 'quantity', 'discounted_price'];
} else {
  fixedColumns = [];
  scrollingColumns = allColumns;
}
```

**What it does:** Routes columns to C (fixed) vs D (scrolling) based on view mode

---

### 2. productTable Configuration
**Location:** `NestedTable.jsx` lines 61-65
```javascript
const productData = pluginData.content || [];
const tableProps = applyTemplate(productData, productTable, {
  ...pluginData.options,
  viewMode: currentViewMode
});
```

**What it does:** Applies productTable template with view mode to transform raw CSV data into table structure

---

### 3. Drag/Drop Column Behavior
**Location:** `NestedTable.jsx` lines 120-150

**Drag handler (D1 → C1):**
```javascript
const onHeaderDragStart = (e, columnKey) => {
  const viewModeMap = { 'color': 'by-color', 'size': 'by-size' };
  const viewMode = viewModeMap[columnKey];
  // ... drag logic
};
```

**Drop handler (C1):**
```javascript
const onC1Drop = (e) => {
  handleDrop(e, DRAG_TYPES.VIEW_MODE, (data) => {
    handleViewModeSwitch(data.viewMode);
  });
};
```

**What it does:** Dragging 'Size' or 'Color' from D1 to C1 changes view mode, triggers aggregate data recalculation

---

### 4. Aggregate Data Recalculation
**Triggered by:** View mode change
**Mechanism:** `applyTemplate` with new viewMode recalculates aggregates
**Result:** Rows re-group, totals recalculate

---

## Game Plan Itinerary

### Phase 1: Extract Plugin Logic into Self-Contained Module
**Goal:** Package all NestedTable/TablePlugin logic so it doesn't depend on A2/B2

#### Task 1.1: Create TablePlugin Component
- New file: `TablePlugin.jsx`
- Wraps TablePlugin + NestedTable logic
- Props: `row`, `cellState`, `onCellStateUpdate`, `expandedRows`, `toggleRowExpanded`
- Returns: Complete rendered plugin row (toolbar + table content)
- **Does NOT** take `section` prop - renders as unified component

#### Task 1.2: Move Column Assignment Logic
- Keep `fixedColumns` vs `scrollingColumns` logic inside TablePlugin
- Keep C/D section rendering (for now)
- Preserve productTable template application
- Preserve drag/drop handlers

#### Task 1.3: Test Plugin Logic in Isolation
- Verify TablePlugin can render independently
- Verify drag/drop still changes view mode
- Verify aggregate data recalculates

**Success Criteria:**
- TablePlugin works standalone
- All drag/drop behavior preserved
- Column routing logic intact
- productTable configuration working

---

### Phase 2: Make A2/B2 Sections Pure
**Goal:** Remove all NestedTable/TablePlugin knowledge from A2/B2

#### Task 2.1: Remove Hardcoded Imports from A2
```diff
- import { shouldApplyTablePlugin } from '../../../../plugins/default/table/TablePlugin.jsx';
- import NestedTable from '../../NestedTable.jsx';
```

#### Task 2.2: Remove Hardcoded Imports from B2
Same as 2.1

#### Task 2.3: Add Generic Row Plugin Support to A2
```javascript
// Inside A2Section row mapping
if (row._selectPlugin) {
  const PluginComponent = row._selectPlugin;
  return <PluginComponent key={...} row={row} {...row._pluginProps} />;
}
```

#### Task 2.4: Add Generic Row Plugin Support to B2
Same pattern as 2.3

**Success Criteria:**
- A2/B2 sections don't import NestedTable or shouldApplyTablePlugin
- A2/B2 check `row._selectPlugin` property instead
- A2/B2 are now pure rendering components

---

### Phase 3: Connect TablePlugin via Row Property
**Goal:** Make rows specify their own plugin

#### Task 3.1: Modify TableWorkspace to Attach Plugin
```javascript
const enhancedRows = tableProps.rows.map(row => {
  if (shouldApplyTablePlugin(row, cellState)) {
    return {
      ...row,
      _selectPlugin: TablePlugin,
      _rendererProps: {
        cellState,
        onCellStateUpdate,
        expandedRows,
        toggleRowExpanded
      }
    };
  }
  return row;
});
```

#### Task 3.2: Pass Enhanced Rows to A2/B2
Instead of passing `tableProps.rows`, pass `enhancedRows`

#### Task 3.3: Update A2/B2 to Use Plugin Props
```javascript
if (row._selectPlugin) {
  const PluginComponent = row._selectPlugin;
  return <PluginComponent row={row} {...row._pluginProps} />;
}
```

**Success Criteria:**
- Rows carry their own renderer
- A2/B2 sections don't know about plugins
- TablePlugin still renders correctly

---

### Phase 4: Solve Layout Problem (Plugin Rows Span Full Width)
**Goal:** Plugin rows render full-width with own TableContainer

#### Task 4.1: Make TablePlugin Return Full-Width Component
Currently TablePlugin is called twice (A2 and B2). Need to make it render once, full-width.

**Option A: Full-width flag**
```javascript
if (row._selectPlugin && row._fullWidth) {
  // Render spanning both A and B columns
  return <PluginComponent ... />;
}
```

**Option B: A2 renders, B2 skips**
- A2 checks `row._selectPlugin` and renders full-width
- B2 checks if A2 already rendered this row, skips it

#### Task 4.2: Update A2/B2 to Handle Full-Width Rows
A2Section:
```javascript
if (row._selectPlugin) {
  const PluginComponent = row._selectPlugin;
  return (
    <div key={...} className="col-span-full"> {/* Spans both A and B */}
      <PluginComponent row={row} {...row._pluginProps} />
    </div>
  );
}
```

B2Section:
```javascript
if (row._selectPlugin) {
  return null; // Already rendered in A2
}
```

#### Task 4.3: TablePlugin Wraps Content in TableContainer
```javascript
return (
  <TablePlugin ...>
    <TableContainer {...tableProps}>
      <TableHeader>
        <C1Section ... />
        <D1Section ... />
      </TableHeader>
      <TableBody>
        <C2Section ... />
        <D2Section ... />
      </TableBody>
      <TableFooter>
        <C3Section ... />
        <D3Section ... />
      </TableFooter>
    </TableContainer>
  </TablePlugin>
);
```

**Success Criteria:**
- Plugin rows render once (not twice)
- Plugin rows span full width
- Each plugin row has own TableContainer
- Independent scroll working

---

### Phase 5: Eliminate Section Prop
**Goal:** Remove section='A2'/'B2' prop now that components render once

#### Task 5.1: Remove section from NestedTable
Already done in Phase 1 when creating TablePlugin

#### Task 5.2: Remove section from TablePlugin
```diff
- section = 'A2',
```

Remove conditional toolbar/spacer rendering:
```diff
- {section === 'A2' && (
+ {/* Always render toolbar */}
  <Toolbar ... />
- )}
- {section === 'B2' && (
-   <div style={{ height: rowHeight }} />
- )}
```

**Success Criteria:**
- No section prop anywhere
- TablePlugin always renders toolbar
- No conditional rendering based on section

---

### Phase 6: Consider C/D vs A/B Sections
**Goal:** Evaluate if C/D sections should be merged with A/B

#### Task 6.1: Compare C/D Implementation to A/B
- Are C1/C2/C3 just copies of A1/A2/A3?
- Are D1/D2/D3 just copies of B1/B2/B3?
- Or do they have unique nested-specific logic?

#### Task 6.2: Decision Point
**Option A: Keep C/D as "nested table skin"**
- If C/D have unique styling/behavior for nested context
- Treat C/D as a "variant" of A/B for plugin contexts

**Option B: Merge C/D into A/B**
- If C/D are just duplicates
- Use A/B sections for both outer and nested tables
- Pass styling variants via props

#### Task 6.3: Implement Chosen Option
TBD based on decision

**Success Criteria:**
- No unnecessary code duplication
- Clear separation between outer/nested if needed
- Or unified sections if duplication eliminated

---

### Phase 7: Cleanup and Polish
**Goal:** Remove dead code, improve naming

#### Task 7.1: Remove shouldApplyTablePlugin from TablePlugin.jsx
Move to TableWorkspace or wherever row enhancement happens

#### Task 7.2: Simplify cellState Structure
Currently stores view mode and sort state in cellState. Consider:
```javascript
// Instead of cellState for UI state
nestedTableState[rowId] = {
  viewMode: 'by-color',
  sortKey: 'quantity',
  sortDirection: 'desc'
};
```



#### Task 7.4: Update Documentation
Document the plugin architecture and how to add custom row renderers

**Success Criteria:**
- No dead code
- Clear, descriptive names
- Updated documentation

---

## Summary: Key Transformations

### Before
```
TableWorkspace
  └─ TableContainer (outer)
       └─ TableBody
            ├─ A2Section (knows about NestedTable)
            │    └─ NestedTable (section='A2')
            │         └─ TablePlugin (section='A2', toolbar)
            │              └─ C1/C2/C3 sections
            └─ B2Section (knows about NestedTable)
                 └─ NestedTable (section='B2')
                      └─ TablePlugin (section='B2', spacer)
                           └─ D1/D2/D3 sections
```

### After
```
TableWorkspace (enhances rows with _selectPlugin)
  └─ TableContainer (outer)
       └─ TableBody
            ├─ A2Section (pure, checks row._selectPlugin)
            │    └─ TablePlugin (if row has _selectPlugin)
            │         └─ TablePlugin (toolbar)
            │              └─ TableContainer (independent scroll!)
            │                   ├─ C1/D1 side-by-side
            │                   ├─ C2/D2 side-by-side
            │                   └─ C3/D3 side-by-side
            └─ B2Section (pure, skips if A2 already rendered)
```

### What We Preserve
✅ All column routing logic (fixedColumns vs scrollingColumns)
✅ productTable template configuration
✅ Drag/drop column behavior (D1 → C1)
✅ View mode switching and aggregate recalculation
✅ Plugin socket functionality (ToolbarPlugin)
✅ Expand/collapse behavior

### What We Gain
✅ Pure, reusable A/B sections
✅ Plugin rows with independent scroll
✅ No section prop dependencies
✅ No hardcoded knowledge in sections
✅ Extensible architecture (any row can have custom renderer)

### What We Eliminate
❌ section='A2'/'B2' prop
❌ Dual NestedTable calls
❌ shouldApplyTablePlugin in A2/B2
❌ Hardcoded NestedTable imports in A2/B2
❌ Toolbar/spacer conditional rendering
❌ Shared scroll limitation

