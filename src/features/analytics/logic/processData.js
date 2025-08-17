// processData.js
// Purpose: Take rolled rows + a rich columns preset and return a table object
// that the UI can render directly (columnKeys, rows, totals, counts, meta).
//
// This implementation supports your "rich" preset keys:
// - selectColumns: exact order of underlying data keys to include
// - rename:        mapping of underlyingKey -> display label (for headers)
// - numericKeys:   keys that should be treated as numeric in sorting/format (UI hint)
// - sortBy:        { key: "<display or underlying>", dir: "asc" | "desc" }
// - limit:         max number of rows to return
// - format:        { currencyKeys: [], integerKeys: [], emptyDisplay }
// - totals:        { sumKeys: [], weighted: { [targetKey]: { numer, denom } } }
//
// NOTE: We transform row keys to their display labels so header/body/footer
// can use a single list (columnKeys) consistently.

function isNil(v) {
  return v === null || v === undefined || v !== v; // NaN check too
}

function safeNumber(v) {
  const n = typeof v === "string" ? Number(v.replace(/[^0-9.-]/g, "")) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Map a single row's underlying keys -> display keys according to rename map.
 * Only keeps keys listed in selectColumns, and in that order.
 */
function projectRowToDisplay(row, selectColumns, rename) {
  const out = {};
  for (const key of selectColumns) {
    const display = rename?.[key] || key;
    out[display] = row[key];
  }
  return out;
}

/**
 * Build display column keys from selectColumns + rename map.
 */
function buildDisplayColumnKeys(selectColumns, rename) {
  return selectColumns.map((k) => (rename?.[k] || k));
}

/**
 * Compute totals:
 * - sumKeys: simple sums over underlying keys
 * - weighted: e.g., AOV = sum(numer) / sum(denom)
 * Returns totals object with DISPLAY KEYS so it matches the table rows/headers.
 */
function computeTotals(displayColumnKeys, selectColumns, rename, rows, totalsPreset) {
  const totals = {};

  // Pre-sum all underlying keys we might need once
  const sums = {};
  const needSums = new Set([
    ...(totalsPreset?.sumKeys || []),
    ...Object.values(totalsPreset?.weighted || {}).flatMap(({ numer, denom }) => [numer, denom])
  ]);

  for (const key of needSums) sums[key] = 0;

  for (const r of rows) {
    for (const key of needSums) {
      const val = safeNumber(r[key]);
      if (!Number.isNaN(val)) sums[key] += val;
    }
  }

  // Simple sums to DISPLAY keys
  for (const key of (totalsPreset?.sumKeys || [])) {
    const display = rename?.[key] || key;
    totals[display] = sums[key] ?? 0;
  }

  // Weighted metrics to DISPLAY keys
  if (totalsPreset?.weighted) {
    for (const [targetKey, { numer, denom }] of Object.entries(totalsPreset.weighted)) {
      const numerSum = safeNumber(sums[numer]);
      const denomSum = safeNumber(sums[denom]);
      const display = rename?.[targetKey] || targetKey;
      totals[display] = denomSum > 0 ? numerSum / denomSum : null;
    }
  }

  // Ensure every display column exists in totals (or empty placeholder)
  for (const displayKey of displayColumnKeys) {
    if (isNil(totals[displayKey])) totals[displayKey] = "";
  }

  return totals;
}

/**
 * Sort rows using the preset's sortBy. Accepts either underlying or display key.
 * Since we transform rows to DISPLAY keys at the end, we sort on the same.
 */
function sortRowsDisplay(rowsDisplay, sortBy) {
  if (!sortBy?.key) return rowsDisplay;
  const key = sortBy.key;
  const dir = (sortBy.dir || "desc").toLowerCase() === "asc" ? 1 : -1;
  return rowsDisplay.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    const an = typeof av === "number" ? av : safeNumber(av);
    const bn = typeof bv === "number" ? bv : safeNumber(bv);
    if (isNil(an) && isNil(bn)) return 0;
    if (isNil(an)) return 1;   // push empty to bottom
    if (isNil(bn)) return -1;
    if (an < bn) return 1 * dir;
    if (an > bn) return -1 * dir;
    return 0;
  });
}

/**
 * Public API: produce a UI-ready table from raw/rolled rows + preset.
 * @param {Array<Object>} rows - rolled rows using UNDERLYING keys (e.g., "Product Name","AOV")
 * @param {Object} preset     - rich columns preset (see header)
 * @returns {Object} { rowCount, columnCount, columnKeys, rows, totals, meta }
 */
export function getFormattedTableData(rows = [], preset = {}) {
  const selectColumns = preset.selectColumns && preset.selectColumns.length
    ? preset.selectColumns.slice()
    : (rows[0] ? Object.keys(rows[0]) : []);

  const rename = clone(preset.rename || {});
  const numericKeys = (preset.numericKeys || []).slice();
  const sortBy = preset.sortBy ? { key: (preset.rename?.[preset.sortBy.key] || preset.sortBy.key), dir: preset.sortBy.dir } : null;
  const limit = Number.isFinite(preset.limit) ? preset.limit : rows.length;
  const format = clone(preset.format || {});
  const totalsPreset = clone(preset.totals || { sumKeys: [], weighted: {} });

  // 1) Build headers (DISPLAY keys)
  const columnKeys = buildDisplayColumnKeys(selectColumns, rename);

  // 2) Project each UNDERLYING row to DISPLAY row, in the selectColumns order
  const rowsDisplay = rows.map((r) => projectRowToDisplay(r, selectColumns, rename));

  // 3) Sort on DISPLAY rows if requested
  const sorted = sortRowsDisplay(rowsDisplay, sortBy);

  // 4) Apply limit
  const limited = sorted.slice(0, limit);

  // 5) Compute totals into DISPLAY keys
  const totalsRaw = computeTotals(columnKeys, selectColumns, rename, rows, totalsPreset);

  // Align totals order to columnKeys and ensure first column shows a label (e.g., "Total")
  const totals = {};
  for (const key of columnKeys) {
    if (key === columnKeys[0]) {
      totals[key] = "Total"; // first column footer cell label
    } else {
      totals[key] = totalsRaw[key] ?? "";
    }
  }

  // 6) Return UI-ready table
  return {
    rowCount: limited.length,
    columnCount: columnKeys.length,
    columnKeys,                 // DISPLAY keys (e.g., "Net Revenue ($)")
    rows: limited,              // rows keyed by DISPLAY keys
    totals,                     // totals ordered to match columnKeys (first cell = label)
    meta: {
      numericKeys: numericKeys.map((k) => rename[k] || k), // pass through as DISPLAY keys
      format,
      sortBy,                   // already converted to DISPLAY key
    },
  };
}

export default {
  getFormattedTableData,
};