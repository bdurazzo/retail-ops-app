// Period-aware CSV loader for orders (2023-12+ but safe for earlier months too).
// Builds the monthly path from the registry sample and parses rows with Papa.

import Papa from "papaparse";
import { getDataPaths, loadJsonBrowser } from "../../../../../lib/dataPaths.js";

// Build a monthly URL from any sample path in the registry
function buildOrdersUrlForPeriod(sampleUrlFromRegistry, period) {
  // sample: data/NewStore/orders/2025/2025-07/2025-07_orders_in_store.csv
  const base = sampleUrlFromRegistry.split("/orders/")[0] + "/orders";
  const yyyy = period.slice(0, 4);
  return `${base}/${yyyy}/${period}/${period}_orders_in_store.csv`;
}

function inferPeriodFromPath(url) {
  const m = url.match(/\/(\d{4})\/(\d{4}-\d{2})\//);
  return m ? m[2] : undefined;
}

const EXPECTED_COLUMNS = [
  "Order ID",
  "Channel",
  "Status",
  "Order Date/Time",
  "Timezone",
  "Product Name",
  "Color",
  "Size",
  "Product Net",
  "Product Subtotal",
  "Currency",
  "Item Qty.",
  "Quantity",
];

function normalizeRow(row) {
  const out = { ...row };
  for (const k of EXPECTED_COLUMNS) if (!(k in out)) out[k] = "";
  return out;
}

// criteria: { period, date, datePrefix, channel, status, limit }
export async function loadOrdersRowsForPeriod(criteria = {}) {
  const { period, date, datePrefix } = criteria;

  // Resolve a usable CSV URL from the registry
  const { ordersInStore, meta } = await getDataPaths(
    loadJsonBrowser,
    "/data/registry/index.json"
  );
  const registryLatest = meta?.period || inferPeriodFromPath(ordersInStore);
  const target = period || registryLatest;
  if (!target) {
    throw new Error("Unable to determine target period for orders.");
  }

  const csvUrl = ordersInStore.includes(`/${target}/`)
    ? ordersInStore
    : buildOrdersUrlForPeriod(ordersInStore, target);

  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error(`Failed to fetch CSV at ${csvUrl}: ${res.status}`);
  const text = await res.text();

  const parsed = Papa.parse(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (parsed.errors?.length) {
    const sample = parsed.errors.slice(0, 3).map(e => `${e.type}: ${e.message}`).join(" | ");
    throw new Error(`CSV parse errors (${parsed.errors.length}). Sample: ${sample}`);
  }

  let rows = Array.isArray(parsed.data) ? parsed.data : [];
  rows = rows.map(normalizeRow);

  // Optional string-prefix date slice (fast)
  if (date || datePrefix) {
    rows = rows.filter((r) => {
      const s = String(r["Order Date/Time"] || "");
      if (date && !s.startsWith(date)) return false;           // "YYYY-MM-DD"
      if (datePrefix && !s.startsWith(datePrefix)) return false; // "YYYY-MM-D"
      return true;
    });
  }

  // TODO: channel/status filters here if needed.

  // Optional limit for snappier dev
  if (criteria.limit && Number.isFinite(criteria.limit)) {
    rows = rows.slice(0, criteria.limit);
  }

  return rows;
}

export default { loadOrdersRowsForPeriod };