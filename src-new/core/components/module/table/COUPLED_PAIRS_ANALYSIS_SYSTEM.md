# Coupled Pairs Analysis System
## Multi-Table Product Performance Analysis

---

## Overview

A three-table system for analyzing product performance individually and in coupled pairs, designed to identify high-performing product combinations based on compound metrics.

### Architecture Principles

**CRITICAL: Reuse Existing Components**
- **NO new UI components** - Use existing TableWorkspace, TableContainer, TableHeader, TableBody, TableFooter
- **ONLY create data processing .js files** in `assignment/multivariable/`
- **Extend TableWorkspace** with `mode="multi"` prop (backward compatible)
- **Extend TableBody** with `expandable` and `nestedRowRenderer` props
- **Leverage existing calculations** from `core/calculations/operations/aggregations.js`

**New Files Summary:**
```
assignment/multivariable/
├── primaryMetrics.js
├── secondaryMetrics.js
├── coupledPairs.js
├── pairGeneration.js
├── pairMetrics.js
├── compoundRanking.js
└── nestedRowBuilder.js
```

**Modified Files:**
- `TableWorkspace.jsx` - Add mode="multi" support
- `TableBody.jsx` - Add expandable rows
- `aggregations.js` - Add 3 new functions

---

## System Architecture

### Component Hierarchy

**REVISED - No New Components, Extend Existing:**

```
TableWorkspace (mode="multi")
├── Internal resize handle logic
├── TableContainer (Table 1)
│   ├── TableToolbar
│   ├── TableHeader
│   ├── TableBody (standard rows)
│   └── TableFooter
│
├── [Resize Divider]
│
├── TableContainer (Table 2)
│   ├── TableToolbar
│   ├── TableHeader
│   ├── TableBody (standard rows)
│   └── TableFooter
│
├── [Resize Divider]
│
└── TableContainer (Table 3)
    ├── TableToolbar
    ├── TableHeader
    ├── TableBody (expandable rows with nested detail)
    └── TableFooter
```

**Key Change:** TableWorkspace handles multiple tables internally when `mode="multi"`, no new wrapper components needed.

---

## Table Specifications

### Table 1: Primary Metrics Analysis
**Purpose:** Identify top-performing products by primary sales metrics

**Metrics:**
- Quantity Sold
- Net Revenue

**Data Source:** `line_items` scope, grouped by product

**User Controls:**
- Metric filters (quantity, net)
- Sample size selector (default: top 10)
- Time range filter
- Sort by either metric

**Output:** Top N products ranked by selected metric(s)

---

### Table 2: Secondary Metrics Analysis
**Purpose:** Identify top-performing products by secondary performance metrics

**Metrics:**
- Attach Rate (frequency product appears with other products)
- Sales Velocity (units sold per day)

**Data Source:** `line_items` scope, grouped by product with calculated metrics

**User Controls:**
- Metric filters (attach rate, velocity)
- Sample size selector (default: top 10)
- Time range filter
- Sort by either metric

**Output:** Top N products ranked by selected metric(s)

---

### Table 3: Coupled Pairs Analysis
**Purpose:** Identify and analyze product pairs with highest compound performance

**Metrics (Coupled):**
1. **Orders Together** - Count of orders containing both products
2. **Net Together** - Sum of order totals where both products appear
3. **Bundle Rate Together** - Frequency the pair appears vs. either product alone
4. **Velocity Together** - Average daily frequency of the pair appearing

**Data Source:** Orders containing products from both Table 1 and Table 2

**User Controls:**
- Sample size selector (how many pairs to show)
- Metric weighting (equal vs. custom weights for compound ranking)
- Expand/collapse nested rows

**Output:** Top N pairs ranked by compound performance score

---

## Data Processing Pipeline

### Phase 1: Independent Table Data Generation

```
┌─────────────────────────────────────────────────────────────┐
│ DATA SOURCE: line_items (all-time or filtered)             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├──────────────────┬──────────────────┐
                            ▼                  ▼                  ▼
                    ┌───────────────┐  ┌───────────────┐  ┌──────────┐
                    │ GROUP BY      │  │ GROUP BY      │  │ Filter   │
                    │ product_name  │  │ product_name  │  │ by time  │
                    └───────────────┘  └───────────────┘  └──────────┘
                            │                  │
                    ┌───────────────┐  ┌───────────────┐
                    │ CALCULATE     │  │ CALCULATE     │
                    │ - SUM qty     │  │ - Attach rate │
                    │ - SUM net     │  │ - Velocity    │
                    └───────────────┘  └───────────────┘
                            │                  │
                    ┌───────────────┐  ┌───────────────┐
                    │ SORT & LIMIT  │  │ SORT & LIMIT  │
                    │ Top N         │  │ Top N         │
                    └───────────────┘  └───────────────┘
                            │                  │
                            ▼                  ▼
                    ┌───────────────┐  ┌───────────────┐
                    │ TABLE 1 PROPS │  │ TABLE 2 PROPS │
                    └───────────────┘  └───────────────┘
```

