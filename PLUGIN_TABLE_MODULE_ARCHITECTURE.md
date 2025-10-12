# Plugin Table Module Architecture

## Executive Summary

The Plugin Table Module is a **visual analytical query language** for retail intelligence. It enables non-technical users to perform sophisticated statistical analysis through drag-and-drop interactions, building complex queries by composing filter plugins, and enabling cross-table "chain analysis" for comparative insights.

### Core Innovation
Users drag filter plugins (Product, Metric, Time) into slots to build queries visually. Populated tables generate draggable Row/Column plugins that carry context, enabling compound analysis across multiple table instances. This creates a powerful exploratory data analysis interface without requiring SQL or coding knowledge.

---

## Vision: The End Goal

### Multi-Dimensional Retail Analysis Platform

**Example Workflow:**
1. **Table 1**: Top 20 products by Net Sales (shows Product + Qty)
2. **Table 2**: Top 20 products by Attach Rate (shows Product + Qty)
3. **Table 3**: User drags products from Table 1 & 2 → Bundle Analysis
   - Which T1 high-net-sales products bundle frequently with T2 high-attach products?
   - Which high-net products rank LOW in bundles?
   - Which high-attach products rank LOW in net sales?

### Advanced Features (Future)

**Nested Row Analysis:**
- Row plugins have "nested table" toggle
- Opens sub-rows where OTHER row plugins can be dropped
- Create product groups for deep-dive comparison
- Compare nested groups against stock-out history, seasonal patterns, foot traffic

**Chain Analysis Dimensions:**
- Bundle velocity × Time of day/week/month
- Sales timing → likelihood prediction models
- Confounding variable overlay (stock levels, weather, traffic)

**Statistical Validation:**
- P-test / T-test buttons integrated throughout
- Correlation significance testing on-demand
- "Shadow trend" detection: Did Product A stock-out affect bundled Product B sales?
- Product substitution pattern identification during stock-outs

---

## Current Architecture (v0.2 - Plugin Configuration System)

### File Structure

```
src-new/core/components/
├── module/table/container/          # State management layer
│   ├── TableWorkspace.jsx          # Stateless router
│   ├── TableController.jsx         # ✅ STATE OWNER (renamed from TableToolbar)
│   ├── TableHeader.jsx             # Manages columnState
│   ├── TableBody.jsx               # Manages cellState + expandedRows
│   └── TableFooter.jsx             # Stateless footer router
│
├── custom/table/                    # Pure rendering layer
│   ├── TableContainer.jsx          # Scroll sync orchestrator
│   └── sections/
│       ├── A/                      # Fixed column sections
│       │   ├── A1.jsx              # Header (fixed)
│       │   ├── A2.jsx              # Body (fixed)
│       │   └── A3.jsx              # Footer (fixed)
│       └── B/                      # Scrolling column sections
│           ├── B1.jsx              # Header (scrolling)
│           ├── B2.jsx              # Body (scrolling)
│           └── B3.jsx              # Footer (scrolling)
│
└── plugins/                         # Plugin system
    ├── PluginToolbar.jsx           # ✅ Drag palette (dual mode: Out/In)
    ├── PluginController.jsx        # ✅ Query builder orchestrator
    ├── PluginInsert.jsx            # ✅ Filter slot receiver (ControlPanel)
    ├── PluginSend.jsx              # ✅ Execute query toolbar
    ├── default/table/              # Insert plugin components
    │   ├── RowPlugin.jsx           # ✅ Row insert (draggable toolbar)
    │   ├── ColumnPlugin.jsx        # ✅ Column insert (draggable toolbar)
    │   └── TablePlugin.jsx         # ⚠️ OLD - ignore for module system
    ├── panels/                     # Dropdown panels
    │   ├── ProductPluginPanel.jsx  # Product filters
    │   ├── MetricPluginPanel.jsx   # Metric filters
    │   ├── TimePluginPanel.jsx     # Time filters
    │   ├── ElementPluginPanel.jsx  # Inventory/stock (placeholder)
    │   ├── TrendPluginPanel.jsx    # Foot traffic (placeholder)
    │   ├── TablePluginPanel.jsx    # Insert preview (placeholder)
    │   ├── RowPluginPanel.jsx      # ✅ Shows RowPlugin preview
    │   ├── ColumnPluginPanel.jsx   # ✅ Shows ColumnPlugin preview
    │   └── CellPlugin.jsx          # Insert preview (placeholder)
    └── buttons/
        └── PluginButton.jsx        # Draggable plugin button component
```

