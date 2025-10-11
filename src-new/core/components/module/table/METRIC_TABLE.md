# MetricTable - Multi-Context Product Comparison System

## Overview

MetricTable is a sophisticated 3-table comparison system that allows users to analyze products across different metric contexts through an innovative plugin signal chain mechanism.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         TableWorkspace                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    MetricTable.jsx                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │   Table 1    │  │   Table 2    │  │   Table 3    │    │ │
│  │  │ Top Revenue  │  │ Top Attach   │  │  Comparison  │    │ │
│  │  │              │  │              │  │              │    │ │
│  │  │ ┌─Product X─┐│  │ ┌─Product Y─┐│  │ ┌─Product X─┐│    │ │
│  │  │ │ Plugin 1  ││  │ │ Plugin 1  ││  │ │ Plugin 2  ││    │ │
│  │  │ │ [Button]──┼┼──┼─┼───────────┼┼──┼>│ (carries  ││    │ │
│  │  │ └───────────┘│  │ └───────────┘│  │ │  Table 1  ││    │ │
│  │  │              │  │              │  │ │   data)   ││    │ │
│  │  │              │  │              │  │ └───────────┘│    │ │
│  │  │              │  │              │  │ ┌─Product Y─┐│    │ │
│  │  │              │  │              │  │ │ Plugin 2  ││    │ │
│  │  │              │  │              │  │ │ (carries  ││    │ │
│  │  │              │  │              │  │ │  Table 2  ││    │ │
│  │  │              │  │              │  │ │   data)   ││    │ │
│  │  └──────────────┘  └──────────────┘  └─└───────────┘┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                          Data Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  dataService.js ──> calculations/ ──> dataConfig.js             │
│       (fetch)         (compute)         (expose)                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Template Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  metricTable.js                                                  │
│  - Calls dataConfig for calculation functions                   │
│  - Builds props for each of 3 tables                            │
│  - Defines column mappings per context                          │
│  - Generates initial row data                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Module Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  MetricTable.jsx                                                 │
│  - Renders 3 TableContainer instances                           │
│  - Each with: TableToolbar, TableHeader, TableBody, TableFooter │
│  - Manages plugin signal chain state                            │
│  - Coordinates real-time updates via tableOperator.js           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    State Management                              │
├─────────────────────────────────────────────────────────────────┤
│  Switchboard.jsx (global state)                                 │
│       ▲                                                          │
│       │                                                          │
│  tableOperator.js (real-time state updates)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Plugin Signal Chain Mechanism

### Concept
Products become "plugins" that carry their data context through a signal chain as they are dragged between tables.

### Flow Example

**Step 1: Product X in Table 1 (Top Revenue)**
```javascript
Product X Row
  └─> Plugin 1 assigned
      └─> Contains: {
            productId: 'X',
            sourceTable: 'revenue',
            metrics: { revenue: $5000, units: 100 }
          }
```

**Step 2: User drags button from Plugin 1 → Table 3**
```javascript
Plugin Button (draggable)
  └─> Carries: Product X data from Table 1
  └─> Dropped on Row in Table 3
      └─> Becomes: Plugin 2 for Product X
          └─> Contains: {
                productId: 'X',
                sourceTable: 'revenue',
                sourceMetrics: { revenue: $5000, units: 100 },
                comparisonContext: 'table3'
              }
```

**Step 3: Product Y follows same path from Table 2 → Table 3**
```javascript
Plugin Button (draggable)
  └─> Carries: Product Y data from Table 2
  └─> Dropped on Row in Table 3
      └─> Becomes: Plugin 2 for Product Y
          └─> Contains: {
                productId: 'Y',
                sourceTable: 'attach_rate',
                sourceMetrics: { attachRate: 0.85, category: 'accessories' },
                comparisonContext: 'table3'
              }
```

**Result: Table 3 shows Product X vs Product Y**
```
Table 3: Comparison View
┌───────────┬─────────┬──────┬─────────┬────────────┐
│ Product   │ Revenue │ Units│ Attach  │ Category   │
├───────────┼─────────┼──────┼─────────┼────────────┤
│ Product X │ $5,000  │ 100  │ 0.45    │ Electronics│
│ Product Y │ $2,500  │  50  │ 0.85    │ Accessories│
└───────────┴─────────┴──────┴─────────┴────────────┘
                (from Table 1)   (from Table 2)
```