### Phase 2: Pair Generation & Analysis

```
┌───────────────┐        ┌───────────────┐
│ Table 1       │        │ Table 2       │
│ Products (N)  │        │ Products (M)  │
└───────────────┘        └───────────────┘
        │                        │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ GENERATE PAIRS │
        │ (Cartesian)    │
        │ N × M pairs    │
        └────────────────┘
                 │
                 ▼
        ┌────────────────────────────────────────┐
        │ FOR EACH PAIR (Product A, Product B):  │
        │                                         │
        │ 1. Query orders containing BOTH        │
        │    WHERE order contains A AND B        │
        │                                         │
        │ 2. Calculate Coupled Metrics:          │
        │    - Orders Together: COUNT(orders)    │
        │    - Net Together: SUM(order.total)    │
        │    - Bundle Rate: pair_orders /        │
        │                   (A_orders + B_orders)│
        │    - Velocity Together: pair_orders /  │
        │                         date_range     │
        └────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ RANK PAIRS     │
        │ By compound    │
        │ score across   │
        │ 4 metrics      │
        └────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ SORT & LIMIT   │
        │ Top N pairs    │
        └────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ TABLE 3 PROPS  │
        └────────────────┘
```

### Phase 3: Nested Row Data Generation

```
For each pair (A, B) in Table 3:

┌─────────────────────────────────────────────────────────────┐
│ MAIN ROW DATA (already calculated)                         │
│ - Product A Name                                            │
│ - Product B Name                                            │
│ - Orders Together                                           │
│ - Net Together                                              │
│ - Bundle Rate Together                                      │
│ - Velocity Together                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ NESTED ROW GENERATION (when expanded)                      │
│                                                              │
│ For Product A:                                              │
│ 1. Find ALL pairs containing A (A+X, A+Y, A+Z...)          │
│ 2. For each metric, find best performing pair:             │
│    - Best by Orders: A+X (200 orders)                      │
│    - Best by Net: A+Y ($10,000)                            │
│    - Best by Bundle Rate: A+Z (12%)                        │
│    - Best by Velocity: A+X (20/day)                        │
│ 3. Calculate % difference from current pair (A+B)          │
│                                                              │
│ Repeat for Product B                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ NESTED ROW DATA STRUCTURE                                  │
│                                                              │
│ nestedRows: [                                               │
│   {                                                          │
│     type: 'best_pairs_for_A',                               │
│     label: 'Product A - Best Alternative Pairs',            │
│     metrics: {                                              │
│       orders: {                                             │
│         bestPair: 'Product X',                              │
│         value: 200,                                         │
│         percentDiff: +33%                                   │
│       },                                                     │
│       net: { ... },                                         │
│       bundleRate: { ... },                                  │
│       velocity: { ... }                                     │
│     }                                                        │
│   },                                                         │
│   {                                                          │
│     type: 'best_pairs_for_B',                               │
│     label: 'Product B - Best Alternative Pairs',            │
│     metrics: { ... }                                        │
│   }                                                          │
│ ]                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Visual Layout Diagrams

### Vertical Stack Layout

```
┌────────────────────────────────────────────────────────────┐
│ TABLE WORKSPACE                                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ TABLE 1: Primary Metrics (Qty, Net)            [▲▼] │   │
│ ├─────────────────────────────────────────────────────┤   │
│ │ Product Name    │ Quantity │ Net Revenue    │ ...   │   │
│ │─────────────────┼──────────┼────────────────┼───────│   │
│ │ Product A       │ 1,500    │ $45,000        │       │   │
│ │ Product B       │ 1,200    │ $38,000        │       │   │
│ │ Product C       │ 1,100    │ $35,000        │       │   │
│ │ ...             │          │                │       │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ═══════════════════ RESIZE HANDLE ════════════════════     │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ TABLE 2: Secondary Metrics (Attach, Velocity)  [▲▼] │   │
│ ├─────────────────────────────────────────────────────┤   │
│ │ Product Name    │ Attach Rate │ Velocity   │ ...   │   │
│ │─────────────────┼─────────────┼────────────┼───────│   │
│ │ Product X       │ 8.5%        │ 25/day     │       │   │
│ │ Product Y       │ 7.2%        │ 22/day     │       │   │
│ │ Product Z       │ 6.8%        │ 20/day     │       │   │
│ │ ...             │             │            │       │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ═══════════════════ RESIZE HANDLE ════════════════════     │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ TABLE 3: Coupled Pairs Analysis            [▲▼]     │   │
│ ├─────────────────────────────────────────────────────┤   │
│ │ Prod A │ Prod B │ Orders │ Net   │ Bundle │ Vel │▼│   │
│ │────────┼────────┼────────┼───────┼────────┼─────┼──│   │
│ │ A      │ X      │ 150    │ $8K   │ 5%     │ 12  │►│   │
│ │ A      │ Y      │ 120    │ $6K   │ 4%     │ 10  │▼│   │
│ │   Best for A by Orders    │ A+Z: 200 (+67%)       │   │
│ │   Best for A by Net       │ A+X: $8K (±0%)        │   │
│ │   Best for A by Bundle    │ A+Z: 8% (+100%)       │   │
│ │   Best for A by Velocity  │ A+Z: 15/day (+50%)    │   │
│ │   Best for Y by Orders    │ Y+B: 180 (+50%)       │   │
│ │   Best for Y by Net       │ Y+C: $9K (+50%)       │   │
│ │   Best for Y by Bundle    │ Y+B: 7% (+75%)        │   │
│ │   Best for Y by Velocity  │ Y+B: 14/day (+40%)    │   │
│ │ B      │ Z      │ 100    │ $5K   │ 3%     │ 8   │►│   │
│ └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Table 3 Row Expansion Detail

