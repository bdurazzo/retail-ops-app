// OrdersKeywordIndex.js
// Lightweight, client-side inverted index over retail orders for fast keyword lookups.
// Initial implementation builds in-memory from OrdersRepository for the current time range
// (or a recent default) and supports searching across selected dimensions.

import { OrdersRepository } from "../repositories/OrdersRepository.js";

// Default dimensions mapped to normalized row fields
const DIM_ALIASES = {
  "product.title": "product_name",
  "product_name": "product_name",
  sku: "sku",
  color: "color",
  size: "size",
  order_id: "order_id",
  demand_store: "demand_store",
  fulfillment_store: "fulfillment_store",
  channel: "channel",
  fulfillment_type: "fulfillment_type",
};

const FIELD_READERS = {
  product_name: (r) => r["Product Name"] || "",
  sku: (r) => r.sku || "",
  color: (r) => r.Color || "",
  size: (r) => r.Size || "",
  order_id: (r) => r.order_id || "",
  demand_store: (r) => r.demand_store || "",
  fulfillment_store: (r) => r.fulfillment_store || "",
  channel: (r) => r.channel || "",
  fulfillment_type: (r) => r.fulfillment_type || "",
};

function normalizeDims(dims) {
  if (!Array.isArray(dims) || dims.length === 0) return ["product_name", "sku", "color", "size"]; // sensible defaults
  const out = [];
  for (const d of dims) {
    const k = String(d || "");
    const mapped = DIM_ALIASES[k] || k;
    if (FIELD_READERS[mapped]) out.push(mapped);
  }
  return out.length > 0 ? out : ["product_name", "sku", "color", "size"];
}

function tokenize(text) {
  const t = (text || "").toLowerCase().trim();
  if (!t) return [];
  const parts = t
    .split(/\s+/)
    .map((x) => x.replace(/[^a-z0-9\-_.]/g, ""))
    .filter((x) => x && x.length >= 2);
  return parts;
}

function ymKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function defaultTimeRange() {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
  return { startYYYYMM: ymKey(start), endYYYYMM: ymKey(end) };
}

class InvertedIndex {
  constructor() {
    this.indexByDim = {}; // dim -> Map(term -> Set(order_id))
    this.docs = []; // optional row cache for lightweight summaries
    this.ready = false;
    this.keyedByOrder = new Map(); // order_id -> first row summary
  }

  ensureDim(dim) {
    if (!this.indexByDim[dim]) this.indexByDim[dim] = new Map();
    return this.indexByDim[dim];
  }

  addTerm(dim, term, orderId) {
    const m = this.ensureDim(dim);
    let s = m.get(term);
    if (!s) {
      s = new Set();
      m.set(term, s);
    }
    s.add(orderId);
  }

  buildFromRows(rows, dims) {
    const usedDims = normalizeDims(dims);
    for (const r of rows) {
      const orderId = String(r.order_id || "");
      if (!orderId) continue;
      if (!this.keyedByOrder.has(orderId)) {
        this.keyedByOrder.set(orderId, {
          order_id: orderId,
          title: String(r["Product Name"] || ""),
          sku: r.sku || "",
          color: r.Color || "",
          size: r.Size || "",
        });
      }
      for (const dim of usedDims) {
        const reader = FIELD_READERS[dim];
        if (!reader) continue;
        const val = String(reader(r) || "").toLowerCase();
        if (!val) continue;
        const terms = tokenize(val);
        for (const term of terms) this.addTerm(dim, term, orderId);
      }
    }
    this.ready = true;
  }

  search({ text, dims, op = "AND", limit = 200 }) {
    const tokens = tokenize(text);
    if (tokens.length === 0) return { orderIds: [], items: [] };
    const usedDims = normalizeDims(dims);

    // For each token, compute union across requested dims
    const perTokenSets = tokens.map((tok) => {
      const union = new Set();
      for (const dim of usedDims) {
        const m = this.indexByDim[dim];
        const s = m ? m.get(tok) : null;
        if (!s) continue;
        for (const id of s) union.add(id);
      }
      return union;
    });

    // Intersect or union across tokens
    let finalSet;
    if (op === "OR") {
      finalSet = new Set();
      for (const s of perTokenSets) for (const id of s) finalSet.add(id);
    } else {
      // AND (default)
      finalSet = perTokenSets[0];
      for (let i = 1; i < perTokenSets.length; i++) {
        const next = perTokenSets[i];
        const keep = new Set();
        for (const id of finalSet) if (next.has(id)) keep.add(id);
        finalSet = keep;
      }
    }

    const orderIds = Array.from(finalSet).slice(0, limit);
    const items = orderIds.map((oid) => this.keyedByOrder.get(oid)).filter(Boolean);
    return { orderIds, items };
  }
}

const STATE = {
  index: null,
  lastDimsKey: null,
  lastRangeKey: null,
};

export const OrdersKeywordIndex = {
  async init({ dims, time } = {}) {
    // Build or reuse index for dims + time range
    const usedDims = normalizeDims(dims);
    const dimsKey = usedDims.join("|");
    const tr = time && time.startYYYYMM && time.endYYYYMM ? time : defaultTimeRange();
    const rangeKey = `${tr.startYYYYMM}-${tr.endYYYYMM}`;

    if (STATE.index && STATE.lastDimsKey === dimsKey && STATE.lastRangeKey === rangeKey) return STATE.index;

    const { rows } = await OrdersRepository.findByMonthRange(tr);
    const idx = new InvertedIndex();
    idx.buildFromRows(rows || [], usedDims);
    STATE.index = idx;
    STATE.lastDimsKey = dimsKey;
    STATE.lastRangeKey = rangeKey;
    return idx;
  },

  async search({ text, dims, time, op = "AND", limit = 200 } = {}) {
    const idx = await this.init({ dims, time });
    return idx.search({ text, dims, op, limit });
  },
};

