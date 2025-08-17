// 📄 data/loaders/archivalDataLoader.js
// ROLE: Load orders for months that may only have Product Name and totals.

import { loadOrdersFull } from "./fullDataLoader"; // reuse URL building/infer helpers via call
import { DATA_SCOPE, requireScope } from "../../governance/dataScopes";

// Thin wrapper: we *use the same monthly CSVs*, but callers must use archival-safe metrics.
export async function loadOrdersArchival(opts) {
  const scope = requireScope(opts.scope);
  if (scope !== DATA_SCOPE.ARCHIVAL && scope !== DATA_SCOPE.BOTH) {
    throw new Error(`[ArchivalDataLoader] Called with scope "${scope}". Use ARCHIVAL or BOTH.`);
  }
  // We can call the same underlying loader; normalization already guards missing fields.
  return loadOrdersFull({ ...opts, scope: DATA_SCOPE.BOTH });
}