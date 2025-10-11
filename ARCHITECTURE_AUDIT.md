# Table System Architecture Audit

## Overview
This document outlines the intended architecture for the table system and identifies areas where implementation deviated from design.

---

## Core Architecture Flow

### Data Pipeline
```
dataService → dataConfig → template → tableConfig → TableWorkspace → sections
```

**Each layer has a specific responsibility:**

1. **dataService** - Fetches and filters raw CSV data
2. **dataConfig** - Provides data manipulation using calculations system
3. **template** - Transforms data into table structure
4. **tableConfig** - Normalizes template output and handles column routing
5. **TableWorkspace** - Renders table using sections
6. **sections** - Individual UI components (A1, A2, B1, B2, C1, C2, etc.)

---

## Calculation System (src-new/core/calculations/)

### Purpose
Centralized calculation library to **minimize bloat** and **prevent duplication**.

### Structure
```
calculations/
├── math/              # Pure math functions
│   ├── basic.js       # sum, round, toNumber
│   ├── statistical.js # mean, median, variance
│   └── financial.js   # margins, discounts
├── operations/        # Data manipulation
│   └── aggregations.js # groupBy, sumField, averageField
├── business/          # Domain logic
│   ├── revenue.js
│   ├── inventory.js
│   └── orders.js
└── kpis/             # High-level metrics
    ├── performance.js
    └── efficiency.js
```

### Key Functions
- `groupBy(rows, field)` - Group data by field, returns Map
- `sumField(rows, fieldName)` - Sum numeric field
- `averageField(rows, fieldName)` - Average numeric field
- `aggregateGroups(groupedData, config)` - Aggregate with custom operations

### Usage Pattern
**✅ CORRECT:**
```javascript
import { groupBy, sumField } from '../../../calculations/index.js';

const groups = groupBy(data, 'color');
const total = sumField(data, 'quantity');
```

**❌ WRONG:**
```javascript
// Reimplementing aggregation logic in templates
const total = data.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
```

---

## dataConfig (src-new/core/components/custom/table/dataConfig.js)

### Purpose
**Bridge between dataService and templates.** Wraps calculation functions for table-specific use.

### What It Provides
1. `calculateTotals(data, fields)` - Calculate totals for footer
2. `groupDataBy(data, field)` - Group data (wraps calculations/groupBy)
3. `formatValue(key, value)` - Format numbers for display
4. Re-exports calculation functions for convenience

### What It Should NOT Do
- ❌ Transform data structure (that's template's job)
- ❌ Handle UI concerns (that's sections' job)

### Usage Pattern
```javascript
import { calculateTotals, sumField, groupBy } from './dataConfig.js';

// In template
const totals = calculateTotals(rows, ['quantity', 'net']);
const groups = groupBy(data, 'color');
```

---

## tableConfig (src-new/core/components/custom/table/tableConfig.js)

### Current State
**What it does:**
- `applyTemplate(data, template, options)` - Calls template, normalizes output
- `routeABColumns(columnKeys)` - Split columns for AB table
- `routeCDColumns(columnKeys)` - Split columns for CD table

**What it returns:**
```javascript
{
  rows,
  totals,
  columnKeys,
  columnLabels,
  styles,
  layout: { firstColWidth, metricColWidth, headerHeight, rowHeight, footerHeight }
}
```

### What It SHOULD Handle (Centralized Patterns)

#### 1. View Mode → Column Configuration
Multiple templates will need "switch columns based on view mode" logic.

**Should add:**
```javascript
export function getViewModeColumns(viewMode) {
  const columnConfigs = {
    'summary': ['product_name', 'quantity', 'net'],
    'by-color': ['product_name', 'color', 'quantity', 'net'],
    'by-size': ['product_name', 'size', 'quantity', 'net'],
    'by-variant': ['product_name', 'color', 'size', 'quantity', 'net']
  };

  return columnConfigs[viewMode] || columnConfigs.summary;
}
```

#### 2. Standard Column Labels
Consistent labels across all templates.

**Should add:**
```javascript
export function getStandardColumnLabels(columnKeys) {
  const standardLabels = {
    'product_name': 'Product',
    'color': 'Color',
    'size': 'Size',
    'quantity': 'Units',
    'net': 'Net',
    'discounted_price': 'Price',
    'order_id': 'Order',
    'date': 'Date'
    // ... more standard fields
  };

  const labels = {};
  columnKeys.forEach(key => {
    labels[key] = standardLabels[key] || key; // Fallback to field name
  });

  return labels;
}
```

#### 3. Column Width Defaults
Different column types have standard widths.