---

## Component Hierarchy & State Flow

### State Ownership Map

```
TableWorkspace (stateless orchestrator)
  │
  └─ TableController (STATE OWNER)
      │
      ├─ State Managed:
      │   ├─ activeTab: string | null      # Which plugin panel is open
      │   ├─ isOpen: boolean               # Is dropdown open
      │   └─ viewMode: string              # 'drag' | 'send' | 'insert'
      │
      ├─ PluginToolbar (receives state, manages internal viewMode)
      │   ├─ Dual Mode System:
      │   │   ├─ "Out" mode → Filter plugins (Product/Metric/Time/Element/Trend)
      │   │   └─ "In" mode → Insert plugins (Table/Row/Column/Cell)
      │   │
      │   └─ Dropdown Panels (opened via activeTab)
      │       ├─ ProductPluginPanel → PluginRack with filter buttons
      │       ├─ MetricPluginPanel → PluginRack with metric buttons
      │       ├─ TimePluginPanel → PluginRack with time buttons
      │       ├─ ElementPluginPanel → PluginRack (placeholder)
      │       ├─ TrendPluginPanel → PluginRack (placeholder)
      │       ├─ RowPluginPanel → Shows RowPlugin preview with drop zone
      │       ├─ ColumnPluginPanel → Shows ColumnPlugin preview with drop zone
      │       ├─ TablePluginPanel → Placeholder
      │       └─ CellPluginPanel → Placeholder
      │
      ├─ PluginController (query builder orchestrator)
      │   ├─ PluginInsert → 5 filter slots in ControlPanel
      │   └─ PluginSend → Execute button in Toolbar
      │
      └─ TableContainer
          │
          ├─ TableHeader (manages columnState)
          │   ├─ A1Section (fixed column headers)
          │   └─ B1Section (scrolling column headers)
          │
          ├─ TableBody (manages cellState + expandedRows)
          │   ├─ A2Section (fixed column body)
          │   └─ B2Section (scrolling column body)
          │
          └─ TableFooter
              ├─ A3Section (fixed column footer)
              └─ B3Section (scrolling column footer)
```

---

## 🆕 Plugin Configuration System (v0.2 - NEW)

### Overview

**NEW DISCOVERY (2025-10-11):** The plugin configuration flow is fundamentally different than originally conceived. Insert plugins are **configured by dropping filter slots onto them**, then **dragged into table sections** to determine scope.

### Two-Stage Drag-Drop Flow

#### Stage 1: Configure Insert Plugin with Filter Slot

```
1. User opens "In" mode → clicks Row/Column/Table/Cell button
2. Dropdown shows preview toolbar with drop zone (left content)
3. User drags filter slot (Product/Metric/Time) from PluginInsert
4. Drops slot onto preview toolbar drop zone
5. Preview toolbar ACTIVATES:
   - Shows filter icon in drop zone
   - Becomes draggable
   - Changes appearance (from gray inactive → normal colors)
```

**Example:**
```
Drag PRODUCT slot → Drop on RowPlugin preview
  → RowPlugin shows 👕 shirt icon
  → RowPlugin becomes draggable
  → RowPlugin is now "Product Row Plugin"
```

#### Stage 2: Place Configured Plugin in Table

```
6. User drags activated preview toolbar
7. Drops into table section (A1, A2, B1, etc.)
8. Drop location determines SCOPE configuration:
```