## Component Responsibilities

### 1. dataConfig.js
**Role:** Expose calculation functions and data transformations

**Exports:**
```javascript
export const dataConfig = {
  // Calculation functions for different contexts
  calculations: {
    revenue: {
      topProducts: (data, limit) => { ... },
      calculateMetrics: (productId) => { ... }
    },
    attachRate: {
      topProducts: (data, limit) => { ... },
      calculateMetrics: (productId) => { ... }
    },
    comparison: {
      mergeMetrics: (productData[]) => { ... },
      calculateDeltas: (productA, productB) => { ... }
    }
  },

  // Column mappings for each context
  columnMaps: {
    revenue: ['product_name', 'revenue', 'units', 'avg_price'],
    attachRate: ['product_name', 'attach_rate', 'category', 'opportunities'],
    comparison: ['product_name', 'revenue', 'units', 'attach_rate', 'category']
  }
}
```

**Calls:**
- `dataService.js` - fetch raw data
- `calculations/*.js` - computation functions

### 2. metricTable.js
**Role:** Build table props for MetricTable.jsx

**Exports:**
```javascript
export function metricTable(options = {}) {
  const {
    table1Context = 'revenue',
    table2Context = 'attachRate',
    limit = 20
  } = options;

  // Call dataConfig for each table
  const table1Data = dataConfig.calculations.revenue.topProducts(data, limit);
  const table2Data = dataConfig.calculations.attachRate.topProducts(data, limit);

  return {
    table1Props: {
      rows: table1Data,
      columnKeys: dataConfig.columnMaps.revenue,
      context: 'revenue',
      // ... other table props
    },
    table2Props: {
      rows: table2Data,
      columnKeys: dataConfig.columnMaps.attachRate,
      context: 'attachRate',
      // ... other table props
    },
    table3Props: {
      rows: [], // Empty initially, filled by plugin drops
      columnKeys: dataConfig.columnMaps.comparison,
      context: 'comparison',
      // ... other table props
    }
  };
}
```

### 3. MetricTable.jsx
**Role:** Render 3 tables, manage plugin signal chain

**Structure:**
```javascript
export default function MetricTable({ table1Props, table2Props, table3Props }) {
  // Plugin signal chain state
  const [comparisonProducts, setComparisonProducts] = useState([]);

  // Handle plugin button drag from Table 1/2 → Table 3
  const handlePluginTransfer = (sourceTable, productData, targetRow) => {
    // Add product to comparison with its source context
    setComparisonProducts(prev => [...prev, {
      ...productData,
      sourceTable,
      comparisonRow: targetRow
    }]);

    // Notify tableOperator for real-time updates
    tableOperator.updateComparison(comparisonProducts);
  };

  return (
    <div className="flex gap-4">
      {/* Table 1: Revenue Context */}
      <div className="flex-1">
        <TableContainer {...table1Props}>
          <TableToolbar />
          <TableHeader />
          <TableBody onPluginTransfer={(data, target) =>
            handlePluginTransfer('revenue', data, target)
          } />
          <TableFooter />
        </TableContainer>
      </div>

      {/* Table 2: Attach Rate Context */}
      <div className="flex-1">
        <TableContainer {...table2Props}>
          <TableToolbar />
          <TableHeader />
          <TableBody onPluginTransfer={(data, target) =>
            handlePluginTransfer('attachRate', data, target)
          } />
          <TableFooter />
        </TableContainer>
      </div>

      {/* Table 3: Comparison Context */}
      <div className="flex-1">
        <TableContainer {...table3Props}>
          <TableToolbar />
          <TableHeader />
          <TableBody
            rows={comparisonProducts}
            renderPluginRow={(product) => (
              <ComparisonRow
                product={product}
                sourceData={product.sourceMetrics}
                sourceTable={product.sourceTable}
              />
            )}
          />
          <TableFooter />
        </TableContainer>
      </div>
    </div>
  );
}
```

### 4. module/table containers (TableHeader, TableBody, TableFooter)
**Role:** Manage plugin drag/drop states

