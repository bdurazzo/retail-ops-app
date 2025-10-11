// src/features/analytics/feeders/tableFeeder.js
import { makeEmptyTable } from "../dtos/TableDTO.js";
import { convertEDTtoPDT } from "../../../core/utils/timezoneConverter.js";
import { getVisibleColumns } from "../adapters/metric/utils/columnConfig.js";

const COLUMN_DISPLAY_LABELS = {
  "Product Name": "Product",
  "UPC": "UPC",
  "Color": "Color", 
  "Size": "Size",
  "Product Net": "Revenue",
  "Order Date/Time": "Date (PDT)",
  "Quantity Sold": "Qty",
  "Average Order Value": "AOV"
};

export function toTable(rows, opts = {}) {
  if (!rows?.length) return makeEmptyTable();

  const kpiData = rows[0]?.__kpis || {};
  const columnKeys = getVisibleColumns(kpiData);

  const tableRows = rows.map((r, i) => {
    const row = {
      "#": i + 1
    };

// Only add columns that are visible
    columnKeys.forEach(columnKey => {
      switch(columnKey) {
        case "Product Name":
            row["Product Name"] = r["Product Name"];
            break;
        case "UPC":
            row["UPC"] = r["UPC"];
            break;
        case "Size":
            row["Size"] = r.Size;
            break;
        case "Color":
            row["Color"] = r.Color;
            break;

        case "Product Net":
            row["Product Net"] = r["Product Net"];
            break;
        case "Order Date/Time": {
            // Prefer legacy public field, else fallback to normalized retail field
            const legacy = r["Order Date/Time"];
            if (legacy) {
              row["Order Date/Time"] = convertEDTtoPDT(legacy);
            } else if (r.order_datetime_normalized) {
              // r.order_datetime_normalized is in "YYYY-MM-DD HH:mm:ss"; show concise local time
              // Keep just date + HH:mm for readability
              const s = String(r.order_datetime_normalized);
              row["Order Date/Time"] = s.length >= 16 ? s.slice(0, 16) : s;
            } else {
              row["Order Date/Time"] = "";
            }
            break;
        }
        case "Quantity Sold":
            row["Quantity Sold"] = r.__groupCount || 1;
            break;
        case "Total Revenue":
            row["Total Revenue"] = r["Product Net"]; // Same as revenue for grouped rows
            break;
        case "Avg Order Value":
            row["Avg Order Value"] = kpiData.averageOrderValue ? kpiData.averageOrderValue.total : 0;
            break;
        }
    });

    return row;
  });

  const totals = {};
  
  // Only calculate totals for visible columns
  if (columnKeys.includes("Product Net")) {
  totals["Product Net"] = tableRows.reduce((a, x) => a + (x["Product Net"] ?? 0), 0);
}
if (columnKeys.includes("Quantity Sold") && kpiData.quantitySold) {
  totals["Quantity Sold"] = kpiData.quantitySold.total;
}
if (columnKeys.includes("Total Revenue") && kpiData.totalRevenue) {
  totals["Total Revenue"] = kpiData.totalRevenue.total;
}
if (columnKeys.includes("Avg Order Value") && kpiData.averageOrderValue) {
  totals["Avg Order Value"] = kpiData.averageOrderValue.total;
}

  return {
    columnKeys,
    displayLabels: columnKeys.map(key => COLUMN_DISPLAY_LABELS[key] || key),
    rows: tableRows,
    totals,
    rowCount: tableRows.length,
    columnCount: columnKeys.length,
    meta: { kpis: kpiData, ...opts.meta },
  };
}

// Export with both names for flexibility
export const toTableDTO = toTable;
export default toTable;