```
COLLAPSED STATE:
┌────────────────────────────────────────────────────────────┐
│ Product A │ Product X │ 150 │ $8,000 │ 5% │ 12/day │  [►] │
└────────────────────────────────────────────────────────────┘

EXPANDED STATE:
┌────────────────────────────────────────────────────────────┐
│ Product A │ Product X │ 150 │ $8,000 │ 5% │ 12/day │  [▼] │
├────────────────────────────────────────────────────────────┤
│ │ Best Alternative Pairs for Product A:                   │
│ │                                                           │
│ │ ┌─ By Orders ────────────────────────────────────────┐  │
│ │ │ Product A + Product Z                              │  │
│ │ │ 200 orders (+33% vs. current pair)                 │  │
│ │ └────────────────────────────────────────────────────┘  │
│ │                                                           │
│ │ ┌─ By Net Revenue ───────────────────────────────────┐  │
│ │ │ Product A + Product X  [CURRENT PAIR]              │  │
│ │ │ $8,000 (±0%)                                       │  │
│ │ └────────────────────────────────────────────────────┘  │
│ │                                                           │
│ │ ┌─ By Bundle Rate ───────────────────────────────────┐  │
│ │ │ Product A + Product Z                              │  │
│ │ │ 8% (+60% vs. current pair)                         │  │
│ │ └────────────────────────────────────────────────────┘  │
│ │                                                           │
│ │ ┌─ By Velocity ──────────────────────────────────────┐  │
│ │ │ Product A + Product Z                              │  │
│ │ │ 15/day (+25% vs. current pair)                     │  │
│ │ └────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│ │ Best Alternative Pairs for Product X:                   │
│ │                                                           │
│ │ ┌─ By Orders ────────────────────────────────────────┐  │
│ │ │ Product X + Product B                              │  │
│ │ │ 180 orders (+20% vs. current pair)                 │  │
│ │ └────────────────────────────────────────────────────┘  │
│ │                                                           │
│ │ [... similar structure for Net, Bundle, Velocity]       │
└────────────────────────────────────────────────────────────┘
```

---

## Integration with Current System

### 1. TableWorkspace Extension

**Current (Single Table Mode):**
```jsx
<TableWorkspace
  tableProps={tableProps}
  sortKey={sortKey}
  sortDirection={sortDirection}
  onSort={handleSort}
/>
```

**New (Multi-Table Mode):**
```jsx
<TableWorkspace
  mode="multi"  // Triggers multi-table rendering
  tables={[
    {
      id: 'primary-metrics',
      tableProps: table1Props,
      sortKey: sortKey1,
      sortDirection: sortDirection1,
      onSort: handleSort1,
      onColumnSwap: handleColumnSwap1
    },
    {
      id: 'secondary-metrics',
      tableProps: table2Props,
      sortKey: sortKey2,
      sortDirection: sortDirection2,
      onSort: handleSort2,
      onColumnSwap: handleColumnSwap2
    },
    {
      id: 'coupled-pairs',
      tableProps: table3Props,
      sortKey: sortKey3,
      sortDirection: sortDirection3,
      onSort: handleSort3,
      expandable: true,  // Enable expandable rows for Table 3
      nestedRowRenderer: renderNestedPairComparison
    }
  ]}
  resizeHeights={[33, 33, 34]}  // Initial % heights
  onResizeChange={handleResizeChange}  // Persist resize state
/>
```

**Backward Compatible:** If `mode` prop is omitted or `mode="single"`, TableWorkspace renders single table as before.

### 2. Data Processing Layer

**New Files (assignment/multivariable only):**

