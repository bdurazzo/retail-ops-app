# Modular Table Architecture Plan

## Vision Statement
**One flexible table built from reusable parts that can handle any retail analysis without adding new code or configurations.**

## Core Principles
1. **Simple first, extend later** - Build minimum viable pieces, add complexity only when needed
2. **Composition over configuration** - Combine simple parts, don't configure complex systems
3. **Data flows through, UI adapts** - Table renders whatever data format it receives
4. **Sections are independent** - Each table section works alone and together

## Current State Assessment
- ✅ **TableContainer + Sections A1-D3** - Basic structure exists
- ✅ **Scroll synchronization** - Proven pattern from Table.jsx
- ✅ **Data loading pipeline** - dataService.js works
- ❌ **Templates** - Need data transformation layer
- ❌ **Production readiness** - Missing features from Table.jsx
- ❌ **Clear boundaries** - Overlapping responsibilities

## Architecture Stack (Bottom to Top)

### Layer 1: Data Sources
```
Templates → Transform raw CSV into table-ready format
├── productPerformance.js (products grouped, metrics calculated)
├── orderAnalysis.js (orders by date, aggregated)
├── variantBreakdown.js (color/size combinations)
└── [future templates as needed]
```
**Rule:** Templates only transform data structure, never render UI

### Layer 2: Table Engine
```
TableContainer → Manages layout, scroll sync, refs
├── Provides context to all sections
├── Handles A/B and C/D scroll coordination  
└── No business logic, pure orchestration
```
**Rule:** Container only manages structure, never data processing

### Layer 3: Section Rendering
```
Sections A1-D3 → Render specific table areas
├── A1/C1: Fixed headers    B1/D1: Scrolling headers
├── A2/C2: Fixed body       B2/D2: Scrolling body  
├── A3/C3: Fixed footer     B3/D3: Scrolling footer
└── Each section is self-contained with clear props
```
**Rule:** Sections only render, never fetch or transform data

### Layer 4: Cell Types (Future)
```
Cell renderers for specific data types
├── Text, Numbers, Currency, Dates
├── Interactive elements (buttons, dropdowns)  
└── Custom business components
```
**Rule:** Cell types handle display format, not business logic

## Implementation Phases

### Phase 1: Foundation (Current Priority)
**Goal:** Make NestedTable production-ready to replace Table.jsx

**Tasks:**
1. ✅ Create basic templates (productPerformance.js)
2. ⚠️ **NEXT:** Migrate proven Table.jsx features into NestedTable
   - Custom cell renderers
   - Full-width row support
   - Proper error handling
3. Test with real data end-to-end
4. Remove redundant Table.jsx when NestedTable works

**Success criteria:** NestedTable can display any table that Table.jsx currently handles

### Phase 2: Templates
**Goal:** Support all major retail analysis use cases

**Tasks:**
1. Build core templates: orders, products, variants, customers
2. Template registry for easy selection
3. Options system for template customization
4. Documentation with examples

**Success criteria:** Any new analysis request uses existing templates

### Phase 3: Polish  
**Goal:** Production quality with advanced features

**Tasks:**
1. Advanced cell types and formatters
2. Interactive elements and toolbars
3. Performance optimization
4. Comprehensive error handling

**Success criteria:** System handles edge cases gracefully

## Decision Framework
**When implementing any feature, ask:**

1. **Does this belong in a template or section?**
   - Data transformation → Template
   - UI rendering → Section
   - Layout management → Container

2. **Is this needed now or later?**
   - Block current use case → Do now
   - Nice to have → Phase 2/3
   - Edge case → Document for future

3. **Does this create coupling?**
   - If yes, find simpler approach
   - If no, proceed with minimum implementation

## Anti-Patterns to Avoid
❌ **Complex configuration objects** - Use simple props instead
❌ **One-size-fits-all functions** - Build focused, composable pieces  
❌ **Premature abstraction** - Solve real problems, not imagined ones
❌ **Data+UI coupling** - Keep data transformation separate from rendering
❌ **Feature creep** - Stick to current phase goals

## Success Metrics
- **Lines of code decrease** as redundant systems are removed
- **New use cases** work with existing templates (no new code)
- **Development speed** increases for table-based features
- **Bug frequency** decreases due to simpler, focused components

## Current Next Steps
1. **Complete productPerformance template integration**
2. **Identify gaps between Table.jsx and NestedTable features**  
3. **Migrate one proven Table.jsx feature at a time**
4. **Test each migration with real data**
5. **Remove redundant code only after replacement works**

---

**Use this plan to keep development focused and prevent overengineering. When in doubt, choose the simpler approach and defer complexity.**