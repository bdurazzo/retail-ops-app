// Scope-aware loader entry point.
// For now, route everything to the FULL loader; we’ll split ARCHIVAL later.

import { loadOrdersRowsForPeriod } from "./fullDataLoader.js";

// criteria: { scope, period, date, datePrefix, channel, status, limit }
export async function loadOrdersByScope(criteria = {}) {
  // In the future we can switch by criteria.scope here.
  const rows = await loadOrdersRowsForPeriod(criteria);
  return {
    rows,
    period: criteria.period ?? null,
    meta: { scopeApplied: criteria.scope ?? null },
  };
}

export default { loadOrdersByScope };