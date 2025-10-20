import React from 'react';

/**
 * HorizontalBars - Pure data visualization component
 *
 * Just renders bars, nothing else. No axes, no labels, no grid.
 * Takes normalized data and chart dimensions.
 */

export default function HorizontalBars({
  data = [],
  chartContext,
  xKey = 'name',
  yKey = 'value'
}) {
  const { padding, chartWidth, chartHeight } = chartContext;

  if (!data.length) return null;

  // Calculate scale
  const maxValue = Math.max(...data.map(d => d[yKey]));
  const minValue = Math.min(...data.map(d => d[yKey]), 0);
  const valueRange = maxValue - minValue || 1;

  // Bar dimensions
  const barHeight = chartHeight / data.length * 0.7;
  const barSpacing = chartHeight / data.length * 0.3;

  return (
    <g className="bars">
      {data.map((item, i) => {
        const y = padding.top + (i * chartHeight / data.length) + (barSpacing / 2);
        const barWidth = Math.abs(item[yKey] - minValue) / valueRange * chartWidth;
        const x = padding.left;

        return (
          <rect
            key={i}
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
        );
      })}

      {/* Gradient definition */}
      <defs>
        <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>
      </defs>
    </g>
  );
}