```
src-new/core/components/module/table/
└── assignment/
    └── multivariable/
        ├── primaryMetrics.js       // Table 1 data generation
        ├── secondaryMetrics.js     // Table 2 data generation
        ├── coupledPairs.js         // Table 3 data generation
        ├── pairGeneration.js       // Generate product pairs
        ├── pairMetrics.js          // Calculate coupled metrics
        ├── compoundRanking.js      // Rank pairs by score
        └── nestedRowBuilder.js     // Build nested row data
```

**Extended Files (add new calculation functions):**

```
src-new/core/calculations/
└── operations/
    └── aggregations.js              // Add: findOrdersWithProducts, calculateAttachRate, calculateVelocity
```

**pairGeneration.js:**
```javascript
// assignment/multivariable/pairGeneration.js
// Generates Cartesian product of two product arrays

export function generatePairs(products1, products2) {
  const pairs = [];
  for (const p1 of products1) {
    for (const p2 of products2) {
      if (p1.product_name !== p2.product_name) {
        pairs.push({ productA: p1, productB: p2 });
      }
    }
  }
  return pairs;
}
```

**pairMetrics.js:**
```javascript
// assignment/multivariable/pairMetrics.js
// Calculates coupled metrics using core/calculations functions

import { findOrdersWithProducts, sumField } from '../../../../calculations/operations/aggregations.js';

export function calculateCoupledMetrics(pair, lineItems, dateRange) {
  const productNames = [pair.productA.product_name, pair.productB.product_name];

  // Use aggregations.js function
  const pairOrders = findOrdersWithProducts(lineItems, productNames);

  return {
    ordersTogether: pairOrders.size,
    netTogether: sumField(
      lineItems.filter(item => pairOrders.has(item.order_id)),
      'net'
    ),
    bundleRate: calculateBundleRate(pair, pairOrders, lineItems),
    velocityTogether: pairOrders.size / dateRange.days
  };
}

function calculateBundleRate(pair, pairOrders, allLineItems) {
  const ordersWithA = new Set(
    allLineItems
      .filter(item => item.product_name === pair.productA.product_name)
      .map(item => item.order_id)
  );
  const ordersWithB = new Set(
    allLineItems
      .filter(item => item.product_name === pair.productB.product_name)
      .map(item => item.order_id)
  );

  const totalAppearances = ordersWithA.size + ordersWithB.size;
  return totalAppearances > 0 ? pairOrders.size / totalAppearances : 0;
}
```

**compoundRanking.js:**
```javascript
// assignment/multivariable/compoundRanking.js
// Ranks pairs by normalized compound score

export function rankPairsByCompoundScore(pairs, weights = null) {
  const w = weights || {
    ordersTogether: 0.25,
    netTogether: 0.25,
    bundleRate: 0.25,
    velocityTogether: 0.25
  };

  const normalized = normalizePairMetrics(pairs);

  return normalized.map(pair => ({
    ...pair,
    compoundScore:
      pair.ordersTogether_norm * w.ordersTogether +
      pair.netTogether_norm * w.netTogether +
      pair.bundleRate_norm * w.bundleRate +
      pair.velocityTogether_norm * w.velocityTogether
  }))
  .sort((a, b) => b.compoundScore - a.compoundScore);
}

function normalizePairMetrics(pairs) {
  const metrics = ['ordersTogether', 'netTogether', 'bundleRate', 'velocityTogether'];
  const ranges = {};

  metrics.forEach(metric => {
    const values = pairs.map(p => p.metrics[metric]);
    ranges[metric] = {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  });

  return pairs.map(pair => ({
    ...pair,
    ordersTogether_norm: normalize(pair.metrics.ordersTogether, ranges.ordersTogether),
    netTogether_norm: normalize(pair.metrics.netTogether, ranges.netTogether),
    bundleRate_norm: normalize(pair.metrics.bundleRate, ranges.bundleRate),
    velocityTogether_norm: normalize(pair.metrics.velocityTogether, ranges.velocityTogether)
  }));
}

function normalize(value, range) {
  const { min, max } = range;
  return max === min ? 0 : (value - min) / (max - min);
}
```

