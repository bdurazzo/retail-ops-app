// src/features/analytics/repositories/CatalogRepository.js
// Analytics-only CatalogRepository. Self-contained. Does NOT import from catalog feature.

import Papa from "papaparse";
import { HttpStaticProvider } from "../../../core/io/HttpStaticProvider";
import { DATA_SOURCES } from "../../../core/config/dataSources";
import { normalizeCatalogRow } from "../../../core/utils/catalogNormalizer";

const provider = new HttpStaticProvider();

async function parseCSV(text) {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (r) => resolve(r.data),
      error: reject,
    });
  });
}

async function pathExists(url) {
  try { return await provider.exists(url); } catch { return false; }
}

function ymdParts(d){
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return { yyyy, mm, dd };
}

async function resolveCatalogPath() {
  // Prefer explicit dev override if configured and present; otherwise probe sensible fallbacks.
  const baseDir = DATA_SOURCES.catalog.baseDir;
  const override = DATA_SOURCES.catalog.devOverrideFile;
  if (override && await pathExists(override)) return override;

  // 1) currentFile
  const current = DATA_SOURCES.catalog.currentFile.replace("${baseDir}", baseDir);
  if (await pathExists(current)) return current;

  // 2) Try daily files scanning back up to 120 days
  const dailyPattern = (yyyy, mm, dd) => `${baseDir}/${yyyy}/${yyyy}-${mm}/${yyyy}-${mm}-${dd}_storefront-catalog-en-us.csv`;
  const today = new Date();
  for (let i=0;i<120;i++){
    const d = new Date(today); d.setDate(d.getDate()-i);
    const { yyyy, mm, dd } = ymdParts(d);
    const p = dailyPattern(yyyy, mm, dd);
    if (await pathExists(p)) return p;
  }

  // 3) Try monthly archive pattern for the last 24 months
  const monthlyTpl = DATA_SOURCES.catalog.archivePattern;
  for (let i=0;i<24;i++){
    const d = new Date(today); d.setMonth(d.getMonth()-i);
    const { yyyy, mm } = ymdParts(d);
    const p = monthlyTpl
      .replace("${baseDir}", baseDir)
      .replace("${yyyy}", yyyy)
      .replace("${mm}", mm);
    if (await pathExists(p)) return p;
  }

  // Fallback to current (may 404 but surfaces clearly)
  return current;
}

function buildSearchIndices(products) {
  const idx = {
    byTitle: new Map(),
    byCategory: new Map(),
    byColor: new Map(),
    bySize: new Map(),
    byStyle: new Map(),
    byMaterial: new Map(),
    byGender: new Map(),
  };
  products.forEach((p, i) => {
    const titleWords = String(p.title || "").toLowerCase().split(/\s+/);
    for (const w of titleWords) {
      if (w.length > 2) {
        if (!idx.byTitle.has(w)) idx.byTitle.set(w, []);
        idx.byTitle.get(w).push(i);
      }
    }
    if (p.category) {
      if (!idx.byCategory.has(p.category)) idx.byCategory.set(p.category, []);
      idx.byCategory.get(p.category).push(i);
    }
    if (p.color) {
      const c = String(p.color).toLowerCase();
      if (!idx.byColor.has(c)) idx.byColor.set(c, []);
      idx.byColor.get(c).push(i);
    }
    if (p.size) {
      const s = String(p.size).toLowerCase();
      if (!idx.bySize.has(s)) idx.bySize.set(s, []);
      idx.bySize.get(s).push(i);
    }
    if (p.style) {
      if (!idx.byStyle.has(p.style)) idx.byStyle.set(p.style, []);
      idx.byStyle.get(p.style).push(i);
    }
    if (p.material) {
      if (!idx.byMaterial.has(p.material)) idx.byMaterial.set(p.material, []);
      idx.byMaterial.get(p.material).push(i);
    }
    if (p.gender) {
      if (!idx.byGender.has(p.gender)) idx.byGender.set(p.gender, []);
      idx.byGender.get(p.gender).push(i);
    }
  });
  return idx;
}

function extractHierarchy(products) {
  const h = {
    categories: new Set(),
    styles: new Set(),
    materials: new Set(),
    colors: new Set(),
    sizes: new Set(),
    genders: new Set(),
  };
  products.forEach((p) => {
    if (p.category) h.categories.add(p.category);
    if (p.style) h.styles.add(p.style);
    if (p.material) h.materials.add(p.material);
    if (p.color) h.colors.add(p.color);
    if (p.size) h.sizes.add(p.size);
    if (p.gender) h.genders.add(p.gender);
  });
  return {
    categories: Array.from(h.categories).sort(),
    styles: Array.from(h.styles).sort(),
    materials: Array.from(h.materials).sort(),
    colors: Array.from(h.colors).sort(),
    sizes: Array.from(h.sizes).sort(),
    genders: Array.from(h.genders).sort(),
  };
}

