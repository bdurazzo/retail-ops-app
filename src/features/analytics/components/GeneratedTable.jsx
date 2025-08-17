import React, { useMemo, useRef, useEffect } from "react";

/**
 * NEW LAYOUT (matches your rubric & keeps scrollbars where you want them):
 *
 * ┌──────── Card (flex-col, h-full, overflow-hidden) ────────┐
 * │  HeaderRow:  A1 (fixed box)  |  B1 (inside H-SCROLL TOP) │
 * │  ------------------------------------------------------- │
 * │  UnifiedBody SCROLLER (V-SCROLL):                        │
 * │    ├─ A2 column  (fixed left, NO own scroll)             │
 * │    └─ B2 grid    (shares V-SCROLL, NO own scroll)        │
 * │  ------------------------------------------------------- │
 * │  FooterRow:  A3 (fixed box)  |  B3 (H-SCROLL BOTTOM)     │
 * └──────────────────────────────────────────────────────────┘
 *
 * - Horizontal scrolling is owned by the B3 strip at the bottom.  
 *   B1 is kept in sync (scrollLeft mirrors B3).  
 * - Vertical scrolling is owned by the middle container only, so A2 & B2 move together.  
 * - A1 and A3 never move.  
 * - First column is a narrow fixed box; metric columns have a fixed min width and can overflow horizontally.
 */