**nestedRowBuilder.js:**
```javascript
// assignment/multivariable/nestedRowBuilder.js
// Builds nested row data showing best alternative pairs

export function buildNestedRowsForPair(currentPair, allPairs) {
  const { productA, productB } = currentPair;

  const nestedRowsA = buildNestedRowsForProduct(productA, allPairs, currentPair);
  const nestedRowsB = buildNestedRowsForProduct(productB, allPairs, currentPair);

  return [nestedRowsA, nestedRowsB];
}

function buildNestedRowsForProduct(product, allPairs, currentPair) {
  const pairsWithProduct = allPairs.filter(p =>
    p.productA.product_name === product.product_name ||
    p.productB.product_name === product.product_name
  );

  const bestByMetric = {
    orders: findBestByMetric(pairsWithProduct, 'ordersTogether'),
    net: findBestByMetric(pairsWithProduct, 'netTogether'),
    bundleRate: findBestByMetric(pairsWithProduct, 'bundleRate'),
    velocity: findBestByMetric(pairsWithProduct, 'velocityTogether')
  };

  return {
    type: `best_pairs_for_${product.product_name}`,
    label: `Best Alternative Pairs for ${product.product_name}`,
    metrics: {
      orders: {
        bestPair: getPartnerName(bestByMetric.orders, product.product_name),
        value: bestByMetric.orders.metrics.ordersTogether,
        percentDiff: calculatePercentDiff(
          bestByMetric.orders.metrics.ordersTogether,
          currentPair.metrics.ordersTogether
        )
      },
      net: {
        bestPair: getPartnerName(bestByMetric.net, product.product_name),
        value: bestByMetric.net.metrics.netTogether,
        percentDiff: calculatePercentDiff(
          bestByMetric.net.metrics.netTogether,
          currentPair.metrics.netTogether
        )
      },
      bundleRate: {
        bestPair: getPartnerName(bestByMetric.bundleRate, product.product_name),
        value: bestByMetric.bundleRate.metrics.bundleRate,
        percentDiff: calculatePercentDiff(
          bestByMetric.bundleRate.metrics.bundleRate,
          currentPair.metrics.bundleRate
        )
      },
      velocity: {
        bestPair: getPartnerName(bestByMetric.velocity, product.product_name),
        value: bestByMetric.velocity.metrics.velocityTogether,
        percentDiff: calculatePercentDiff(
          bestByMetric.velocity.metrics.velocityTogether,
          currentPair.metrics.velocityTogether
        )
      }
    }
  };
}

function findBestByMetric(pairs, metricKey) {
  return pairs.reduce((best, pair) =>
    pair.metrics[metricKey] > best.metrics[metricKey] ? pair : best
  );
}

function getPartnerName(pair, productName) {
  return pair.productA.product_name === productName
    ? pair.productB.product_name
    : pair.productA.product_name;
}

function calculatePercentDiff(newValue, currentValue) {
  if (currentValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - currentValue) / currentValue) * 100;
}
```

### 3. Table Component Extensions

**TableBody.jsx Enhancement:**

Add support for expandable rows:

```jsx
export default function TableBody({
  rows = [],
  expandable = false,
  nestedRowRenderer = null,
  ...props
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (rowId) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  return (
    <>
      {rows.map((row) => (
        <React.Fragment key={row._rowId}>
          {/* Main row */}
          <TableRow
            row={row}
            expandable={expandable}
            isExpanded={expandedRows.has(row._rowId)}
            onToggleExpand={() => toggleRow(row._rowId)}
          />

          {/* Nested rows (if expanded) */}
          {expandable && expandedRows.has(row._rowId) && nestedRowRenderer && (
            <NestedRow>
              {nestedRowRenderer(row)}
            </NestedRow>
          )}
        </React.Fragment>
      ))}
    </>
  );
}
```

### 4. Plugin Integration

**New Plugin Panel: PairAnalysisPluginPanel**

```jsx
<PairAnalysisPluginPanel>
  <SlotScroller label="Table 1 Sample Size">
    {[5, 10, 15, 20, 25]}
  </SlotScroller>

  <SlotScroller label="Table 2 Sample Size">
    {[5, 10, 15, 20, 25]}
  </SlotScroller>

  <SlotScroller label="Pair Sample Size">
    {[10, 20, 30, 50, 100]}
  </SlotScroller>

  <SlotScroller label="Metric Weighting">
    {['Equal', 'Orders Priority', 'Revenue Priority', 'Custom']}
  </SlotScroller>
</PairAnalysisPluginPanel>
```

This panel would appear in the TablePluginPanel dropdown when in coupled-pairs mode.

---

## Implementation Phases

### Phase 1: Layout Foundation (Week 1)
**Goal:** Render three resizable tables vertically

- [ ] Update `TableWorkspace.jsx` to accept `mode` prop
- [ ] Add multi-table rendering logic when `mode="multi"`
- [ ] Add resize handle dividers between tables
- [ ] Implement drag-to-resize logic
- [ ] Add localStorage persistence for resize heights
- [ ] Maintain backward compatibility (single table mode)
- [ ] Test with placeholder table data

**Files to modify:**
- `src/core/components/module/table/container/TableWorkspace.jsx`

**Files to create:**
- None! Using existing architecture.

---

### Phase 2: Core Calculations Extension (Week 2)
**Goal:** Add new calculation functions to aggregations.js and create table templates