**Responsibilities:**
- Track plugin assignments per cell/row
- Handle plugin button drag start
- Handle plugin button drop
- Emit plugin transfer events to MetricTable.jsx
- Pass plugin state to custom/table sections for rendering

### 5. tableOperator.js
**Role:** Send real-time state updates to Switchboard.jsx

**Responsibilities:**
- Listen for comparison updates from MetricTable.jsx
- Fetch fresh data when products are added to comparison
- Recalculate metrics in real-time
- Push updates to global state (Switchboard.jsx)
- Trigger re-renders of affected tables

### 6. Switchboard.jsx
**Role:** Global state management

**State:**
```javascript
{
  metricTable: {
    table1: { rows: [...], context: 'revenue' },
    table2: { rows: [...], context: 'attachRate' },
    table3: {
      products: [
        { id: 'X', sourceTable: 'revenue', metrics: {...} },
        { id: 'Y', sourceTable: 'attachRate', metrics: {...} }
      ]
    }
  }
}
```

## Enhancement: Nested Tables

Each table can contain nested tables via TablePlugin, creating multi-level comparisons:

```
Table 1: Top 20 Products by Revenue
  └─> Product X (row with TablePlugin)
      └─> Nested Table: Product X variants (by color/size)
          └─> Variant "Red-Large" has Plugin 1
              └─> Button dragged to Table 3
                  └─> Compare variant-level data across contexts
```

This allows comparison at:
- Product level (Product X vs Product Y)
- Variant level (Product X-Red-Large vs Product Y-Blue-Small)
- Mixed levels (Product X aggregate vs Product Y variant)

## Implementation Checklist

### Phase 1: Core Structure
- [ ] Create `dataConfig.js` with calculation functions
- [ ] Create `metricTable.js` template
- [ ] Create `MetricTable.jsx` module component
- [ ] Wire up to `TableWorkspace.jsx`

### Phase 2: Plugin Signal Chain
- [ ] Extend module/table containers with plugin transfer handlers
- [ ] Implement draggable plugin button component
- [ ] Handle plugin drop in Table 3
- [ ] Maintain plugin signal chain state

### Phase 3: State Management
- [ ] Create `tableOperator.js`
- [ ] Connect to `Switchboard.jsx`
- [ ] Implement real-time updates
- [ ] Handle recalculations on comparison changes

### Phase 4: Comparison Logic
- [ ] Implement `dataConfig.calculations.comparison.mergeMetrics()`
- [ ] Build comparison row renderer
- [ ] Add cross-context metric calculations
- [ ] Handle product removal from comparison

### Phase 5: Nested Table Enhancement
- [ ] Support TablePlugin within each table
- [ ] Allow variant-level plugin transfers
- [ ] Handle multi-level comparison contexts
- [ ] Implement aggregation roll-ups

## Open Questions

1. **Plugin Button UI:** What should the draggable button look like? Icon? Text? Badge?

2. **Table 3 Row Management:**
   - How are rows added/removed from Table 3?
   - Can user manually add rows or only via plugin drops?
   - What's the max number of products in comparison?

3. **Real-time Updates:**
   - How frequently does tableOperator poll for data?
   - Should updates be debounced?
   - What happens if source data changes while comparison is active?

4. **Nested Table Depth:**
   - How many levels of nesting allowed?
   - Does plugin signal chain support multi-level transfers?

5. **Performance:**
   - With 3 tables x 20 rows each, how to optimize renders?
   - Should comparison calculations be memoized?
   - Virtual scrolling needed?

## Success Criteria

✅ User can drag plugin button from Table 1 → Table 3
✅ Product appears in Table 3 with metrics from Table 1 context
✅ User can drag plugin button from Table 2 → Table 3
✅ Second product appears in Table 3 with metrics from Table 2 context
✅ Table 3 shows both products with merged metric contexts
✅ Updates are real-time via tableOperator → Switchboard
✅ System supports nested tables with variant-level comparisons

## Next Steps

1. Review this architecture for feasibility
2. Identify potential bottlenecks or design flaws
3. Decide on Phase 1 implementation approach
4. Create detailed specs for dataConfig.js structure
5. Design plugin button component and drag/drop UX
