// 📄 data/metrics/hybridMetrics.js
// ROLE: Controlled blends of archival + full. Must document provenance.

import { DATA_SCOPE } from "../governance/dataScopes";

export function aovWithLongHistory({ archivalRows, fullRows }) {
  // Example: overall AOV across a longer window.
  // MUST NOT compute variant KPIs here; style-level only.
  const rows = [...archivalRows, ...fullRows];
  // ... compute
  return { value: 0, archivalSpan: "2023-01..2023-11", fullSpan: "2023-12..present" };
}