- [ ] Add `findOrdersWithProducts()` to `aggregations.js`
- [ ] Add `calculateAttachRate()` to `aggregations.js`
- [ ] Add `calculateVelocity()` to `aggregations.js`
- [ ] Create `primaryMetrics.js` template (uses existing orderSummary, totalQuantitySold, totalRevenue)
- [ ] Create `secondaryMetrics.js` template (uses new attach rate, velocity calculations)
- [ ] Test calculations with real line items data

**Files to modify:**
- `src-new/core/calculations/operations/aggregations.js`

**Files to create:**
- `src-new/core/components/module/table/assignment/multivariable/primaryMetrics.js`
- `src-new/core/components/module/table/assignment/multivariable/secondaryMetrics.js`

---

### Phase 3: Pair Analysis Engine (Week 3)
**Goal:** Create data processing files for pair analysis

- [ ] Create `pairGeneration.js` with generatePairs()
- [ ] Create `pairMetrics.js` with calculateCoupledMetrics()
- [ ] Create `compoundRanking.js` with normalization and scoring
- [ ] Test pair generation with sample product sets
- [ ] Test metric calculations with real orders data
- [ ] Verify compound scoring algorithm

**Files to create:**
- `src-new/core/components/module/table/assignment/multivariable/pairGeneration.js`
- `src-new/core/components/module/table/assignment/multivariable/pairMetrics.js`
- `src-new/core/components/module/table/assignment/multivariable/compoundRanking.js`

---

### Phase 4: Table 3 Basic (Week 4)
**Goal:** Create template for coupled pairs table

- [ ] Create `coupledPairs.js` template
- [ ] Integrate pairGeneration, pairMetrics, compoundRanking
- [ ] Define Table 3 column structure (productA, productB, 4 metrics)
- [ ] Format coupled metrics display
- [ ] Use existing sorting from TableWorkspace
- [ ] Test pair ranking accuracy

**Files to create:**
- `src-new/core/components/module/table/assignment/multivariable/coupledPairs.js`

---

### Phase 5: Expandable Rows (Week 5)
**Goal:** Add nested row expansion to TableBody

- [ ] Modify `TableBody.jsx` to accept `expandable` prop
- [ ] Add expand/collapse state management in TableBody
- [ ] Add expand/collapse icon in first column
- [ ] Render `nestedRowRenderer()` output when row expanded
- [ ] Style nested row display with indentation
- [ ] Test expand/collapse functionality

**Files to modify:**
- `src-new/core/components/module/table/container/TableBody.jsx`

---

### Phase 6: Nested Row Data (Week 6)
**Goal:** Build best alternative pairs data

- [ ] Create `nestedRowBuilder.js` in assignment/multivariable/
- [ ] Implement `buildNestedRowsForPair()`
- [ ] Implement `findBestByMetric()`
- [ ] Calculate percentage differences
- [ ] Integrate into `coupledPairs.js` template
- [ ] Test with various pair combinations

**Files to create:**
- `src-new/core/components/module/table/assignment/multivariable/nestedRowBuilder.js`

---

### Phase 7: Plugin Integration (Week 7)
**Goal:** Add controls for pair analysis configuration

- [ ] Create `PairAnalysisPluginPanel.jsx`
- [ ] Add sample size controls
- [ ] Add metric weighting controls
- [ ] Connect to table recalculation
- [ ] Add auto-recalculate trigger
- [ ] Test plugin state updates

**Files to create:**
- `src/core/components/plugins/panels/PairAnalysisPluginPanel.jsx`

---

### Phase 8: Performance & Polish (Week 8)
**Goal:** Optimize for large datasets and refine UX

- [ ] Implement memoization for pair calculations
- [ ] Add loading states during recalculation
- [ ] Add progress indicators for long calculations
- [ ] Implement virtual scrolling for Table 3
- [ ] Add export functionality
- [ ] Polish resize handle UX
- [ ] Add keyboard shortcuts
- [ ] User testing & bug fixes

---

## Technical Considerations

### Performance Optimization

**Challenge:** Cartesian product can generate large number of pairs
- 10 × 10 = 100 pairs
- 20 × 20 = 400 pairs
- 50 × 50 = 2,500 pairs

**Solutions:**
1. **Limit sample sizes** - UI enforces reasonable limits (max 25-50 per table)
2. **Lazy calculation** - Only calculate pairs when Table 3 is visible
3. **Memoization** - Cache pair calculations, invalidate on data change
4. **Web Workers** - Offload pair calculation to background thread
5. **Progressive rendering** - Show top pairs first, continue calculating in background

### Data Schema

