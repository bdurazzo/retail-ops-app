import React from 'react';
import ChartContainer from './core/ChartContainer.jsx';
import HorizontalBars from './core/HorizontalBars.jsx';

/**
 * Chart - Main chart component
 *
 * Receives same data flow as tables: table and rawData props from DataView
 */

export default function Chart({ table, rawData, height = "100%" }) {
  console.log('Chart render:', { table, rawDataLength: rawData?.length });

  // Use rawData if available, otherwise fall back to table rows
  const data = rawData || table?.rows || [];

  if (!data.length) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-b from-gray-100 via-white to-gray-50 border border-gray-200 rounded-xl">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data</h3>
          <p className="text-sm text-gray-500">Select products or adjust filters to see chart</p>
        </div>
      </div>
    );
  }

  // Group by product_name and sum quantities
  const productTotals = data.reduce((acc, row) => {
    const product = row.product_name || row.product_title || 'Unknown';
    const qty = parseFloat(row.quantity) || 0;
    acc[product] = (acc[product] || 0) + qty;
    return acc;
  }, {});

  // Convert to array format, take top 10
  const chartData = Object.entries(productTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  console.log('Chart data:', chartData);

  return (
    <ChartContainer>
      {(chartContext) => (
        <svg
          width={chartContext.width}
          height={chartContext.height}
          className="overflow-visible"
        >
          {/* Background */}
          <rect
            x={chartContext.padding.left}
            y={chartContext.padding.top}
            width={chartContext.chartWidth}
            height={chartContext.chartHeight}
            fill="rgba(249, 250, 251, 0.5)"
            stroke="#e5e7eb"
            strokeWidth={1}
            rx={4}
          />

          {/* Just the bars, nothing else */}
          <HorizontalBars
            data={chartData}
            chartContext={chartContext}
            xKey="name"
            yKey="value"
          />
        </svg>
      )}
    </ChartContainer>
  );
}
