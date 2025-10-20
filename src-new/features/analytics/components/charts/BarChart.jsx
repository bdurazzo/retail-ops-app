import React, { useRef, useEffect, useState } from 'react';

export default function BarChart({
  data = [],
  width = 400,
  height = 300,
  xKey = 'name',
  yKey = 'value',
  title = ''
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  // Handle responsive sizing
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

  // Use responsive dimensions if width/height are percentages
  const actualWidth = typeof width === 'string' && width.includes('%') ? dimensions.width : width;
  const actualHeight = typeof height === 'string' && height.includes('%') ? dimensions.height : height;
  if (!data.length) {
    return (
      <div
        ref={containerRef}
        className="h-full w-full border border-gray-200 bg-gradient-to-b from-gray-100 via-white to-gray-50 shadow-xl rounded-xl flex items-center justify-center"
      >
        <span className="text-sm text-gray-500">No data to display</span>
      </div>
    );
  }

  // Horizontal bar chart needs different padding (more space on left for labels)
  const padding = { top: 40, right: 60, bottom: 40, left: 200 };
  const chartWidth = actualWidth - padding.left - padding.right;
  const chartHeight = actualHeight - padding.top - padding.bottom;

  // Calculate scales
  const maxValue = Math.max(...data.map(d => d[yKey]));
  const minValue = Math.min(...data.map(d => d[yKey]), 0);
  const valueRange = maxValue - minValue || 1;

  // Horizontal bars - height instead of width
  const barHeight = chartHeight / data.length * 0.7;
  const barSpacing = chartHeight / data.length * 0.3;

  // Generate x-axis ticks (horizontal chart)
  const tickCount = 5;
  const xTicks = Array.from({ length: tickCount }, (_, i) => {
    const value = minValue + (valueRange / (tickCount - 1)) * i;
    return Math.round(value * 100) / 100;
  });

  return (
    <div
      ref={containerRef}
      className="h-full w-full border border-gray-200 bg-gradient-to-b from-gray-100 via-white to-gray-50 shadow-xl rounded-xl p-4"
    >
      {title && (
        <h3 className="text-sm font-medium text-gray-800 mb-2 text-center">{title}</h3>
      )}

      <svg
        width={actualWidth - 32}
        height={actualHeight - (title ? 56 : 32)}
        className="overflow-visible"
      >
        {/* Chart background */}
        <rect
          x={padding.left}
          y={padding.top}
          width={chartWidth}
          height={chartHeight}
          fill="rgba(249, 250, 251, 0.5)"
          stroke="#e5e7eb"
          strokeWidth={1}
          rx={4}
        />

        {/* Grid lines (vertical for horizontal chart) */}
        {xTicks.map((tick, i) => {
          const x = padding.left + ((tick - minValue) / valueRange) * chartWidth;
          return (
            <g key={i}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={padding.top + chartHeight}
                stroke="#e5e7eb"
                strokeWidth={1}
                strokeDasharray="2,2"
              />
              <text
                x={x}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Horizontal Bars */}
        {data.map((item, i) => {
          const y = padding.top + (i * chartHeight / data.length) + (barSpacing / 2);
          const barWidth = Math.abs(item[yKey] - minValue) / valueRange * chartWidth;
          const x = padding.left;

          return (
            <g key={i}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#barGradient)"
                stroke="#374151"
                strokeWidth={1}
                rx={2}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />

              {/* Value label at end of bar */}
              <text
                x={x + barWidth + 6}
                y={y + barHeight / 2 + 4}
                textAnchor="start"
                className="text-xs fill-gray-700 font-medium"
              >
                {item[yKey]}
              </text>

              {/* Y-axis label (product name) */}
              <text
                x={padding.left - 8}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                className="text-xs fill-gray-600"
              >
                {item[xKey].length > 25 ? item[xKey].substring(0, 25) + '...' : item[xKey]}
              </text>
            </g>
          );
        })}

        {/* Gradient definition (horizontal gradient) */}
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}