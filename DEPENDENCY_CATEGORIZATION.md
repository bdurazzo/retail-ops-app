# Dependency Categorization: Shortsighted vs Bloated

## Shortsighted Dependencies
*Can be moved to template config, plugin system, or other configuration*

### 1. A2/B2 → NestedTable (hardcoded component import)
**Current:** `import NestedTable from '../../NestedTable.jsx';`

**Problem:** A2/B2 can only render NestedTable, nothing else

**Solution path:**
- Move to template config: `customRowRenderer` property
- OR: Plugin registry system where plugins register themselves
- OR: Row data carries `_renderer` property specifying what component to use

**Why shortsighted:**
- This should be configurable, not hardcoded
- Different use cases might want different nested renderers
- A2/B2 sections should be dumb about what they render

---

### 2. A2/B2 → shouldApplyRowPlugin (hardcoded decision logic)
**Current:** `import { shouldApplyRowPlugin } from '../../../../plugins/default/table/RowPlugin.jsx';`

**Problem:** A2/B2 have hardcoded logic for "when to use special rendering"

**Solution path:**
- Move decision to template config: `shouldRenderCustomRow(row, cellState)`
- OR: Check row property: `if (row._customRenderer) { ... }`
- OR: Plugin system provides the check function

**Why shortsighted:**
- Decision logic should be external configuration
- Different tables might have different rules for when to use custom rendering
- A2/B2 should not contain business logic

---

### 3. NestedTable → section prop ('A2' or 'B2')
**Current:** `section = 'A2'` prop that determines C vs D rendering

**Problem:** NestedTable needs to know where it's being called from

**Solution path:**
- C/D sections could be "skins" or "variants" that wrap the same data
- NestedTable could render BOTH C and D, let parent layout handle positioning
- OR: NestedTable renders once as unified component, uses CSS to split visually

**Why shortsighted:**
- Component shouldn't care about caller's identity
- This is a symptom of the split rendering pattern
- Should be solvable with better layout strategy

---

### 4. RowPlugin → section prop (toolbar vs spacer logic)
**Current:** `section = 'A2'` to decide toolbar or spacer

**Problem:** RowPlugin needs to know it's being called twice

**Solution path:**
- RowPlugin shouldn't be called twice at all
- If NestedTable renders once, RowPlugin renders once
- Toolbar is just part of the unified component

**Why shortsighted:**
- This is compensation for the dual-call pattern
- Unnecessary if we fix the root issue
- RowPlugin should always render the same way

---

### 5. tableContainerWidth prop drilling
**Current:** TableContainer → TableBody → A2/B2 → NestedTable → RowPlugin

**Problem:** Deep prop drilling through multiple layers

**Solution path:**
- Use React Context (TableContext already exists)
- RowPlugin reads width from context directly
- OR: RowPlugin measures its own container

**Why shortsighted:**
- tableContext already exists but isn't used for this
- Prop drilling is fragile and verbose
- Context is the pattern for shared values

---

## Bloated/Unnecessary Abstraction

### 6. NestedTable → C/D sections (separate section components)
**Current:** C1/C2/C3 sections vs D1/D2/D3 sections (separate files/components)

**Analysis:**
- C sections are nearly identical to A sections (fixed columns)
- D sections are nearly identical to B sections (scrolling columns)
- Main difference: C/D are "nested" context

**Is this bloated?**
- YES: Duplicates A/B section code unnecessarily
- NO: Might need different styling/behavior for nested context

**Solution path:**
- Option A: Eliminate C/D entirely, NestedTable uses A/B sections directly
- Option B: C/D are just styling wrappers around A/B logic
- Option C: Keep C/D but as configuration variants, not separate components

**Verdict:** **BLOATED if C/D just duplicate A/B logic. Could be merged or refactored.**

---

### 7. RowPlugin wrapper around nested content
**Current:** RowPlugin wraps C/D sections, provides toolbar and expand/collapse

**Analysis:**
- RowPlugin provides: toolbar, expand state, configuration management
- But also: duplicates TableContainer concepts (layout, children wrapper)

**Is this bloated?**
- MAYBE: If NestedTable had its own TableContainer, would we need RowPlugin?
- RowPlugin provides toolbar which is valuable
- But the "wrapper" aspect might be duplicating TableContainer