**Should add:**
```javascript
export function getColumnWidths(columnKeys) {
  const widthMap = {
    'product_name': 200,
    'color': 100,
    'size': 80,
    'quantity': 80,
    'net': 100,
    'date': 120,
    'order_id': 100
  };

  const widths = {};
  columnKeys.forEach(key => {
    widths[key] = widthMap[key] || 100; // Default 100px
  });

  return widths;
}
```

#### 4. Totals Configuration
Which columns should have totals calculated.

**Should add:**
```javascript
export function getTotalableColumns(columnKeys) {
  const totalableTypes = ['quantity', 'net', 'revenue', 'price', 'discounted_price'];

  return columnKeys.filter(key =>
    totalableTypes.some(type => key.includes(type))
  );
}
```

### What It Should NOT Handle
- ❌ **Transform functions** (by-color, by-size logic) - that's template-specific
- ❌ **Styles** - that's template-specific
- ❌ **Business logic** - that's dataConfig/calculations

---

## Templates (src-new/core/components/custom/table/templates/)

### Purpose
Transform raw data into table structure. **Data transformation only.**

### What Templates Should Do
1. Accept `(data, options)` - options include viewMode, custom config
2. Call **dataConfig** for calculations (totals, grouping)
3. Call **tableConfig** for column configuration
4. Return structured output: `{ rows, totals, columnKeys, columnLabels, styles, layout }`

### productTable.js - Current Issues

**❌ Problem 1: Hardcoded columnKeys**
```javascript
// Current - WRONG
columnKeys = ['product_name', 'color', 'size', 'quantity', 'net']
```

**✅ Should be:**
```javascript
import { getViewModeColumns } from '../tableConfig.js';

const { viewMode = 'summary' } = options;
const columnKeys = getViewModeColumns(viewMode);
```

**❌ Problem 2: Hardcoded columnLabels**
```javascript
// Current - WRONG
columnLabels = {
  'product_name': 'Product',
  'color': 'Color',
  // ...
}
```

**✅ Should be:**
```javascript
import { getStandardColumnLabels } from '../tableConfig.js';

const columnLabels = getStandardColumnLabels(columnKeys);
```

**❌ Problem 3: Manual aggregation**
```javascript
// Current - WRONG
const totalNet = items.reduce((sum, item) => {
  const price = parseFloat(item.discounted_price) || 0;
  const qty = parseFloat(item.quantity) || 0;
  return sum + (price * qty);
}, 0);
```

**✅ Should be:**
```javascript
import { sumField } from '../dataConfig.js';

// Create calculated field first
const itemsWithNet = items.map(item => ({
  ...item,
  net: (parseFloat(item.discounted_price) || 0) * (parseFloat(item.quantity) || 0)
}));

const totalNet = sumField(itemsWithNet, 'net');
```

### Transform Functions (Correct Location)
Transform functions (transformSummaryView, transformByColorView, etc.) **belong in productTable** because they're data-specific. tableConfig just provides the column list.

---

## NestedTable (src-new/core/components/custom/table/NestedTable.jsx)

### Current Issues

**❌ Problem 1: Bypassing tableConfig**
```javascript
// Current - WRONG
const tableOutput = productTable(productData, { viewMode });
const fixedColumns = tableOutput.columnKeys.slice(0, 1);
const scrollingColumns = tableOutput.columnKeys.slice(1);
```

**✅ Should be:**
```javascript
import { applyTemplate, routeCDColumns } from './tableConfig.js';

const tableProps = applyTemplate(productData, productTable, { viewMode });
const { fixedColumns, scrollingColumns } = routeCDColumns(tableProps.columnKeys);
```

**❌ Problem 2: Manual layout handling**
```javascript
// Current - WRONG
const nestedTableContext = {
  firstColWidth: tableOutput.layout?.firstColWidth || DEFAULT_LAYOUT.firstColWidth,
  // ...manually handling fallbacks
};
```

**✅ Should be:**
```javascript
const nestedTableContext = {
  ...tableProps.layout,  // applyTemplate already handled fallbacks
  // ... other context
};
```

---

## Key Principles

