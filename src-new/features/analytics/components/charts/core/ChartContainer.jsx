import React, { useRef, useEffect, useState } from 'react';

/**
 * ChartContainer - Base container for all charts
 *
 * Handles:
 * - Responsive sizing
 * - Layout structure (slots for plot, axes, labels, legend)
 * - Passes dimensions to children via context
 */

export default function ChartContainer({
  padding = { top: 40, right: 60, bottom: 40, left: 200 },
  className = "h-full w-full border border-gray-200 bg-gradient-to-b from-gray-100 via-white to-gray-50 shadow-xl rounded-xl",
  children
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  // Measure container size
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({
        width: rect.width || 400,
        height: rect.height || 300
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;

  // Context to pass to children
  const chartContext = {
    width: dimensions.width,
    height: dimensions.height,
    padding,
    chartWidth,
    chartHeight
  };

  return (
    <div ref={containerRef} className={className}>
      {typeof children === 'function' ? children(chartContext) : children}
    </div>
  );
}
