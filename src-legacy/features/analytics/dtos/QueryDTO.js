export const defaultQuery = { time: null, metric: null, product: null };

const toYM = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 7);
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 7);
  return String(v).slice(0, 7);
};

const toYMD = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 10); // YYYY-MM-DD
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
};

export function normalizeQuery(partial) {
  if (!partial) return defaultQuery;
  const out = { ...defaultQuery };

  if (partial.time) {
    const t = partial.time;
    
    // Get month info for data loading
    const start = toYM(t.startYYYYMM ?? t.start);
    const end   = toYM(t.endYYYYMM   ?? t.end);
    
    // Get full date info for timeAdapter filtering
    const startDate = toYMD(t.startDate);
    const endDate = toYMD(t.endDate);
    
    if (start && end) {
      out.time = { 
        // Month info for data loading
        startYYYYMM: start, 
        endYYYYMM: end,
        // Full date info for timeAdapter filtering
        startDate: startDate,
        endDate: endDate
      };
    } else {
      out.time = null;
    }
  }

  // Add metric normalization
  if (partial.metric) {
    out.metric = Array.isArray(partial.metric) ? partial.metric : [partial.metric];
  }

  // Add product normalization
  if (partial.product) {
    out.product = { ...partial.product };
  }

  return out;
}

export function mergeQueries(prev, applied) {
  const base = normalizeQuery(prev);
  const inc  = normalizeQuery(applied);
  
  // Deep merge product objects to preserve existing filters
  let mergedProduct = null;
  if (base.product || inc.product) {
    mergedProduct = {
      ...(base.product || {}),
      ...(inc.product || {})
    };
  }
  
  return { 
    ...base, 
    ...(inc.time ? { time: inc.time } : {}),
    ...(inc.metric ? { metric: inc.metric } : {}),
    ...(mergedProduct ? { product: mergedProduct } : {})
  };
}