import React from 'react';

export default function BarChart({ 
  data = [], 
  width = 400, 
  height = 300,
  xKey = 'name',
  yKey = 'value',
  title = ''
}) {
  if (!data.length) {
    return (
      <div 
        className="border border-gray-200 bg-gradient-to-b from-gray-100 via-white to-gray-50 shadow-xl rounded-xl flex items-center justify-center"
        style={{ width, height }}
      >
        <span className="text-sm text-gray-500">No data to display</span>
      </div>
    );
  }

  const padding = { top: 40, right: 30, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const maxValue = Math.max(...data.map(d => d[yKey]));
  const minValue = Math.min(...data.map(d => d[yKey]), 0);
  const valueRange = maxValue - minValue || 1;

  const barWidth = chartWidth / data.length * 0.8;
  const barSpacing = chartWidth / data.length * 0.2;

  // Generate y-axis ticks
  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, i) => {
    const value = minValue + (valueRange / (tickCount - 1)) * i;
    return Math.round(value * 100) / 100;
  });

  return (
    <div 
      className="border border-gray-200 bg-gradient-to-b from-gray-100 via-white to-gray-50 shadow-xl rounded-xl p-4"
      style={{ width, height }}
    >
      {title && (
        <h3 className="text-sm font-medium text-gray-800 mb-2 text-center">{title}</h3>
      )}
      
      <svg 
        width={width - 32} 
        height={height - (title ? 56 : 32)}
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

        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const y = padding.top + chartHeight - ((tick - minValue) / valueRange) * chartHeight;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
                strokeDasharray="2,2"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-600"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, i) => {
          const x = padding.left + (i * chartWidth / data.length) + (barSpacing / 2);
          const barHeight = Math.abs(item[yKey] - minValue) / valueRange * chartHeight;
          const y = padding.top + chartHeight - barHeight;

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
              
              {/* Value label on bar */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="text-xs fill-gray-700 font-medium"
              >
                {item[yKey]}
              </text>

              {/* X-axis label */}
              <text
                x={x + barWidth / 2}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {item[xKey]}
              </text>
            </g>
          );
        })}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}