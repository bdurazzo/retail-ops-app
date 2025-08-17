// 📄 data/metrics/archivalMetrics.js
// ROLE: Metrics safe at style-level (ARCHIVAL ok).

import { styleKey } from "../keys";
import { DATA_SCOPE } from "../governance/dataScopes";

export function averageOrderValue({ rows /*, scope */ }) {
  // AOV at order level — safe for archival as it doesn't need variant.
  // ... compute from Product Subtotal / Product Net and group as needed
  return { value: 0, orders: 0 }; // placeholder
}