**Table 3 Row Structure:**
```javascript
{
  _rowId: 'pair-A-X',
  productA: {
    product_name: 'Product A',
    product_title: 'Full Product A Name'
  },
  productB: {
    product_name: 'Product X',
    product_title: 'Full Product X Name'
  },
  metrics: {
    ordersTogether: 150,
    netTogether: 8000,
    bundleRate: 0.05,
    velocityTogether: 12
  },
  compoundScore: 0.87,
  nestedRows: [
    {
      type: 'best_pairs_for_A',
      label: 'Best Alternative Pairs for Product A',
      metrics: {
        byOrders: {
          partnerName: 'Product Z',
          value: 200,
          percentDiff: 33.3,
          isCurrent: false
        },
        byNet: {
          partnerName: 'Product X',
          value: 8000,
          percentDiff: 0,
          isCurrent: true
        },
        // ... byBundleRate, byVelocity
      }
    },
    {
      type: 'best_pairs_for_B',
      label: 'Best Alternative Pairs for Product X',
      metrics: { /* ... */ }
    }
  ]
}
```

### State Management

**Workspace State:**
```javascript
const [tables, setTables] = useState({
  primary: {
    data: [],
    sampleSize: 10,
    sortKey: 'quantity',
    sortDirection: 'desc'
  },
  secondary: {
    data: [],
    sampleSize: 10,
    sortKey: 'attach_rate',
    sortDirection: 'desc'
  },
  pairs: {
    data: [],
    sampleSize: 10,
    sortKey: 'compoundScore',
    sortDirection: 'desc',
    expandedRows: new Set()
  }
});

const [pairCalculationStatus, setPairCalculationStatus] = useState({
  calculating: false,
  progress: 0,
  total: 0
});
```

---

## Success Metrics

1. **Performance**
   - Pair calculation completes in <2s for 100 pairs
   - Pair calculation completes in <10s for 500 pairs
   - UI remains responsive during calculation

2. **Accuracy**
   - Coupled metrics match manual calculations
   - Best alternative pairs correctly identified
   - Percentage differences accurate to 2 decimal places

3. **Usability**
   - Users can resize tables smoothly
   - Expand/collapse responds instantly
   - Sample size changes trigger recalculation
   - Clear visual feedback during loading

---

## Future Enhancements

1. **Advanced Filtering**
   - Filter pairs by minimum order threshold
   - Filter by minimum bundle rate
   - Exclude specific products from pairing

2. **Custom Metric Weights**
   - UI for adjusting metric importance
   - Save/load weighting profiles
   - See how rankings change with different weights

3. **Time-based Analysis**
   - Compare pair performance across time periods
   - Trend analysis for pairs
   - Seasonal pattern detection

4. **Visualization**
   - Network graph of product relationships
   - Heatmap of pair performance
   - Sparklines for metric trends

5. **Export & Reporting**
   - Export all three tables to CSV
   - Generate PDF report with insights
   - Share specific pair analysis

---

## Appendix: Code Examples