const CACHE = {
  products: null,
  indices: null,
  hierarchy: null,
  lastLoaded: 0,
  filename: null,
  isSelective: false,
};

function filterByIndices(products, indices, filters) {
  let set = new Set(indices);
  return filterByIndexSet(products, set, filters);
}

function filterByIndexSet(products, indexSet, filters) {
  let indices = new Set(indexSet);
  const list = Array.from(indices).map(i => products[i]);
  // Basic filter post-processing; keep simple for now (most filters unused in Styles path)
  return list.filter(p => {
    if (filters?.availableOnly && !p.is_available) return false;
    if (filters?.category && p.category !== filters.category) return false;
    if (filters?.style && p.style !== filters.style) return false;
    if (filters?.material && p.material !== filters.material) return false;
    if (filters?.color && String(p.color||'').toLowerCase() !== String(filters.color).toLowerCase()) return false;
    if (filters?.size && String(p.size||'').toLowerCase() !== String(filters.size).toLowerCase()) return false;
    return true;
  });
}

export const CatalogRepository = {
  async loadCurrentCatalog() {
    const now = Date.now();
    const path = await resolveCatalogPath();
    try { console.log(`[CatalogRepository/analytics] Resolved: ${path}`); } catch {}
    // Reuse cache if same file within 5 minutes
    if (CACHE.products && CACHE.filename === path && (now - CACHE.lastLoaded) < 5 * 60 * 1000) {
      return { products: CACHE.products, indices: CACHE.indices, hierarchy: CACHE.hierarchy, totalCount: CACHE.products.length };
    }
    const text = await provider.getText(path);
    const raw = await parseCSV(text);
    const products = raw.map((r) => normalizeCatalogRow(r)).filter((p) => p.product_id);
    try { console.log(`[CatalogRepository/analytics] Loaded products: ${products.length}`); } catch {}
    const indices = buildSearchIndices(products);
    const hierarchy = extractHierarchy(products);
    CACHE.products = products;
    CACHE.indices = indices;
    CACHE.hierarchy = hierarchy;
    CACHE.lastLoaded = now;
    CACHE.filename = path;
    CACHE.isSelective = false;
    return { products, indices, hierarchy, totalCount: products.length };
  },

  async searchProducts(query, filters = {}) {
    const { products } = await this.loadCurrentCatalog();
    const q = String(query || "").toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g,' ').trim();

    // Empty query => honor filters only
    if (!q) {
      const allIdx = products.map((_, i) => i);
      return filterByIndices(products, allIdx, filters);
    }

    const terms = q.split(/\s+/).filter(Boolean);

    // Simple, reliable: score by title-only term matches (AND), require all terms
    const scored = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const title = String(p.title || '').toLowerCase();
      let score = 0;
      for (const t of terms) if (title.includes(t)) score++;
      if (score === terms.length) scored.push({ index: i, score });
    }
    if (scored.length === 0) return [];

    // Apply filters on the matched subset
    let idxSet = new Set(scored.map(s => s.index));
    const filtered = filterByIndexSet(products, idxSet, filters);

    // Return products sorted by score desc then title asc
    const scoreMap = new Map(scored.map(s => [s.index, s.score]));
    return filtered
      .map(p => ({ ...p, _score: scoreMap.get(products.indexOf(p)) || 0 }))
      .sort((a,b) => (b._score - a._score) || String(a.title||'').localeCompare(String(b.title||'')));
  },

  async getFilterOptions(existingFilters = {}) {
    const filtered = await this.searchProducts('', existingFilters);
    return extractHierarchy(filtered);
  },

  clearCache() {
    CACHE.products = null; CACHE.indices = null; CACHE.hierarchy = null; CACHE.lastLoaded = 0; CACHE.filename = null; CACHE.isSelective = false;
  },
  
  setSelectedProductsCache(selectedProducts) {
    // Replace full cache with only selected products to reduce memory usage
    if (selectedProducts && selectedProducts.length > 0) {
      console.log(`[CatalogRepository] Replacing cache with ${selectedProducts.length} selected products`);
      CACHE.products = selectedProducts;
      CACHE.indices = buildSearchIndices(selectedProducts);
      CACHE.hierarchy = extractHierarchy(selectedProducts);
      // Keep cache valid but mark as selective
      CACHE.isSelective = true;
    }
  },
  
  resetToFullCache() {
    // Force reload of full catalog on next request
    if (CACHE.isSelective) {
      console.log('[CatalogRepository] Resetting from selective cache to full cache');
      this.clearCache();
    }
  },
};