### 1. Don't Repeat Yourself (DRY)
- ✅ Use **calculations/** for math
- ✅ Use **dataConfig** for table-specific data operations
- ✅ Use **tableConfig** for column/layout patterns
- ❌ Don't reimplement aggregations in templates

### 2. Separation of Concerns
- **calculations/** = Pure functions, no UI knowledge
- **dataConfig** = Data operations, no UI knowledge
- **tableConfig** = Column/layout patterns, minimal logic
- **templates** = Data transformation, structure only
- **sections** = UI rendering only

### 3. Data Flow
Always follow: `dataService → dataConfig → template → tableConfig → UI`

Never skip layers or bypass the architecture.

---

## Action Items

### Immediate Fixes Needed

1. **tableConfig enhancements:**
   - [ ] Add `getViewModeColumns(viewMode)`
   - [ ] Add `getStandardColumnLabels(columnKeys)`
   - [ ] Add `getColumnWidths(columnKeys)`
   - [ ] Add `getTotalableColumns(columnKeys)`

2. **productTable.js refactor:**
   - [ ] Use `getViewModeColumns()` instead of hardcoded columnKeys
   - [ ] Use `getStandardColumnLabels()` instead of hardcoded labels
   - [ ] Use dataConfig/calculations for all aggregations
   - [ ] Remove manual reduce() operations

3. **NestedTable.jsx refactor:**
   - [ ] Use `applyTemplate()` instead of calling productTable directly
   - [ ] Use `routeCDColumns()` instead of manual slice
   - [ ] Use `tableProps.layout` instead of manual fallbacks

4. **Documentation:**
   - [ ] Keep this audit updated as architecture evolves
   - [ ] Add inline comments explaining why each layer exists

---

## Future Considerations

### Multi-View Support
As more templates need view modes, consider:
- Registry pattern for view mode configurations
- Plugin system for custom view modes

### Column Customization
Some templates may need non-standard columns:
- Allow override in options: `options.columnKeys`
- Merge with standard labels: `{ ...standard, ...custom }`

### Performance
- Memoize column configurations
- Cache calculation results when appropriate

---

## Quick Reference

### When to use what:

**Need to do math?** → `calculations/`
```javascript
import { sum, mean, groupBy } from '../../../calculations/index.js';
```

**Need to aggregate for tables?** → `dataConfig`
```javascript
import { calculateTotals, sumField } from './dataConfig.js';
```

**Need column configuration?** → `tableConfig`
```javascript
import { getViewModeColumns, getStandardColumnLabels } from './tableConfig.js';
```

**Need to transform data structure?** → `template`
```javascript
export function productTable(data, options) {
  // Use above helpers, return structured output
}
```

**Need to normalize template output?** → `applyTemplate()`
```javascript
const tableProps = applyTemplate(data, productTable, options);
```

---

## Contact
If you're Claude reading this after a conversation reset, this architecture was established to prevent bloat and maintain clean separation of concerns. **Always check this document before coding table features.**

---

## Plugin System (src-new/core/components/plugins/)

### Purpose
Modular system for connecting data between table rows and other components. Enables "Send" and "Insert" operations without hard-coding connections.

### Architecture

**Plugin Config** (`pluginConfig.js`)
- Defines data types: `TABLE_DATA`, `PRODUCT_SELECTION`, `KPI_METRICS`, etc.
- Defines plugin categories: `DATA_FLOW`, `PROCESSING`, `ANALYSIS`, `OUTPUT`
- Compatibility matrix: which plugins can connect to which

**RowPlugin** (`default/table/RowPlugin.jsx`)
- Logic hub for row-based plugins
- Manages expand/collapse state
- Renders Toolbar with ToolbarPlugin in A2 section only
- B2 section gets just a spacer (no duplicate toolbar)
- Passes `pluginContext` to ToolbarPlugin with productData, tableData, metadata

**ToolbarPlugin** (`ToolbarPlugin.jsx`)
- Renders plugin sockets (send/insert indicators)
- Toggleable UI (click IconPlug to show/hide sockets)
- Receives `pluginContext` from RowPlugin
- Renders PluginSend and PluginInsert components
- Handles drag/drop for plugin connections

**PluginSend** (`PluginSend.jsx`)
- "Output" socket - sends data OUT from this row
- Creates draggable data packages
- Exports TABLE_DATA or PRODUCT_SELECTION based on context

**PluginInsert** (`PluginInsert.jsx`)
- "Input" socket - receives data INTO this row
- Drop zone for data packages
- Validates data type compatibility

### Key Patterns

**1. Plugin Context Flow**
```javascript
// In RowPlugin
const pluginContext = {
  productData: config.data,
  tableData: config.tableOutput,
  productName: config.metadata?.title,
  ...config.metadata
};

// Pass to ToolbarPlugin
<ToolbarPlugin
  pluginContext={pluginContext}
  onPluginData={handlePluginData}
  onPluginConnect={handlePluginConnect}
/>
```

**2. Section Coordination (A2/B2)**
```javascript
// A2 gets full toolbar with plugins
{section === 'A2' && (
  <Toolbar
    leftContent={expandIcon}
    centerContent={title}
    rightContent={<ToolbarPlugin />}
  />
)}

// B2 gets just spacer (avoid duplicate)
{section === 'B2' && <div style={{ height: rowHeight }} />}
```

**3. Data Type Compatibility**
```javascript
// ToolbarPlugin determines available types from context
const getAvailableDataTypes = () => {
  const types = [];
  if (pluginContext.productData) types.push(PLUGIN_DATA_TYPES.TABLE_DATA);
  if (pluginContext.productName) types.push(PLUGIN_DATA_TYPES.PRODUCT_SELECTION);
  return types;
};
```

### Critical Rules

**❌ Don't:**
- Render ToolbarPlugin in both A2 and B2 (creates duplicate sockets)
- Bypass pluginConfig compatibility checks
- Hard-code plugin connections
- Mutate pluginContext directly

**✅ Do:**
- Use pluginConfig to define new plugin types
- Check compatibility with `isPluginCompatible()`
- Pass complete context to ToolbarPlugin
- Let RowPlugin manage all plugin state

### Integration with Table System

**RowPlugin works with:**
- TableWorkspace (provides cellState, expandedRows)
- NestedTable (renders C/D sections as children)
- Sections (A2/B2 coordinate rendering)

**Data flow:**
1. User drops product → cellState updated
2. RowPlugin checks `shouldApplyRowPlugin(row, cellState)`
3. If true, gets data via `getRowPluginData(row, cellState)`
4. Passes to NestedTable → productTable → sections
5. ToolbarPlugin provides send/insert sockets

### Common Issues Encountered

**Issue 1: Duplicate Toolbars**
- **Problem:** Rendering ToolbarPlugin in both A2 and B2
- **Fix:** Only A2 renders full toolbar, B2 gets spacer

**Issue 2: Missing Context**
- **Problem:** ToolbarPlugin not receiving productData
- **Fix:** Ensure RowPlugin builds complete pluginContext from config

**Issue 3: Bypassing Architecture**
- **Problem:** Calling productTable directly in RowPlugin
- **Fix:** Use tableConfig's applyTemplate() to normalize output

---

## CSV Field Mapping (To Be Documented)

**Note:** The relationship between raw CSV headers and table columnKeys needs clarification:
- CSV headers use snake_case: `product_name`, `discounted_price`, `quantity`
- Some CSVs may have different headers (needs audit)
- tableConfig should provide standard mappings
- Templates should not assume specific CSV structure

**Action items:**
1. Audit all CSV files to document actual headers
2. Create CSV → table field mapping registry
3. Update tableConfig with standard mappings
4. Ensure templates use mappings, not hard-coded fields

---

## Planned Features

### Summary Bar Mode (Compact Row Display)

**Purpose:** Display key product metrics in AB table without expanding, saving vertical space when table has many rows.

**When Collapsed:**
- **A2**: RowPlugin renders expand icon + product name (compact)
- **B2**: Shows summary VALUES (Units, Net) as actual data cells
- **B1**: AB table headers include "Units" and "Net"
- **CD table**: Does NOT render (hidden until expand)

**When Expanded:**
- **A2**: RowPlugin switches to full-width toolbar mode (with plugins)
- **B2**: Becomes spacer (like current implementation)
- **CD nested table**: Renders below with full view mode switching (by-color, by-size, by-variant)

**Visual Example:**
```
Collapsed (compact summary):
┌─────────────────┬────────┬────────┐
│  Product Name   │  Units │   Net  │  <- A1/B1 headers
├─────────────────┼────────┼────────┤
│ ▶ Short Lined.. │   162  │ $1,234 │  <- A2 | B2 (data)
│ ▶ Another Prod..│   250  │ $2,500 │
└─────────────────┴────────┴────────┘

Expanded (full detail):
┌───────────────────────────────────┐
│ ▼ Short Lined Cruiser  [plugins] │  <- A2 full-width
├─────────────────┬─────────────────┤  <- B2 spacer
│     Color       │  Size │ Units..│  <- C1/D1 (nested headers)
│  Black          │  All  │  100.. │  <- C2/D2 (nested data)
└─────────────────┴─────────────────┘
```

**Implementation Notes:**
- RowPlugin needs `mode` prop: `"summary-bar"` vs `"full-toolbar"`
- In summary-bar mode:
  - A2 renders compact (no full-width toolbar)
  - B2 receives summary data from tableProps (Units, Net values)
  - CD table rendering is conditional on `isExpanded`
- In full-toolbar mode (expanded):
  - A2 renders full-width toolbar with plugins
  - B2 becomes spacer
  - CD table renders with view mode switching

**Benefits:**
- See key metrics at a glance without expanding
- Significant vertical space savings for tables with many products
- Progressive disclosure: summary → detailed breakdown
- Maintains full feature set (plugins, view modes) when expanded

**Status:** Planned - not yet implemented

