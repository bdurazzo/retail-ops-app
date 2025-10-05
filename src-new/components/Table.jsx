import { sortTableRows, getNextSortState, getSortIndicator, isColumnSortable } from '../core/utils/tableSorting';
import { COLUMN_LABELS } from '../core/config/tableConfig';
import React, { useMemo, useRef, useEffect, useState } from "react";

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

export default function Table(props) {
  const table = props.table ?? {};
  const columnKeys = props.columnKeys ?? table.columnKeys ?? [];
  const rows = props.rows ?? table.rows ?? [];
  const totals = props.totals ?? table.totals ?? {};
  
  
  // Real sorting state - managed internally by Table
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Apply sorting to the actual rows
  const sortedRows = sortKey ? sortTableRows(rows, sortKey, sortDirection) : rows;
  
  // Handle sort clicks
  const handleSort = (columnKey) => {
    if (props.disableSorting || !isColumnSortable(columnKey)) return;
    
    const { sortKey: newSortKey, sortDirection: newSortDirection } = getNextSortState(
      sortKey, 
      columnKey, 
      sortDirection
    );
    
    setSortKey(newSortKey);
    setSortDirection(newSortDirection);
    
    // Reset table scroll to top when sorting changes
    if (vScrollRef.current) {
      vScrollRef.current.scrollTop = 0;
    }
  };
  
  // --- placeholder layout controls (so the table keeps its shape when empty)
  const PLACEHOLDER_ROWS = Number.isFinite(props.placeholderRows) ? props.placeholderRows : 12; // visible stub rows
  const PLACEHOLDER_COLS = Number.isFinite(props.placeholderCols) ? props.placeholderCols : 4;  // metric columns when none yet

  const MIN_VISIBLE_ROWS = Number.isFinite(props.minVisibleRows) ? props.minVisibleRows : PLACEHOLDER_ROWS;
  const MIN_VISIBLE_COLS = Number.isFinite(props.minVisibleCols) ? props.minVisibleCols : PLACEHOLDER_COLS;

  // —— knobs you can tweak centrally (now configurable via props)
  const FIRST_COL_PX = props.firstColWidth || 120;      // fixed width for first (name) column
  const METRIC_MIN_PX = props.metricColWidth || 80;     // min width per metric column
  const HEADER_H = props.headerHeight !== undefined ? props.headerHeight : 35;            // header strip height
  const ROW_H = props.rowHeight !== undefined ? props.rowHeight : 50;                  // body row height (kept in sync across A2/B2)
  const FOOTER_H = props.footerHeight !== undefined ? props.footerHeight : 35;            // footer strip height

  // Hide sections if height is 0
  const showHeader = HEADER_H > 0;
  const showBody = ROW_H > 0;
  const showFooter = FOOTER_H > 0;
  
  console.log('Table render:', { HEADER_H, ROW_H, FOOTER_H, showHeader, showBody, showFooter });

  // —— container styling (configurable via props)
  const containerBorder = props.containerBorder || "border-t border-gray-200";
  const containerShadow = props.containerShadow || "drop-shadow-xl shadow-gray-900";
  const containerRounded = props.containerRounded || "rounded-b-xl";
  const containerClasses = props.containerClasses || `w-full h-full ${containerBorder} ${containerShadow} ${containerRounded} flex flex-col overflow-hidden`;

  // —— section styling (configurable via props)
  const a1Rounded = props.a1Rounded !== undefined ? props.a1Rounded : "rounded-tl"; // top-left corner
  const a3Rounded = props.a3Rounded !== undefined ? props.a3Rounded : "rounded-bl"; // bottom-left corner  
  const b1Rounded = props.b1Rounded !== undefined ? props.b1Rounded : "rounded-tr"; // top-right corner
  const b3Rounded = props.b3Rounded !== undefined ? props.b3Rounded : "rounded-br"; // bottom-right corner

  // —— header and footer custom styling
  const headerClasses = props.headerClasses || "";
  const footerClasses = props.footerClasses || "";
  
  // —— individual section custom styling
  const a1Classes = props.a1Classes || "";
  const a2Classes = props.a2Classes || "";
  const a3Classes = props.a3Classes || "";
  const b1Classes = props.b1Classes || "";
  const b2Classes = props.b2Classes || "";
  const b3Classes = props.b3Classes || "";

  // Keys
  const A_KEY = columnKeys[0] ?? "Product Name";
  const B_KEYS = useMemo(() => columnKeys.slice(1), [columnKeys]);

  // Use shared column labels with props override
  const HEADER_LABELS = props.columnLabels || COLUMN_LABELS;
  const A_DISPLAY = HEADER_LABELS[A_KEY] || A_KEY;
  const B_DISPLAY_KEYS = B_KEYS.map(key => HEADER_LABELS[key] || key);
  // If there are no metric columns yet, keep a stable grid using placeholder columns.
  const EFFECTIVE_METRIC_COUNT = Math.max(B_KEYS.length, MIN_VISIBLE_COLS);

  // Column width calculation with custom width support
  const columnWidths = useMemo(() => {
    const customWidths = props.columnWidths || {};
    const widths = [];
    
    // Calculate widths for real columns
    for (let i = 0; i < B_KEYS.length; i++) {
      const columnKey = B_KEYS[i];
      const customWidth = customWidths[columnKey];
      widths.push(customWidth || METRIC_MIN_PX);
    }
    
    // Add placeholder column widths if needed
    while (widths.length < EFFECTIVE_METRIC_COUNT) {
      widths.push(METRIC_MIN_PX);
    }
    
    return widths;
  }, [B_KEYS, EFFECTIVE_METRIC_COUNT, props.columnWidths, METRIC_MIN_PX]);
  
  // Generate grid template for custom column widths
  const gridTemplate = useMemo(() => {
    return columnWidths.map(width => `${width}px`).join(' ');
  }, [columnWidths]);

  // Derived width for the metric track (B1/B2/B3)
  const totalMetricWidth = useMemo(() => {
    return Math.max(0, columnWidths.reduce((sum, width) => sum + width, 0));
  }, [columnWidths]);

  // Text alignment helpers
  const getAlignmentClasses = (alignment) => {
    switch (alignment) {
      case 'left': return 'justify-start text-left';
      case 'right': return 'justify-end text-right';
      case 'center': 
      default: return 'justify-center text-center';
    }
  };

  const headerAlignment = props.headerAlignment || 'center';
  const bodyAlignment = props.bodyAlignment || 'center';
  const footerAlignment = props.footerAlignment || 'center';
  const columnAlignments = props.columnAlignments || {};

  // Build displayRows using SORTED data and keep at least MIN_VISIBLE_ROWS even when we have fewer real rows
  const displayRows = useMemo(() => {
    // If body should be hidden, return empty array
    if (!showBody) return [];
    
    const count = Math.max(sortedRows.length, MIN_VISIBLE_ROWS);
    const out = new Array(count);
    for (let i = 0; i < count; i++) out[i] = sortedRows[i] ?? null; // null marks a placeholder row
    return out;
  }, [sortedRows, MIN_VISIBLE_ROWS, showBody]);

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
    <div className={containerClasses}>
      {/* ───────────────────────── Header Row: A1 | B1 ───────────────────────── */}
      {showHeader && (
      <div className={`flex-none bg-gradient-to-b from-gray-50 via-gray-50 to-gray-1000 ${headerClasses}`}>
        <div className="flex">
          {/* A1 — fixed name header box */}
          <div
            className={`flex-none px-3 flex items-center ${getAlignmentClasses(headerAlignment)} text-xs shadow-lg shadow-gray-300 text-gray-600 font-semibold relative z-50 transition-colors ${a1Rounded} ${a1Classes} ${
              (!props.disableSorting && isColumnSortable(A_KEY)) ? 'hover:bg-gray-800 hover:text-white cursor-pointer' : 'text-gray-200'
            }`}
            style={{ width: FIRST_COL_PX, height: HEADER_H }}
            title={A_KEY}
            onClick={props.disableSorting ? undefined : () => handleSort(A_KEY)}
          >
            {(() => {
              // Check for custom header renderer
              const customHeaderRenderer = props.customHeaderRenderer?.[A_KEY];
              if (customHeaderRenderer) {
                const headerContent = customHeaderRenderer(A_KEY, A_DISPLAY);
                // If header renderer returns a full-width toolbar, handle it specially
                if (headerContent && typeof headerContent === 'object' && headerContent.type === 'fullWidthToolbar') {
                  return headerContent.component;
                }
                return headerContent;
              }
              return (
                <>
                  <span>{A_DISPLAY}</span>
                  <span className="ml-1 text-gray-600">{getSortIndicator(A_KEY, sortKey, sortDirection)}</span>
                </>
              );
            })()}
          </div>

          {/* B1 — metric headers in a horizontally scrollable track (synced with B3) */}
          <div className="flex-1 overflow-hidden relative" ref={hTopRef} style={{ height: HEADER_H }}>
            <div className="h-full will-change-transform" style={{ width: totalMetricWidth }} ref={b1TrackRef}>
              <div
                className="grid h-full"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {Array.from({ length: EFFECTIVE_METRIC_COUNT }).map((_, i) => {
                  const isRealCol = i < B_KEYS.length;
                  const k = isRealCol ? B_KEYS[i] : null;
                  const sortable = !props.disableSorting && isRealCol && isColumnSortable(k);
                  return (
                    <button
                      type="button"
                      key={`h-${isRealCol ? k : `ph-${i}`}`}
                      onClick={sortable ? () => handleSort(k) : undefined}
                      className={`flex items-center ${getAlignmentClasses(columnAlignments[k] || headerAlignment)} gap-1 border-r border-gray-100 text-gray-600 text-xs font-semibold h-full whitespace-nowrap select-none transition-colors ${b1Classes} ${
                        sortable ? 'hover:text-white hover:bg-gray-800 cursor-pointer' : 'text-gray-600 cursor-default'
                      } ${i === EFFECTIVE_METRIC_COUNT - 1 ? b1Rounded : ''}`}
                      title={isRealCol ? String(k) : "\u00A0"}
                    >
                      <span>{isRealCol ? B_DISPLAY_KEYS[i] : "\u00A0"}</span>
                      {isRealCol && sortKey === k ? (
                        <span className="inline-block text-gray-600 leading-none" aria-hidden>
                          {getSortIndicator(k, sortKey, sortDirection)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ──────────────────────── Unified Vertical Scroller ─────────────────────── */}
      {showBody && (
      <div 
        className={props.maxBodyHeight ? "flex-none" : "flex-1 min-h-0"}
        style={{ 
          height: props.maxBodyHeight ? `${props.maxBodyHeight}px` : (showBody ? 'auto' : '0px'),
          overflow: showBody ? 'visible' : 'hidden'
        }}
      >
        <div className="flex h-full min-h-0 overflow-y-scroll overflow-x-hidden" ref={vScrollRef} style={{ scrollbarGutter: 'stable both-edges' }}>
          {/* A2 — fixed left column inside the shared V scroller */}
          <div
            className="flex-none bg-white relative z-50 isolate"
            style={{ width: FIRST_COL_PX }}
          >
            {displayRows.map((row, rIdx) => {
              // Check if A_KEY custom renderer returns a full-width component
              const customRenderer = props.customCellRenderer?.[A_KEY];
              const customContent = customRenderer && row !== null 
                ? customRenderer(row[A_KEY], row, rIdx, A_KEY)
                : null;
              
              const isFullWidth = customContent && typeof customContent === 'object' && customContent.type === 'fullWidth';
              
              if (isFullWidth) {
                // For full-width components, render the toolbar part in A2
                return (
                  <div
                    key={`a2-${rIdx}`}
                    className={`${rIdx % 2 ? "bg-gray-50 relative z-20" : "bg-white relative z-20"} ${a2Classes}`}
                  >
                    <div style={{ height: 'auto', minHeight: ROW_H }}>
                      {customContent.a2Content || customContent}
                    </div>
                  </div>
                );
              }
              
              // Check if this is a CellToolbar component (React element)
              const isCellToolbar = customContent && typeof customContent === 'object' && customContent.type;
              
              if (isCellToolbar) {
                // Render CellToolbar directly without constraining wrapper
                return (
                  <div
                    key={`a2-${rIdx}`}
                    className={`${rIdx % 2 ? "bg-gray-50 relative z-20" : "bg-white relative z-20"} ${a2Classes}`}
                    style={{ height: ROW_H }}
                  >
                    {customContent}
                  </div>
                );
              }
              
              // Normal A2 rendering
              return (
                <div
                  key={`a2-${rIdx}`}
                  className={`${rIdx % 2 ? "bg-gray-50 relative z-20" : "bg-white relative z-20"} ${a2Classes}`}
                >
                  <div
                    className={`px-3 flex shadow-xl shadow-gray-200 items-center ${getAlignmentClasses(bodyAlignment)} text-[11px] leading-tight relative z-30 ${
                      row === null ? "text-transparent select-none" : "text-gray-600"
                    }`}
                    style={{ height: ROW_H }}
                    title={row !== null && row?.[A_KEY] ? String(row[A_KEY]) : ""}
                  >
                    <div className="w-full overflow-hidden">
                      <div className="truncate">
                        {(() => {
                          if (row === null) return "Placeholder";
                          
                          if (customContent && typeof customContent !== 'object') {
                            return customContent;
                          }
                          
                          return row?.[A_KEY] == null ? "—" : String(row[A_KEY]);
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* B2 — metric grid inside the same V scroller; translated to mirror B3 */}
          <div className="flex-1 min-h-0 relative z-0">
            <div ref={b2TrackRef} className="will-change-transform transform-gpu relative z-0" style={{ width: totalMetricWidth }}>
              {displayRows.map((row, rIdx) => {
                // Check if A_KEY custom renderer returns a full-width component
                const aCustomRenderer = props.customCellRenderer?.[A_KEY];
                const aContent = aCustomRenderer && row !== null 
                  ? aCustomRenderer(row[A_KEY], row, rIdx, A_KEY)
                  : null;
                
                const isFullWidth = aContent && typeof aContent === 'object' && aContent.type === 'fullWidth';
                
                if (isFullWidth) {
                  // Render B2 content or expand to span A2+B2 if no separate b2Content
                  return (
                    <div key={`fullwidth-${rIdx}`} className={`${rIdx % 2 ? "bg-gray-50" : "bg-white"} ${b2Classes}`}>
                      {aContent.b2Content ? (
                        <div className="w-full">
                          {aContent.b2Content}
                        </div>
                      ) : (
                        <div className="w-full" style={{ marginLeft: `-${FIRST_COL_PX}px`, width: `calc(100% + ${FIRST_COL_PX}px)` }}>
                          {aContent.component}
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Normal grid rendering
                return (
                  <div key={`b2r-${rIdx}`} className={`${rIdx % 2 ? "bg-gray-50" : "bg-white"} ${b2Classes}`}>
                    <div
                      className="grid"
                      style={{ gridTemplateColumns: gridTemplate }}
                    >
                      {Array.from({ length: EFFECTIVE_METRIC_COUNT }).map((_, cIdx) => {
                        const isRealCol = cIdx < B_KEYS.length;
                        const keyForCol = isRealCol ? B_KEYS[cIdx] : null;
                        const display = row === null
                          ? "\u00A0"
                          : (isRealCol ? formatVal(keyForCol, row?.[keyForCol]) : "\u00A0");
                        
                        // Check for custom cell renderer
                        const customRenderer = props.customCellRenderer?.[keyForCol];
                        const cellContent = customRenderer && row !== null && isRealCol 
                          ? customRenderer(row[keyForCol], row, rIdx, keyForCol)
                          : display;
                        
                        // Check if this is a CellToolbar component (React element)
                        const isCellToolbar = cellContent && typeof cellContent === 'object' && cellContent.type;
                        
                        if (isCellToolbar) {
                          // Render CellToolbar directly without constraining wrapper
                          return (
                            <div
                              key={`b2c-${rIdx}-${cIdx}`}
                              className={`border-r border-gray-100 ${row === null || !isRealCol ? "text-transparent select-none" : ""}`}
                              style={{ height: ROW_H }}
                            >
                              {cellContent}
                            </div>
                          );
                        }
                        
                        // Normal cell rendering with constraints
                        return (
                          <div
                            key={`b2c-${rIdx}-${cIdx}`}
                            className={`px-3 flex items-center ${getAlignmentClasses(columnAlignments[keyForCol] || bodyAlignment)} border-r border-gray-100 text-[11px] leading-tight whitespace-normal break-words overflow-hidden tabular-nums ${
                              row === null || !isRealCol ? "text-transparent select-none" : "text-gray-600"
                            }`}
                            style={{ height: ROW_H }}
                            title={row !== null && isRealCol ? (typeof cellContent === 'string' ? cellContent : display) : ""}
                          >
                            {cellContent}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ───────────────────────── Footer Row: A3 | B3 ───────────────────────── */}
      {showFooter && (
      <div className="flex-none bg-gray-50">
        <div className="flex">
          {/* A3 — fixed footer label */}
          <div
            className={`flex-none shadow-gray-300 shadow-lg ${footerClasses || 'bg-gradient-to-t from-gray-50 via-white to-gray-100'} ${a3Classes} flex items-center ${getAlignmentClasses(footerAlignment)} text-xs font-semibold text-gray-700 relative z-[60] ${a3Rounded}`}
            style={{ width: FIRST_COL_PX, height: FOOTER_H }}
          >
            {totals?.[columnKeys[0]] || 'Total'}
          </div>

          {/* B3 — horizontal scroller that OWNS the scrollbar; also drives B1 */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden relative z-50" ref={hBottomRef}>
            <div className="h-full" style={{ width: totalMetricWidth }}>
              <div
                className="grid"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {Array.from({ length: EFFECTIVE_METRIC_COUNT }).map((_, i) => {
                  const isRealCol = i < B_KEYS.length;
                  const k = isRealCol ? B_KEYS[i] : null;
                  const display = isRealCol ? formatVal(k, totals?.[k]) : "—";
                  return (
                    <div
                      key={`b3-${isRealCol ? k : `ph-${i}`}`}
                      className={`flex items-center ${getAlignmentClasses(columnAlignments[k] || footerAlignment)} border-r border-gray-100 text-xs font-medium text-gray-700 h-full whitespace-nowrap tabular-nums ${footerClasses || 'bg-gradient-to-t from-gray-50 via-white to-gray-100'} ${b3Classes} relative z-50 ${i === EFFECTIVE_METRIC_COUNT - 1 ? b3Rounded : ''}`}
                      style={{ height: FOOTER_H }}
                      title={isRealCol ? display : ""}
                    >
                      {display}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