**Row Plugin Drop Locations:**
- **A1 (header)** → `includeAll: "products"` → ALL product rows populate A2
- **A2 (body)** → `includeOnly: "this_product"` → ONLY specific product row

**Column Plugin Drop Locations:**
- **B1 (header)** → Metric column for ALL rows
- **B2 (body)** → NOT ALLOWED (for now)

### Visual Example

```
┌──────────────────────────────────────────────┐
│ PluginToolbar - "In" Mode Active            │
│ [Out] [In*] [Table][Row][Column][Cell]      │
├──────────────────────────────────────────────┤
│ Row Dropdown Panel (opened)                 │
│                                              │
│ RowPlugin Preview:                           │
│ ┌─────────────────────────────────┐         │
│ │ [📥 Drop Zone] ─────────────    │  ← INACTIVE (gray)
│ └─────────────────────────────────┘         │
│                                              │
│ User drags Product slot from PluginInsert   │
│               ↓ DROP                         │
│                                              │
│ ┌─────────────────────────────────┐         │
│ │ [👕 Product] ───────────────    │  ← ACTIVE (draggable)
│ └─────────────────────────────────┘         │
└──────────────────────────────────────────────┘
         ↓ DRAG ACTIVATED PREVIEW
         ↓
┌──────────────────────────────────────────────┐
│ Table Section A1 (Header)                   │
│ [Highlight on drag over - GREEN GLOW]       │
└──────────────────────────────────────────────┘
         ↓ DROP
         ↓
┌──────────────────────────────────────────────┐
│ Table Section A1 (Header)                   │
│ [👕 Product Row Plugin - All Products]      │
└──────────────────────────────────────────────┘
         ↓ TABLE UNDERSTANDS
         ↓
A2 (Body) auto-populates with ALL product rows
```

### Configuration Mapping

**Slot Type → Plugin Type:**
- Product slot → Product Row Plugin (controls WHAT items)
- Metric slot → Metric Column Plugin (controls WHAT measurements)
- Time slot → Time Row/Column Plugin (controls WHEN segmentation - TBD)
- Element slot → Inventory context (future)
- Trend slot → Traffic/weather context (future)

**Drop Location → Scope:**
- **A1 (header)** → `includeAll` → Generates multiple rows
- **A2 (body)** → `includeOnly` → Single specific row
- **B1 (header)** → Metric for all rows
- **B2 (body)** → NOT ALLOWED (for now)

### Simple Query Example

**User Actions:**
1. Drag Product slot → Drop on RowPlugin preview → Activates
2. Drag activated RowPlugin → Drop in A1
3. Drag Metric slot → Drop on ColumnPlugin preview → Activates
4. Drag activated ColumnPlugin → Drop in B1

**Result:**
```
Table Configuration:
- A1: Product Row Plugin (includeAll)
- B1: Revenue Column Plugin (for all rows)

Query Generated:
- Fetch ALL products
- Calculate Revenue metric for each product
- Render in table

Visual Output:
┌──────────┬──────────┐
│ Product  │ Revenue  │  ← A1 + B1 headers
├──────────┼──────────┤
│ Nike     │ $15,420  │  ← A2 body rows
│ Adidas   │ $12,300  │
│ Puma     │ $9,800   │
└──────────┴──────────┘
```

### Key Insights

1. **Filter slots are NOT dragged individually into cells**
   - OLD idea: Drag "Nike" button → Drop in cell
   - NEW idea: Drag "Product" slot → Configure RowPlugin → Place in table

2. **Insert plugins are configuration containers**
   - They receive slot assignments
   - Slot type determines plugin behavior
   - Drop location determines scope

3. **Multi-dimensional queries through slot combinations**
   - RowPlugin with Product + Time = Product rows segmented by time
   - ColumnPlugin with Metric + Time = Metrics for each time period
   - Complex matrix queries possible