### TableWorkspace.jsx (Extended)
```jsx
import React, { useState, useRef, useEffect } from 'react';
import TableContainer, { TableHeader as TableHeaderSlot, TableBody as TableBodySlot, TableFooter as TableFooterSlot, TableToolbar } from '../../../custom/table/TableContainer.jsx';
import TableController from './TableController.jsx';
import TableHeader from './TableHeader.jsx';
import TableBody from './TableBody.jsx';
import TableFooter from './TableFooter.jsx';

export default function TableWorkspace({
  // Single table mode props (backward compatible)
  tableProps,
  sortKey,
  sortDirection,
  onSort,
  onColumnSwap,
  columnAssignments = [],
  rowAssignments = [],
  dataConfig = {},

  // Multi-table mode props
  mode = 'single', // 'single' | 'multi'
  tables = [], // Array of table configs
  resizeHeights = [33, 33, 34],
  onResizeChange,

  ...props
}) {
  // Resize logic for multi-table mode
  const [heights, setHeights] = useState(() => {
    if (mode !== 'multi') return [];
    const saved = localStorage.getItem('tableWorkspace-heights');
    return saved ? JSON.parse(saved) : resizeHeights;
  });

  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const dragHandle = useRef(null);

  // Save heights to localStorage
  useEffect(() => {
    if (mode === 'multi' && heights.length) {
      localStorage.setItem('tableWorkspace-heights', JSON.stringify(heights));
      onResizeChange?.(heights);
    }
  }, [heights, mode, onResizeChange]);

  const handleMouseDown = (handleIndex) => (e) => {
    isDragging.current = true;
    dragHandle.current = handleIndex;
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - containerRect.top;
    const percentage = (relativeY / containerRect.height) * 100;

    setHeights(prev => {
      const newHeights = [...prev];
      const handleIndex = dragHandle.current;
      const totalBefore = prev.slice(0, handleIndex).reduce((a, b) => a + b, 0);
      const totalBeforeNext = prev.slice(0, handleIndex + 2).reduce((a, b) => a + b, 0);

      newHeights[handleIndex] = Math.max(10, Math.min(80, percentage - totalBefore));
      newHeights[handleIndex + 1] = Math.max(10, Math.min(80, totalBeforeNext - percentage));

      return newHeights;
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    dragHandle.current = null;
  };

  useEffect(() => {
    if (mode !== 'multi') return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mode]);

  // Render function for a single table
  const renderTable = (config, index) => {
    const {
      id,
      tableProps: tp,
      sortKey: sk,
      sortDirection: sd,
      onSort: os,
      onColumnSwap: ocs,
      expandable = false,
      nestedRowRenderer = null
    } = config;

    return (
      <TableContainer
        key={id || index}
        rows={tp.rows}
        totals={tp.totals}
        columnKeys={tp.columnKeys}
        columnLabels={tp.columnLabels}
        columnWidths={tp.columnWidths}
        layout={tp.layout}
        styles={tp.styles}
        sortKey={sk}
        sortDirection={sd}
        onSort={os}
        onColumnSwap={ocs}
      >
        <TableToolbar>
          <TableController />
        </TableToolbar>

        <TableHeaderSlot>
          <TableHeader
            columnAssignments={columnAssignments}
            columnLabels={tp.columnLabels}
            columnWidths={tp.columnWidths}
            fixedColumns={tp.fixedColumns}
            scrollingColumns={tp.scrollingColumns}
            allColumnKeys={tp.columnKeys}
            onColumnSwap={ocs}
          />
        </TableHeaderSlot>

        <TableBodySlot>
          <TableBody
            rowAssignments={rowAssignments}
            columnAssignments={columnAssignments}
            rows={tp.rows}
            columnWidths={tp.columnWidths}
            fixedColumns={tp.fixedColumns}
            scrollingColumns={tp.scrollingColumns}
            expandable={expandable}
            nestedRowRenderer={nestedRowRenderer}
          />
        </TableBodySlot>

        <TableFooterSlot>
          <TableFooter
            columnAssignments={columnAssignments}
            totals={tp.totals}
            columnWidths={tp.columnWidths}
            fixedColumns={tp.fixedColumns}
            scrollingColumns={tp.scrollingColumns}
          />
        </TableFooterSlot>
      </TableContainer>
    );
  };

  // Multi-table mode
  if (mode === 'multi' && tables.length > 0) {
    return (
      <div ref={containerRef} className="flex flex-col h-full w-full rounded-xl min-w-0">
        {tables.map((tableConfig, index) => (
          <React.Fragment key={tableConfig.id || index}>
            <div style={{ height: `${heights[index] || 33}%`, minHeight: '100px' }}>
              {renderTable(tableConfig, index)}
            </div>
            {index < tables.length - 1 && (
              <div
                className="h-1 bg-gray-300 hover:bg-gray-400 cursor-row-resize transition-colors"
                onMouseDown={handleMouseDown(index)}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Single table mode (backward compatible)
  return (
    <div className="flex flex-col h-full w-full rounded-xl min-w-0">
      {renderTable({
        tableProps,
        sortKey,
        sortDirection,
        onSort,
        onColumnSwap
      }, 0)}
    </div>
  );
}
```

### Usage Example
```jsx
// Single table mode (existing - still works)
<TableWorkspace
  tableProps={tableProps}
  sortKey={sortKey}
  sortDirection={sortDirection}
  onSort={handleSort}
  onColumnSwap={handleColumnSwap}
/>

// Multi-table mode (new)
<TableWorkspace
  mode="multi"
  tables={[
    {
      id: 'primary',
      tableProps: table1Props,
      sortKey: sortKey1,
      sortDirection: sortDirection1,
      onSort: handleSort1,
      onColumnSwap: handleColumnSwap1
    },
    {
      id: 'secondary',
      tableProps: table2Props,
      sortKey: sortKey2,
      sortDirection: sortDirection2,
      onSort: handleSort2,
      onColumnSwap: handleColumnSwap2
    },
    {
      id: 'pairs',
      tableProps: table3Props,
      sortKey: sortKey3,
      sortDirection: sortDirection3,
      onSort: handleSort3,
      expandable: true,
      nestedRowRenderer: renderNestedRows
    }
  ]}
  resizeHeights={[30, 30, 40]}
  onResizeChange={handleResizeChange}
/>
```

---

**Document Version:** 2.0 (REVISED - Workspace Architecture)
**Last Updated:** 2025-10-18
**Author:** System Architecture

**Key Changes in v2.0:**
- Removed all new component creation
- All new files live in `assignment/multivariable/` directory (flat structure, 7 files)
- Reuse existing table components (TableWorkspace, TableBody, etc.)
- Leverage existing calculation functions from `core/calculations/`
- Total new files: 7 (.js data files only)
- Total modified files: 3 (TableWorkspace, TableBody, aggregations)
