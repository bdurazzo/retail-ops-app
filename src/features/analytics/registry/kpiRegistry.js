// 📄 src/features/analytics/registry/kpiRegistry.js
// (only showing the relevant lines)

import topPerformers from "./kpis/top_performers.js"; // <- this file

// collect all programs across families
const ALL = [
  ...topPerformers,
  // ...include other KPI families here
];

// Build a lookup map by id
const BY_ID = new Map(ALL.map(p => [p.id, p]));

export function getKPI(id) {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`KPI not found: ${id}`);
  return p;
}

export default { getKPI };