// 📄 data/metrics/fullMetrics.js
// ROLE: Metrics that REQUIRE variant-level fidelity (FULL only).

import { DATA_SCOPE, assertVariantAllowed } from "../governance/dataScopes";
import { orderComposite } from "../keys";

export function attachRate({ rows, scope }) {
  assertVariantAllowed(scope, "attachRate needs color/size/variant detail.");
  // ... compute attach rate using orderComposite(...) here
  return { value: 0, basis: rows.length }; // placeholder
}