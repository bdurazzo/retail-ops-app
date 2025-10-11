// src/pages/Catalog.jsx
import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse"; // ⬅️ remove this line if you use the no-dep fallback below

export function Catalog() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("idle"); // idle|loading|ready|error
  const [error, setError] = useState(null);
  const [q, setQ] = useState(""); // very light search

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    // --- DEP VERSION (Papa Parse) ---
    Papa.parse("data/newstore/catalog/storefront-catalog-en-us.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (result) => {
        if (cancelled) return;
        const normalized = result.data.map(normalizeRow);
        setRows(normalized);
        setStatus("ready");
      },
      error: (err) => {
        if (cancelled) return;
        setError(err?.message || "Failed to parse CSV");
        setStatus("error");
      },
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // --- ZERO-DEP FALLBACK ---
  // If you don't want Papa Parse, delete the Papa block above and use this instead:
  // useEffect(() => {
  //   let cancelled = false;
  //   setStatus("loading");
  //   fetch("/data/catalog.csv")
  //     .then((r) => r.text())
  //     .then((text) => {
  //       if (cancelled) return;
  //       const parsed = csvToJson(text); // simple parser below
  //       const normalized = parsed.map(normalizeRow);
  //       setRows(normalized);
  //       setStatus("ready");
  //     })
  //     .catch((e) => {
  //       if (cancelled) return;
  //       setError(e?.message || "Failed to read CSV");
  //       setStatus("error");
  //     });
  //   return () => {
  //     cancelled = true;
  //   };
  // }, []);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) =>
      (r.title || "").toLowerCase().includes(needle) ||
      (r.brand || "").toLowerCase().includes(needle) ||
      (r.product_id || "").toLowerCase().includes(needle)
    );
  }, [rows, q]);

  if (status === "loading") {
    return (
      <div className="p-4 text-sm text-gray-600">
        Loading catalog…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="p-4 text-sm text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* Search */}
      <div className="mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, brand, or product id…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {/* Tiny stat row */}
      <div className="mb-2 text-xs text-gray-500">
        Showing {filtered.length} of {rows.length} products
      </div>

      {/* Simple responsive grid of cards */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.slice(0, 100).map((p) => (
          <article
            key={p.product_id + p.variation_size_value + p.variation_color_value}
            className="rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className="aspect-square bg-gray-50 flex items-center justify-center">
              {p.primaryImage ? (
                <img
                  src={p.primaryImage.url}
                  alt={p.primaryImage.altText || p.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="text-[10px] text-gray-400">No image</div>
              )}
            </div>
            <div className="p-2">
              <div className="text-[11px] text-gray-500">{p.brand || "—"}</div>
              <div className="text-[13px] font-medium leading-tight line-clamp-2">
                {p.title || "Untitled"}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[12px] font-semibold">
                  {priceLabel(p.price, p.currency)}
                </span>
                <span className="text-[10px] text-gray-500">
                  {p.variation_color_value || "Color"} · {p.variation_size_value || "Size"}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/** ---------- Helpers ---------- **/

/**
 * Normalize one CSV row into a shape that’s easy for UI:
 * - Safely parse JSON-in-a-cell (images, external_identifiers, extended_attributes)
 * - Pick a primary image (first with tag `newstore:main`, else first)
 * - Keep common fields handy
 */
function normalizeRow(row) {
  const images = safeJson(row.images);
  const external = safeJson(row.external_identifiers);
  const attrs = safeJson(row.extended_attributes);

  const primaryImage =
    Array.isArray(images) && images.length
      ? images.find((i) => Array.isArray(i.tags) && i.tags.includes("newstore:main")) ||
        images[0]
      : null;

  return {
    product_id: row.product_id || "",
    title: row.title || "",
    brand: row.brand || "",
    description: row.description || "",
    price: toNumber(row.price),
    currency: row.currency || "USD",
    is_available: toBool(row.is_available),
    variation_color_value: row.variation_color_value || "",
    variation_size_value: row.variation_size_value || "",
    external_identifiers: external,
    extended_attributes: attrs,
    images,
    primaryImage,
  };
}

/** Safely parse JSON from a CSV cell (handles doubled quotes) */
function safeJson(maybeJson) {
  if (!maybeJson || typeof maybeJson !== "string") return null;
  // CSV-embedded JSON often doubles quotes:  "" -> "
  const cleaned = maybeJson.replace(/""/g, '"');
  try {
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch {
    return null;
  }
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  return null;
}

function priceLabel(price, currency) {
  if (price == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `$${price}`;
  }
}

/** Tiny no-dep CSV → JSON (very basic; OK for clean CSV) */
function csvToJson(text) {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  const headers = splitCSV(headerLine);
  return lines.map((line) => {
    const cols = splitCSV(line);
    const obj = {};
    headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
    return obj;
  });
}
function splitCSV(line) {
  // basic CSV splitter with quotes support
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && line[i + 1] === '"') {
      cur += '"'; i++; // escaped quote
    } else if (c === '"') {
      inQ = !inQ;
    } else if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}