export default function GeneratedTable(props) {
  const table = props.table ?? {};
  const columnKeys = props.columnKeys ?? table.columnKeys ?? [];
  const rows = props.rows ?? table.rows ?? [];
  const totals = props.totals ?? table.totals ?? {};

  // ——— controlled sorting (UI only): parent owns state
  const sortKey = props.sortKey ?? null;                 // e.g., "Net Revenue"
  const sortDir = props.sortDir ?? 'desc';               // 'asc' | 'desc'
  const onSort  = typeof props.onSort === 'function' ? props.onSort : null;

  const isSortable = (key) => key !== (columnKeys[0] ?? 'Item'); // avoid sorting by first col by default
  const nextDir = (key) => (sortKey === key && sortDir === 'desc' ? 'asc' : 'desc');

  // —— knobs you can tweak centrally
  const FIRST_COL_PX = 120;      // fixed width for first (name) column
  const METRIC_MIN_PX = 100;      // min width per metric column
  const HEADER_H = 34;           // header strip height
  const ROW_H = 50;              // body row height (kept in sync across A2/B2)
  const FOOTER_H = 34;           // footer strip height

  // Keys
  const A_KEY = columnKeys[0] ?? "Item";
  const B_KEYS = useMemo(() => columnKeys.slice(1), [columnKeys]);

  // Derived width for the metric track (B1/B2/B3)
  const totalMetricWidth = useMemo(
    () => Math.max(0, B_KEYS.length * METRIC_MIN_PX),
    [B_KEYS.length]
  );

  // Refs for scroll sync
  const vScrollRef = useRef(null);      // unified vertical scroller (A2 + B2)
  const hTopRef = useRef(null);         // B1 (top header) horizontal container
  const hBottomRef = useRef(null);      // B3 (bottom footer) horizontal container (owns scrollbar)
  const b1TrackRef = useRef(null);     // inner track for B1 (header)
  const b2TrackRef = useRef(null);     // inner track for B2 (body)

  // Keep B1 horizontally in sync with B3 (the only place that shows the H scrollbar)
  useEffect(() => {
    const top = hTopRef.current;        // header container (overflow hidden)
    const bottom = hBottomRef.current;  // footer container (has real h-scrollbar)
    const b1Track = b1TrackRef.current; // header inner track we translate
    const b2Track = b2TrackRef.current; // body inner track we translate

    if (!top || !bottom || !b1Track || !b2Track) return;

    // Apply translateX to header/body tracks to mirror bottom's scrollLeft
    const syncTracks = () => {
      const x = Math.round(bottom.scrollLeft);
      const tx = `translate3d(${-x}px,0,0)`;
      if (b1Track.style.transform !== tx) b1Track.style.transform = tx;
      if (b2Track.style.transform !== tx) b2Track.style.transform = tx;
    };

    // When bottom scrolls (user interacts with the real scrollbar), mirror tracks
    const onBottomScroll = () => syncTracks();

    // Allow horizontal wheel/trackpad gestures on the header and body to drive bottom
    const onHorizontalWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        bottom.scrollLeft += e.deltaX;
        syncTracks();
      }
    };

    bottom.addEventListener("scroll", onBottomScroll, { passive: true });
    top.addEventListener("wheel", onHorizontalWheel, { passive: false });
    // Also listen on the vertical scroller region so body can drive horizontal
    const v = vScrollRef.current;
    if (v) v.addEventListener("wheel", onHorizontalWheel, { passive: false });

    // Initial sync in case bottom already scrolled
    syncTracks();

    return () => {
      bottom.removeEventListener("scroll", onBottomScroll);
      top.removeEventListener("wheel", onHorizontalWheel);
      if (v) v.removeEventListener("wheel", onHorizontalWheel);
    };
  }, []);

  // Formatting per your rules
  const formatVal = (key, val) => {
    if (val == null || val === "") return "—";
    if (typeof val !== "number") return String(val);
    const k = String(key);
    if (k.includes("UPT") || k.includes("Attach Rate")) return val.toFixed(2);
    if (k.includes("Revenue") || k.includes("Net") || k.includes("AOV")) {
      return `$${Math.round(val).toLocaleString()}`;
    }
    return Math.round(val).toLocaleString();
  };

  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-lg shadow-med flex flex-col overflow-hidden">
      {/* ───────────────────────── Header Row: A1 | B1 ───────────────────────── */}
      <div className="flex-none border-b border-gray-200 bg-gray-50">
        <div className="flex">
          {/* A1 — fixed name header box */}
          <div
            className="flex-none border-r border-gray-200 px-2 flex items-center text-[12px] font-semibold text-gray-900 relative z-50"
            style={{ width: FIRST_COL_PX, height: HEADER_H }}
            title={A_KEY}
          >
            {A_KEY}
          </div>

          {/* B1 — metric headers in a horizontally scrollable track (synced with B3) */}
          <div className="flex-1 overflow-hidden relative" ref={hTopRef} style={{ height: HEADER_H }}>
            <div className="h-full will-change-transform" style={{ width: totalMetricWidth }} ref={b1TrackRef}>
              <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${B_KEYS.length}, ${METRIC_MIN_PX}px)` }}>
                {B_KEYS.map((k) => (
                  <button
                    type="button"
                    key={`h-${k}`}
                    onClick={onSort && isSortable(k) ? () => onSort(k, nextDir(k)) : undefined}
                    className={`px-2 flex items-center justify-center gap-1 text-[12px] font-semibold h-full whitespace-nowrap border-r border-gray-100 select-none ${
                      onSort && isSortable(k) ? 'text-gray-900 hover:bg-gray-100 cursor-pointer' : 'text-gray-900 cursor-default'
                    }`}
                    title={String(k)}
                    aria-sort={sortKey === k ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <span>{String(k)}</span>
                    {sortKey === k ? (
                      <span className="inline-block text-gray-500 leading-none" aria-hidden>
                        {sortDir === 'asc' ? '▲' : '▼'}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 w-px bg-gray-200 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ──────────────────────── Unified Vertical Scroller ─────────────────────── */}
      <div className="flex-1 min-h-0">
        <div className="flex h-full min-h-0 overflow-y-scroll overflow-x-hidden" ref={vScrollRef} style={{ scrollbarGutter: 'stable both-edges' }}>
          {/* A2 — fixed left column inside the shared V scroller */}
          <div
            className="flex-none bg-white relative z-50 isolate"
            style={{ width: FIRST_COL_PX }}
          >
            {rows.length ? (
              rows.map((row, rIdx) => (
                <div
                  key={`a2-${rIdx}`}
                  className={rIdx % 2 ? "bg-white relative z-20" : "bg-gray-50 relative z-20"}
                >
                  <div
                    className="px-2 border-r border-gray-200 flex items-center text-[12px] leading-none text-left text-gray-900 whitespace-normal break-words bg-inherit relative z-30"
                    style={{ height: ROW_H }}
                    title={row?.[A_KEY] == null ? "—" : String(row[A_KEY])}
                  >
                    {row?.[A_KEY] == null ? "—" : String(row[A_KEY])}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-2 flex items-center text-[12px] text-gray-500">No rows</div>
            )}
          </div>

          {/* B2 — metric grid inside the same V scroller; translated to mirror B3 */}
          <div className="flex-1 min-h-0 relative z-0">
            <div ref={b2TrackRef} className="will-change-transform transform-gpu relative z-0" style={{ width: totalMetricWidth }}>
              {rows.length ? (
                rows.map((row, rIdx) => (
                  <div key={`b2r-${rIdx}`} className={rIdx % 2 ? "bg-white" : "bg-gray-50"}>
                    <div
                      className="grid"
                      style={{ gridTemplateColumns: `repeat(${B_KEYS.length}, ${METRIC_MIN_PX}px)` }}
                    >
                      {B_KEYS.map((k, cIdx) => {
                        const display = formatVal(k, row?.[k]);
                        return (
                          <div
                            key={`b2c-${rIdx}-${cIdx}`}
                            className="px-2 flex items-center justify-center text-[12px] leading-none text-gray-700 whitespace-nowrap overflow-hidden tabular-nums border-r border-gray-100 last:border-r-0"
                            style={{ height: ROW_H }}
                            title={display}
                          >
                            {display}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className=" px-2 flex items-center text-[12px] text-gray-500">No rows</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────── Footer Row: A3 | B3 ───────────────────────── */}
      <div className="flex-none border-t border-gray-200 bg-white">
        <div className="flex">
          {/* A3 — fixed footer label */}
          <div
            className="flex-none border-r border-gray-200 px-2 flex items-center text-[12px] font-semibold text-gray-900 relative z-50"
            style={{ width: FIRST_COL_PX, height: FOOTER_H }}
          >
            Total
          </div>

          {/* B3 — horizontal scroller that OWNS the scrollbar; also drives B1 */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden relative z-50" ref={hBottomRef}>
            <div className="h-full" style={{ width: totalMetricWidth }}>
              <div
                className="grid"
                style={{ gridTemplateColumns: `repeat(${B_KEYS.length}, ${METRIC_MIN_PX}px)` }}
              >
                {B_KEYS.map((k) => {
                  const display = formatVal(k, totals?.[k]);
                  return (
                    <div
                      key={`b3-${k}`}
                      className="px-2 flex items-center justify-center text-[12px] font-medium text-gray-900 h-full whitespace-nowrap tabular-nums border-r border-gray-100 last:border-r-0 bg-white relative z-50"
                      style={{ height: FOOTER_H }}
                      title={display}
                    >
                      {display ?? "—"}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 w-px bg-gray-200 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}