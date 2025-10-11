// src/features/analytics/dtos/TableDTO.js
export function makeEmptyTable() {
  return {
    columnKeys: ["Product Name"],
    rows: [],
    totals: {},
    rowCount: 0,
    columnCount: 1,
    meta: {},
  };
}