4. **Separation of concerns**
   - **PluginInsert** = Slot provider (filter types)
   - **Preview Panels** = Configuration UI (assign slots to inserts)
   - **Table Sections** = Placement targets (determine scope)
   - **TableController** = Orchestrator (maps everything to query)

### Implementation Status (v0.2)

**✅ COMPLETED:**
- TableController created (renamed from TableToolbar)
- PluginController component structure
- PluginInsert with 5 slots in ControlPanel
- PluginSend with execute button in Toolbar
- RowPlugin preview in RowPluginPanel
- ColumnPlugin preview in ColumnPluginPanel
- All components wired into TableController

**🔨 NEXT (Phase 1):**
- Make slots in PluginInsert draggable
- Add drop zones to RowPlugin/ColumnPlugin previews
- Visual feedback on hover
- Drop handler that activates preview
- Icon rendering after slot assignment

**📋 TODO (Phase 2):**
- Make activated previews draggable
- Add drop zones to A1/A2/B1 sections
- Visual feedback (glows, borders) on drag over
- Block invalid drops (e.g., ColumnPlugin in A2)
- Store configuration in cellState/columnState

---

## Critical Architecture Patterns

### 1. State Management Strategy

**TableController owns ALL plugin UI state:**
```javascript
// TableController.jsx (lines 14-16)
const [activeTab, setActiveTab] = useState(null);
const [isOpen, setIsOpen] = useState(false);
const [viewMode, setViewMode] = useState('drag');
```

**Why this matters:**
- Single source of truth for plugin toolbar state
- Prevents duplicate state bugs (lesson learned from earlier session)
- Pattern mirrors Analytics.jsx where parent owns state, children receive props

**⚠️ CRITICAL: Do NOT move this state to TableWorkspace or PluginToolbar**

---

### 2. Cell/Column State Management

**TableBody manages cellState:**
```javascript
// TableBody.jsx (lines 28-29)
const [cellState, setCellState] = useState({});
const [expandedRows, setExpandedRows] = useState({});

// Cell keys: `${rowId}_${columnKey}`
// Example: "row-1_revenue" → stores plugin data for that cell
```

**TableHeader manages columnState:**
```javascript
// TableHeader.jsx (line 24)
const [columnState, setColumnState] = useState({});

// Column keys: columnKey (e.g., "revenue")
// Stores plugin data for entire column
```

**⚠️ CRITICAL: This state structure is fundamental**
- `cellState` and `columnState` will store filter plugin configurations
- When PluginController builds queries, it reads from these state objects
- Do not refactor these without understanding downstream dependencies

---

### 3. Plugin Data Structure (Draft)

**Filter Plugin Button Data:**
```javascript
{
  type: 'product' | 'metric' | 'time' | 'element' | 'trend',
  id: string,                    // Unique identifier
  label: string,                 // Display label
  icon: IconComponent,           // Tabler icon
  config: {                      // Filter-specific configuration
    // Product example:
    scope: 'single' | 'category' | 'all',
    productIds: string[],

    // Metric example:
    metricType: 'revenue' | 'units' | 'aov' | 'attach_rate',
    aggregation: 'sum' | 'mean' | 'count',

    // Time example:
    range: { start: Date, end: Date },
    segmentation: 'day' | 'week' | 'month' | 'quarter'
  }
}
```

**⚠️ TODO: Finalize this schema before building PluginController**

---

### 4. Drag-Drop System

**Current Implementation:**
- Uses `useDragDrop` hook (see `TablePlugin.jsx` line 127)
- DRAG_TYPES defined in `core/utils/dragDropTypes.js`
- Data serialized as JSON in `dataTransfer.setData('text/plain', serialized)`

**Filter Plugin Drag Flow:**
```
User clicks plugin button in PluginRack
  → onDragStart fires
  → Serializes plugin config to JSON
  → Sets dataTransfer data

User drops in cell/column
  → onDrop fires in A2/B2 section
  → Deserializes JSON
  → Calls handleCellDrop / handleColumnDrop
  → Updates cellState / columnState
```

