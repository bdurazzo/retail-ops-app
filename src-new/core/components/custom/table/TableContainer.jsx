import React, { useRef, useEffect, useMemo } from 'react';

/**
 * TableContainer - The orchestrator component for A/B split table architecture
 * 
 * Manages:
 * - Scroll synchronization between A and B sections
 * - Layout calculations (widths, grid templates)
 * - Refs coordination between all sections
 * - Container styling and structure
 * 
 * This is the foundation that makes the sophisticated Table.jsx UX work.
 */
export default function TableContainer({
  // Data (from tableConfig)
  rows = [],
  totals = {},
  columnKeys = [],
  columnLabels = {},

  // Layout (from tableConfig or template)
  layout = {},

  // Styles (from template)
  styles = {},

  // Visibility controls
  showHeader = true,
  showBody = true,
  showFooter = true,

  // Container styling
  containerClasses = "w-full h-full border-t border-gray-200 drop-shadow-xl shadow-gray-900 rounded-b-xl flex flex-col overflow-hidden",

  // Child components
  children,

  // Advanced options
  maxBodyHeight = null,
  columnWidths = {},

  // Sorting
  sortKey = null,
  sortDirection = null,
  onSort = () => {},

  // Column swapping
  onColumnSwap = () => {},

  ...props
}) {
  // Extract layout values with defaults
  const {
    firstColWidth = 120,
    metricColWidth = 80,
    headerHeight = 35,
    rowHeight = 50,
    footerHeight = 35,
    placeholderCols = 4
  } = layout;
  // Refs for scroll synchronization (critical for UX)
  const containerRef = useRef(null);    // Main container for width calculation
  const vScrollRef = useRef(null);      // unified vertical scroller (A2 + B2)
  const hTopRef = useRef(null);         // B1 horizontal container (overflow hidden)
  const hBottomRef = useRef(null);      // B3 horizontal container (owns scrollbar)
  const b1TrackRef = useRef(null);      // B1 inner track (gets transformed)
  const b2TrackRef = useRef(null);      // B2 inner track (gets transformed)

  // Track container width
  const [containerWidth, setContainerWidth] = React.useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      setContainerWidth(containerRef.current?.offsetWidth || 0);
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Scroll synchronization effect - the heart of Table.jsx's UX
  useEffect(() => {
    const top = hTopRef.current;        // B1 container
    const bottom = hBottomRef.current;  // B3 container (scroll owner)
    const b1Track = b1TrackRef.current; // B1 inner track
    const b2Track = b2TrackRef.current; // B2 inner track

    if (!top || !bottom || !b1Track || !b2Track) return;

    // Sync B1 and B2 transforms to mirror B3's scrollLeft
    const syncTracks = () => {
      const x = Math.round(bottom.scrollLeft);
      const tx = `translate3d(${-x}px,0,0)`;
      if (b1Track.style.transform !== tx) b1Track.style.transform = tx;
      if (b2Track.style.transform !== tx) b2Track.style.transform = tx;
    };

    // When B3 scrolls, mirror in B1 and B2
    const onBottomScroll = () => syncTracks();

    // Allow horizontal wheel/trackpad gestures on header and body to drive B3
    const onHorizontalWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        bottom.scrollLeft += e.deltaX;
        syncTracks();
      }
    };

    // Event listeners
    bottom.addEventListener("scroll", onBottomScroll, { passive: true });
    top.addEventListener("wheel", onHorizontalWheel, { passive: false });
    
    // Also listen on vertical scroller so body can drive horizontal
    const v = vScrollRef.current;
    if (v) v.addEventListener("wheel", onHorizontalWheel, { passive: false });

    // Initial sync
    syncTracks();

    return () => {
      bottom.removeEventListener("scroll", onBottomScroll);
      top.removeEventListener("wheel", onHorizontalWheel);
      if (v) v.removeEventListener("wheel", onHorizontalWheel);
    };
  }, []);


  // Context object for child components
  const tableContext = {
    // Refs
    vScrollRef,
    hTopRef,
    hBottomRef,
    b1TrackRef,
    b2TrackRef,

    // Layout calculations
    layout,

    // Dimensions
    firstColWidth,
    headerHeight,
    rowHeight,
    footerHeight,
    containerWidth,

    // Data (from template)
    rows,
    totals,
    columnKeys,
    columnLabels,

    // Styles (from template)
    styles,

    // Visibility
    showHeader,
    showBody,
    showFooter,

    // Body height handling
    maxBodyHeight,

    // Sorting
    sortKey,
    sortDirection,
    onSort,

    // Column swapping
    onColumnSwap
  };

  return (
    <div ref={containerRef} className={containerClasses}>
      {/* Render children with context */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { tableContext, ...child.props });
        }
        return child;
      })}
    </div>
  );
}

/**
 * Convenience components for cleaner JSX
 */
export function TableToolbar({ children, tableContext, toolbarClasses = "flex-none", ...props }) {
  return (
    <div className={toolbarClasses}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { tableContext, ...child.props });
        }
        return child;
      })}
    </div>
  );
}

export function TableHeader({ children, tableContext, headerClasses = "flex-none bg-gradient-to-b from-gray-50 via-gray-50 to-gray-100", ...props }) {
  if (!tableContext?.showHeader) return null;
  
  return (
    <div className={headerClasses}>
      <div className="flex">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { tableContext, ...child.props });
          }
          return child;
        })}
      </div>
    </div>
  );
}

export function TableBody({ children, tableContext, ...props }) {
  if (!tableContext?.showBody) return null;

  const { maxBodyHeight, rowHeight, containerWidth } = tableContext;

  return (
    <div
      className={maxBodyHeight ? "flex-none" : "flex-1 min-h-0"}
      style={{
        height: maxBodyHeight ? `${maxBodyHeight}px` : 'auto',
        overflow: 'visible'
      }}
    >
      <div
        className="flex w-full h-full min-h-0 overflow-y-scroll overflow-x-hidden"
        ref={tableContext.vScrollRef}
        style={{ scrollbarGutter: 'stable both-edges' }}
      >
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              tableContext,
              tableContainerWidth: containerWidth,
              ...child.props
            });
          }
          return child;
        })}
      </div>
    </div>
  );
}

export function TableFooter({ children, tableContext, footerClasses = "flex-none bg-gray-50", ...props }) {
  if (!tableContext?.showFooter) return null;
  
  return (
    <div className={footerClasses}>
      <div className="flex">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { tableContext, ...child.props });
          }
          return child;
        })}
      </div>
    </div>
  );
}