**Solution path:**
- RowPlugin could be just the toolbar component
- NestedTable handles its own layout with TableContainer
- Eliminate the wrapper/children pattern from RowPlugin

**Verdict:** **PARTIALLY BLOATED. Toolbar is useful, wrapper pattern might be unnecessary.**

---

### 8. getRowPluginData helper function
**Current:** Searches cellState for matching row data

**Analysis:**
```javascript
export function getRowPluginData(row, cellState = {}) {
  const rowId = row?._rowId;
  const cellKey = Object.keys(cellState).find(key =>
    key.startsWith(`${rowId}_`)
  );
  return cellState[cellKey] || null;
}
```

**Is this bloated?**
- It's searching through all cellState keys to find one that matches
- cellState structure: `${rowId}_${colKey}` but we don't know the colKey
- Why not store plugin data directly on row: `row._pluginData`?

**Solution path:**
- Store plugin data on row object: `row._pluginData = { type, content, ... }`
- No need to search cellState
- Simpler, more direct

**Verdict:** **BLOATED. Overcomplicated lookup for data that could be on the row.**

---

### 9. Dual cellState keys (viewMode + sortState)
**Current:**
```javascript
const viewModeKey = `${rowId}_viewMode`;
const sortStateKey = `${rowId}_sortState`;
```

**Analysis:**
- View mode stored in cellState under special key
- Sort state stored in cellState under different special key
- Both are "meta" state, not cell content

**Is this bloated?**
- cellState is meant for cell content (what's dropped in cells)
- Using it for view mode and sort is overloading its purpose
- These could be separate state: `nestedTableState[rowId] = { viewMode, sortKey, sortDirection }`

**Solution path:**
- Separate state for nested table configuration
- cellState only for actual cell content
- Clearer separation of concerns

**Verdict:** **BLOATED. Mixing cell content with UI state.**

---

## Necessary/Legitimate Dependencies

### 10. expandedRows shared state
**Current:** Both A2 and B2 receive same expandedRows state

**Analysis:**
- If both halves (C and D) need to expand/collapse together, state must be shared
- This is coordination, not coupling

**Is this necessary?**
- YES if we keep the split rendering pattern
- NO if NestedTable renders once (single expand state, no coordination needed)

**Verdict:** **NECESSARY in current architecture, but symptom of deeper issue.**

---

### 11. cellState shared state
**Current:** Both A2 and B2 receive same cellState

**Analysis:**
- Similar to expandedRows - if rendering split, must share state
- cellState determines "is there plugin data for this row"

**Is this necessary?**
- YES in current architecture
- Could be eliminated if plugin data lives on row object

**Verdict:** **NECESSARY in current architecture, but can be simplified.**

---

### 12. C/D sections have no scroll container
**Current:** Just render content, rely on outer scroll

**Analysis:**
- This is THE core issue for independent scroll
- C and D sections appear side-by-side in outer table's layout
- Outer table has single scroll container
- For independent scroll, each nested table needs own scroll container

**Is this bloated/shortsighted?**
- Neither - it's a fundamental layout problem
- MUST solve this for independent scroll

**Solution paths:**
1. Wrap C+D together in single TableContainer (own scroll)
2. Break out of A2/B2 column layout (render full-width)
3. CSS tricks to create independent scroll while maintaining layout

**Verdict:** **CORE PROBLEM. Everything else is symptom or workaround.**

---

## Surgery Roadmap

### Phase 1: Eliminate Bloat
1. **Merge C/D into A/B** - Eliminate duplicate section components
2. **Plugin data on rows** - Stop using getRowPluginData, put data on row object
3. **Separate UI state** - Stop mixing view mode/sort in cellState
4. **Use TableContext** - Stop prop drilling tableContainerWidth

### Phase 2: Move Shortsighted to Config
5. **Template config for custom renderers** - Stop hardcoding NestedTable in A2/B2
6. **Row-based rendering decision** - Check `row._customRenderer` instead of shouldApplyRowPlugin

### Phase 3: Solve Core Layout Problem
7. **Independent scroll containers** - NestedTable gets own TableContainer
8. **Single NestedTable call** - Eliminate dual A2/B2 calls
9. **Full-width plugin rendering** - Break out of column layout when needed

### Phase 4: Cleanup
10. **Simplify RowPlugin** - Just toolbar, not wrapper
11. **Remove section prop** - No longer needed after single-call pattern