**⚠️ CRITICAL: Must maintain this pattern for consistency**

---

## Data Pipeline (Future Integration)

### Current Data Flow (Not Yet Implemented)

```
PluginController
  ├─ Reads: cellState / columnState
  ├─ Interprets: Filter plugin configurations
  ├─ Builds: Query object
  │
  └─> dataService.js
       ├─ Executes: Data fetching based on query
       ├─ Calls: custom/table/dataConfig.js (calculations)
       │    └─> core/calculations/* (KPI functions)
       │
       └─> Returns: Processed data
            └─> TableContainer renders
```

### Key Files to Integrate (Phase 2)

**dataService.js:**
- Currently loads raw CSV data
- Will need query parameter support
- Must handle Product × Metric × Time combinations

**custom/table/dataConfig.js:**
- Defines calculation schemas
- Maps metric types to calculation functions
- Needs review before integration

**core/calculations/***
- Robust library of cascading calculation props
- Needs careful evaluation for metric premise
- ⚠️ **CRITICAL: Review this library before wiring up metrics**

---

## PluginController Design (Next Step)

### Component Structure (To Build)

```javascript
// PluginController.jsx (NEW FILE)
export default function PluginController({
  tableId,              // Unique identifier for this table instance
  onQueryChange,        // Callback when query configuration changes
  cellState,            // Read from TableBody
  columnState,          // Read from TableHeader
  ...props
}) {

  return (
    <div className="plugin-controller-panel">
      {/* Query Builder UI */}
      <PluginInsert
        slots={['product', 'metric', 'time']}
        onSlotFill={(slot, pluginData) => handleSlotFill(slot, pluginData)}
      />

      {/* Query Output */}
      <PluginSend
        queryConfig={buildQuery(cellState, columnState)}
        onExecute={handleExecuteQuery}
      />
    </div>
  );
}
```

### PluginInsert Design (Slot Receiver)

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│ PluginInsert - Query Builder           │
├─────────────────────────────────────────┤
│                                         │
│  [PRODUCT]    [METRIC]    [TIME]       │
│  Drop here    Drop here   Drop here    │
│                                         │
│  [Element]    [Trend]                  │
│  Drop here    Drop here                │
│                                         │
└─────────────────────────────────────────┘
```

**Slot States:**
- Empty: Gray dashed border, "Drop here" text
- Filled: Shows plugin button, can be removed
- Validated: Green border when query is complete

**Style Matching PluginToolbar:**
- Same gradient backgrounds: `bg-gradient-to-b from-gray-50 via-white to-gray-200`
- Same padding/spacing conventions
- Same icon sizing (20px for main icons)
- Same rounded corners and shadows

---

## Chain Analysis System (Future)

### Row/Column Plugin Generation

**When table populates with data:**
1. Each row becomes a potential **Row Plugin**
2. Each column becomes a potential **Column Plugin**
3. These plugins are **draggable with context**

**Row Plugin Context:**
```javascript
{
  type: 'row',
  sourceTableId: 'table-1',
  productId: 'nike-air-max-001',
  rowData: {
    product_name: 'Nike Air Max',
    net_sales: 15420.50,
    qty_sold: 87,
    // ... all row data
  },
  sourceQuery: {
    // Original query that generated this row
    product: {...},
    metric: {...},
    time: {...}
  }
}
```

**Column Plugin Context:**
```javascript
{
  type: 'column',
  sourceTableId: 'table-1',
  metricKey: 'net_sales',
  columnData: [/* all values */],
  aggregations: {
    sum: 154205.50,
    mean: 1542.05,
    count: 100
  },
  sourceQuery: {/* ... */}
}
```

### Cross-Table Drop Flow

```
User drags Row Plugin from Table 1
  → Drop onto Table 2's PluginController
  → Table 2 reads sourceQuery + rowData
  → Builds compound query:
      - Table 2's original filters
      - + Row Plugin context (product, metrics)
  → Executes comparative analysis
  → Renders results showing correlation
```

