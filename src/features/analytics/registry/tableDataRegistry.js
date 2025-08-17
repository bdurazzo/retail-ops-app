// 📄 src/features/analytics/registry/tableDataRegistry.js
//
// Role: KPI → data → table executor (no mocks, no single-CSV legacy path).
// Inputs  : kpiId (string) + criteria (period/date/datePrefix/etc.)
// Outputs : formatted table object for GeneratedTable (columnKeys, rows, totals, meta)
//
// Architecture:
//   registry/kpiRegistry.getKPI → data/loaders/scopeRouter → data/metrics (group+measure) → logic/processData
//
// This file intentionally contains NO parsing logic and NO UI code.

import { getFormattedTableData } from "../logic/processData.js";
import { getKPI } from "./kpiRegistry.js";
import { loadOrdersByScope } from "../data/loaders/scopeRouter.js";
import { dimensionKey } from "../data/metrics/dimensions.js";
import { groupBy, computeMeasures } from "../data/metrics/aggregate.js";

/**
 * Build one display row from a bucket key + computed measures,
 * respecting the program's dimension so columns appear consistently.
 */
function buildDisplayRow(program, key, measures) {
  const parts = key.split("|"); // product | (color?) | (size?)
  const row = { "Product Name": parts[0] || "" };

  if (program.dimension.includes("product_color")) {
    row["Color"] = parts[1] || "";
  }
  if (program.dimension.includes("product_size")) {
    // when color+size, size is last; when only size, it's parts[1]
    const sizePart = program.dimension === "product_size" ? parts[1] : parts.at(-1);
    row["Size"] = sizePart || "";
  }

  // Standard measures we support across Top Performers
  row["Orders"] = measures.orders ?? 0;
  row["Units"] = measures.units ?? 0;
  row["Net Revenue"] = measures.net_revenue ?? 0;
  row["AOV"] = measures.aov ?? 0;

  // If/when attach_rate is computed, include it automatically
  if (typeof measures.attach_rate === "number") {
    row["Attach Rate"] = measures.attach_rate;
  }

  return row;
}

/**
 * Public API: fetch, aggregate, and format a table for any KPI program.
 * @param {string} kpiId - e.g., "top_aov_prod"
 * @param {object} criteria - { period, date, datePrefix, channel, status, limit, params }
 * @returns {Promise<{ columnKeys, rows, totals, rowCount, columnCount, meta }>}
 */
export async function getTableForKPI(kpiId, criteria = {}) {
  // 1) Resolve the program configuration
  const program = getKPI(kpiId); // throws helpful error if missing

  // 2) Load rows via scope-aware router (FULL / ARCHIVAL / BOTH enforced there)
  const { rows, period, meta: loadMeta } = await loadOrdersByScope({
    scope: program.scope,
    ...criteria,
  });

  // 3) Group rows by the program's dimension (product / product_color / product_size / product_color_size)
  const keyFn = dimensionKey[program.dimension];
  if (!keyFn) throw new Error(`Unknown dimension: ${program.dimension}`);
  const buckets = groupBy(rows, keyFn); // Map<key, row[]>

  // 4) Compute measures per bucket and build display rows
  const rolled = [];
  for (const [key, bucketRows] of buckets.entries()) {
    const m = computeMeasures(program.metric, bucketRows); // { orders, units, net_revenue, aov, attach_rate? }
    rolled.push(buildDisplayRow(program, key, m));
  }
  // 4.5) Optional sort & limit from criteria (or program preset)
  let sorted = rolled;
  const s = criteria?.sort;
  if (s && s.key) {
    const dir = s.dir === "asc" ? "asc" : "desc";
    sorted = [...rolled].sort((a, b) => {
      const av = a?.[s.key];
      const bv = b?.[s.key];
      const an = typeof av === "number" && Number.isFinite(av);
      const bn = typeof bv === "number" && Number.isFinite(bv);
      let cmp;
      if (an && bn) {
        cmp = av - bv;
      } else {
        const as = av == null ? "" : String(av);
        const bs = bv == null ? "" : String(bv);
        cmp = as.localeCompare(bs, undefined, { numeric: true, sensitivity: "base" });
      }
      return dir === "asc" ? cmp : -cmp;
    });
  }
  const hardLimit = criteria?.limit ?? program?.columns?.limit;
  if (Number.isFinite(hardLimit) && hardLimit > 0) {
    sorted = sorted.slice(0, hardLimit);
  }

  // 5) Hand off to your existing table formatter with program's column preset
  const table = getFormattedTableData(sorted, program.columns || {});

  // 6) Attach minimal meta so the UI can show context/warnings if desired
  table.meta = {
    ...(table.meta || {}),
    period: criteria.period ?? period ?? null,
    scope: program.scope,
    kpiId,
    dimension: program.dimension,
    metric: program.metric,
    sort: s || null,
    limit: hardLimit ?? null,
    loadMeta: loadMeta ?? null,
  };

  return table;
}

// Default export (optional convenience): namespace-like object
export default {
  getTableForKPI,
};