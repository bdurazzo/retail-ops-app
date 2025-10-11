# Field Mapping Reference

## CRITICAL: Field Name Consistency Rules

This document establishes the **SINGLE SOURCE OF TRUTH** for field naming throughout the retail analytics application. Violating these conventions will break KPI calculations and data flow.

## CSV Raw Data → Normalized Display Fields

| CSV Raw Field | Normalized Display Field | Usage |
|---------------|-------------------------|-------|
| `order_id` | `"Order ID"` | Order identification - use for grouping/filtering |
| `line_number` | `"Line Number"` | Line item sequence - use for attach rate calculations |
| `product_name` | `"Product Name"` | Product identification - primary grouping field |
| `color` | `"Color"` | Product attribute - variant grouping |
| `size` | `"Size"` | Product attribute - variant grouping |
| `quantity` | `"Quantity Sold"` | Sales volume metric |
| `discounted_price` | `"Product Net"` | Revenue after discounts |
| `unit_price` | `"Unit Price"` | Base item price |
| `line_discount` | `"Line Discount"` | Item-level discount amount |
| `taxes` | `"Taxes"` | Tax amount |
| `upc` | `"UPC"` | Product barcode |
| `sku` | `"SKU"` | Stock keeping unit |

## Critical Rules

1. **NEVER USE** `"Order Number"` - always use `"Order ID"`
2. **Raw field access** should ONLY happen in `ordersNormalizer.js`
3. **All KPI calculations** must use normalized display field names
4. **All React components** must use normalized display field names
5. **Line Number is for calculations only** - don't display to users

## KPI Field Usage Patterns

### Attach Rate Calculation
```javascript
// ✅ CORRECT
const orderId = row["Order ID"];
const lineNumber = row["Line Number"];

// ❌ WRONG
const orderId = row["order_id"];
const orderId = row["Order Number"];
```

### Product Grouping
```javascript
// ✅ CORRECT
const productName = row["Product Name"];
const color = row["Color"];
const size = row["Size"];

// ❌ WRONG
const productName = row["product_name"];
const color = row["color"];
```

### Revenue Calculations
```javascript
// ✅ CORRECT
const revenue = row["Product Net"];
const quantity = row["Quantity Sold"];

// ❌ WRONG
const revenue = row["discounted_price"];
const quantity = row["quantity"];
```

## Pipeline Locations

1. **Raw CSV Processing**: `OrdersRepository.js` - handles CSV loading
2. **Field Normalization**: `ordersNormalizer.js` - converts raw → display fields
3. **KPI Calculations**: `kpis/*.js` - use normalized field names only
4. **React Components**: All components - use normalized field names only

## Testing Field Mapping

To verify field mapping consistency:

1. Check that attach rate shows non-zero percentages
2. Verify grouped tables show proper product variants
3. Confirm all KPIs calculate correctly
4. Test that filtering works across all components

## Emergency Debugging

If KPIs suddenly stop working:

1. Check if any code reverted to raw field names (`order_id`, `product_name`, etc.)
2. Verify `ordersNormalizer.js` mapping hasn't changed
3. Ensure no components are mixing raw and normalized field names
4. Test that grouping logic preserves required fields for calculations

**REMEMBER**: The root cause of most KPI failures is field name inconsistency!