**⚠️ CRITICAL: Context preservation is key to chain analysis power**

---

## Nested Table Feature (Advanced)

### Concept

**Row Plugin Enhancement:**
- Add "nested table" toggle button to Row Plugin
- When toggled: Row expands, reveals sub-rows
- Sub-rows are **drop zones** for other Row Plugins
- Creates product groups for comparison

**Use Case:**
```
Table 3: Bundle Analysis
├─ Nike Air Max (from Table 1)
│   ├─ [nested] Adidas Superstar (dropped)
│   ├─ [nested] Puma Suede (dropped)
│   └─ Analysis: Bundle frequency between Nike + these products
│
└─ Under Armour Hovr (from Table 1)
    ├─ [nested] Nike React (dropped)
    └─ Analysis: Substitution patterns when UA out of stock
```

**Technical Approach:**
- Nested state in `expandedRows`: `expandedRows[rowId].nestedRows = []`
- Each nested row has its own `cellState` sub-object
- Query builder interprets nested structure for compound analysis

---

## Statistical Analysis Integration (Future)

### P-Test / T-Test Buttons

**Placement:**
- Next to metric columns in table headers
- In PluginController when query involves comparison
- In nested table toolbars

**Flow:**
```
User clicks [P-Test] on "Net Sales" column
  → Modal opens with test parameters
  → User selects comparison groups
  → Calculation runs (via core/calculations/statistical.js)
  → Results display: p-value, confidence interval, significance
```

### Shadow Trend Detection

**Algorithm Concept:**
```
For Product A (high attach rate) + Product B (bundled with A):
  1. Identify stock-out periods for Product A
  2. Measure Product B sales during those periods
  3. Compare to Product B baseline (when A in stock)
  4. Calculate correlation coefficient
  5. Test significance
  6. Display: "Product B sales decreased 23% (p<0.05) when Product A out of stock"
```

**Data Requirements:**
- Stock level history (Element filter plugins)
- Sales velocity timestamps
- Bundle transaction data
- Statistical calculation library integration

---

## Packaged Table Instance (Final Form)

### ModularTable.jsx (Future Package)

```javascript
// Single self-contained table instance
export default function ModularTable({
  id,                    // Unique table identifier
  workspace,             // Parent workspace context
  initialQuery = null,   // Optional pre-filled query
  allowChainAnalysis = true,
  ...props
}) {
  return (
    <div className="modular-table-instance">
      <TableController>
        <PluginController
          tableId={id}
          workspace={workspace}
        />
        <PluginToolbar />
        <TableContainer>
          {/* Full table system */}
        </TableContainer>
      </TableController>
    </div>
  );
}
```

### Workspace Integration

```javascript
// Workspace.jsx
export default function Workspace() {
  const [tables, setTables] = useState([
    { id: 't1', query: null },
    { id: 't2', query: null },
    { id: 't3', query: null }
  ]);

  return (
    <div className="workspace">
      {tables.map(table => (
        <ModularTable
          key={table.id}
          id={table.id}
          workspace={workspaceContext}
          initialQuery={table.query}
        />
      ))}
    </div>
  );
}
```

---

## Critical Refactoring Considerations

### ⚠️ DO NOT TOUCH (Without Careful Planning)

1. **State ownership in TableController**
   - Moving state will break the entire plugin system
   - Pattern was hard-won after debugging session

2. **cellState / columnState structure**
   - Keys like `${rowId}_${columnKey}` are used throughout
   - Changing format requires updates in all sections (A1/A2/A3/B1/B2/B3)

3. **TableContainer scroll sync logic**
   - Lines 78-123 in TableContainer.jsx
   - Complex ref coordination, touch only if necessary

4. **Drag-drop serialization pattern**
   - JSON serialization in dataTransfer
   - Changing this requires updates across all plugin components

### ⚠️ APPROACH DELICATELY

1. **core/calculations/ library**
   - Existing calculation props may have interdependencies
   - Must map carefully to metric plugin configurations
   - Review before wiring up

2. **dataService.js query expansion**
   - Currently loads flat CSV data
   - Adding query parameters will require schema changes
   - Must maintain backward compatibility

3. **PluginController query builder logic**
   - This is NEW and will set patterns for entire system
   - Design carefully before implementing

---

## Development Stages (Actionable Roadmap)

### ✅ COMPLETED (v0.1)

- [x] State management architecture (TableController owns state)
- [x] PluginToolbar dual-mode UI (Out/In)
- [x] Filter panel dropdowns (Product/Metric/Time/Element/Trend)
- [x] PluginRack component for draggable buttons
- [x] Insert panel previews (Table/Row/Column/Cell placeholders)
- [x] TableBody/TableHeader state management (cellState/columnState)

### 🔨 IN PROGRESS (v0.2)

- [ ] PluginController component structure
- [ ] PluginInsert slot receiver UI
- [ ] PluginSend query output component
- [ ] Filter plugin drop handling in cells/columns
- [ ] Query configuration builder logic

### 📋 STAGE 1: Query System (v0.3)

**Goal:** User can drag filters into slots and generate queries

- [ ] Finalize plugin data schema
- [ ] Build PluginInsert UI (3 slots: Product, Metric, Time)
- [ ] Implement slot validation (type checking)
- [ ] Connect slots to cellState/columnState
- [ ] Build query interpreter (filters → query object)
- [ ] Visual feedback for complete/incomplete queries

### 📋 STAGE 2: Data Integration (v0.4)

**Goal:** Queries execute and tables populate with real data

- [ ] Review core/calculations library
- [ ] Map metric types to calculation functions
- [ ] Extend dataService.js for query parameters
- [ ] Connect PluginSend to dataService
- [ ] Wire query results to TableContainer
- [ ] Handle loading/error states

### 📋 STAGE 3: Row/Column Plugins (v0.5)

**Goal:** Populated tables generate draggable plugins with context

- [ ] Generate Row Plugins from populated data
- [ ] Generate Column Plugins from metrics
- [ ] Attach context to dragged plugins (sourceQuery, data)
- [ ] Implement drop handlers in PluginController
- [ ] Build compound query logic (original + dropped context)
- [ ] Test cross-table analysis

### 📋 STAGE 4: Package & Multi-Instance (v0.6)

**Goal:** Multiple table instances work together in workspace

- [ ] Package complete system into ModularTable.jsx
- [ ] Create Workspace orchestrator component
- [ ] Implement table-to-table communication
- [ ] Handle multiple simultaneous queries
- [ ] Chain analysis validation
- [ ] Performance optimization

### 📋 STAGE 5: Nested Tables (v0.7)

**Goal:** Row Plugins can expand and accept nested drops

- [ ] Add toggle to Row Plugin for nested mode
- [ ] Implement nested row drop zones
- [ ] Extend state management for nested structures
- [ ] Build nested query interpretation
- [ ] Group analysis logic
- [ ] Nested table rendering

### 📋 STAGE 6: Statistical Analysis (v0.8)

**Goal:** P-test, T-test, Shadow Trend detection

- [ ] Build statistical calculation functions
- [ ] Integrate p-test / t-test UI buttons
- [ ] Create analysis modals/panels
- [ ] Shadow trend algorithm implementation
- [ ] Correlation detection system
- [ ] Significance testing UI

### 📋 STAGE 7: Advanced Features (v1.0)

**Goal:** Full retail intelligence platform

- [ ] Element filters (inventory/stock integration)
- [ ] Trend filters (foot traffic, weather API)
- [ ] Time-dimension deep analysis (hour/day/week/month)
- [ ] Bundle velocity prediction models
- [ ] Confounding variable overlay
- [ ] Product substitution pattern detection
- [ ] Export/sharing capabilities

---

## Key Technical Decisions Needed

### Before Building PluginController:

1. **Plugin data schema finalization**
   - What exactly does each filter config contain?
   - How do we serialize/deserialize configurations?
   - Version the schema for future backward compatibility?

2. **Query object structure**
   - What format does dataService.js expect?
   - How do we represent Product × Metric × Time combinations?
   - How do we encode chain analysis context?

3. **Slot validation rules**
   - Can slots accept multiple plugins (stacking)?
   - Or one plugin per slot (replacement)?
   - Can user reorder plugins in slots?

4. **Query execution trigger**
   - Auto-execute on slot fill?
   - Manual "Run Query" button?
   - Both modes with preference?

### Before Data Integration:

1. **Calculation library mapping**
   - Which core/calculations functions map to which metrics?
   - Are there missing calculations we need?
   - How do we handle metric dependencies (cascading props)?

2. **Performance considerations**
   - Cache query results?
   - Debounce query execution?
   - Background data fetching?

3. **Error handling strategy**
   - Invalid query combinations?
   - Missing data scenarios?
   - API failures?

---

## Notes for Future Self

### Why This Architecture?

**State Management:**
- TableController owns plugin UI state to prevent duplication bugs
- This pattern was discovered after painful debugging session
- DO NOT change without understanding the Analytics.jsx reference pattern

**Separation of Concerns:**
- `module/container/` = state logic
- `custom/table/` = pure rendering
- `plugins/` = configuration UI
- This separation enables packaging into single component later

**cellState/columnState Keys:**
- Format: `${rowId}_${columnKey}` for cells, `columnKey` for columns
- Consistent across all sections (A1/A2/A3/B1/B2/B3)
- Used for plugin data storage AND query building

**Drag-Drop Pattern:**
- JSON serialization ensures portability
- Works across all plugin types consistently
- Easy to debug (just console.log the JSON)

### Common Pitfalls to Avoid

1. **Don't move state to PluginToolbar**
   - It needs to receive state as props, not manage it
   - Internal viewMode is fine, but activeTab/isOpen must come from parent

2. **Don't break cellState key format**
   - Many components depend on `rowId_columnKey` pattern
   - Changing this cascades everywhere

3. **Don't skip query validation**
   - Invalid queries will crash dataService
   - Always validate before execution

4. **Don't forget context in chain analysis**
   - Row/Column plugins MUST carry their source query context
   - Otherwise comparative analysis is meaningless

### What Makes This Special

This isn't just another table component. It's a **visual programming interface for data analysis**. Users compose queries like Lego blocks, stack analyses, and discover insights through exploration rather than SQL queries.

The drag-drop interface lowers the barrier to sophisticated statistical analysis, making retail intelligence accessible to non-technical users while maintaining the power of programmatic queries.

**This is the goal. This is what we're building.**

---

## References

### Key Files to Study

1. **Analytics.jsx** (`src/pages/Analytics.jsx`)
   - Reference pattern for state management
   - Parent owns state, children receive props
   - This pattern informed TableController design

2. **TablePlugin.jsx** (`plugins/default/table/TablePlugin.jsx`)
   - Example of complex plugin with nested tables
   - Shows drag-drop implementation patterns
   - NOTE: This is OLD system, separate from module system

3. **useDragDrop.js** (`core/hooks/useDragDrop.js`)
   - Drag-drop utility functions
   - Serialization/deserialization helpers

4. **DRAG_TYPES.js** (`core/utils/dragDropTypes.js`)
   - Defined drag type constants
   - Ensures consistency across plugin types

### Related Documentation

- `MODULAR_TABLE_PLAN.md` - Original planning doc
- `COMPREHENSIVE_ANALYSIS_REPORT.txt` - Earlier architecture analysis
- Custom table README (if exists in custom/table/)

---

**Last Updated:** 2025-10-11
**Version:** 0.1 (Foundation Complete)
**Next Milestone:** PluginController + PluginInsert implementation
