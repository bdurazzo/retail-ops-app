import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export function StoreDashboard() {
  const [selectedXAxis, setSelectedXAxis] = useState('x-axis');
  const [selectedYAxis, setSelectedYAxis] = useState('y-axis');
  const [selectedLegendIndex, setSelectedLegendIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const kpis = [
    { title: 'Total Sales', value: '$21.5K', change: '7.2%' },
    { title: 'UPT', value: '2.4', change: '0.4%' },
    { title: 'AOV', value: '$214', change: '3.0%' },
    { title: 'Orders', value: '294', change: '2.8%' },
    { title: 'Conv. Rate', value: '15.8%', change: '1.1%' },
    { title: 'Traffic', value: '1830', change: '6.3%' },
  ];

  const hourlySales = [
    { hour: '10am', sales: 380 },
    { hour: '11am', sales: 420 },
    { hour: '12pm', sales: 640 },
    { hour: '1pm', sales: 580 },
    { hour: '2pm', sales: 500 },
    { hour: '3pm', sales: 610 },
    { hour: '4pm', sales: 720 },
    { hour: '5pm', sales: 880 },
  ];

  const allProducts = [
    'Short Lined Cruiser',
    'Field Flannel Shirt',
    'Pioneer Tee',
    'Tin Cloth Pants',
    'Mackinaw Coat',
    'Alaskan Guide Shirt',
    'Denim Cruiser',
    'Logger Mesh Cap',
    'Ballard Watch Cap',
    'S/S Frontier Pocket Tee',
  ];

  const xOptions = ['Day', 'Week', 'Month', 'Quarter', 'Year'];
  const yOptions = ['Unit Volume', 'Revenue', 'Orders', 'AOV'];

  const filteredProducts = allProducts.filter(p =>
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 overflow-y-auto px-4 pt-6 pb-4">
        {/* Top Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Store Dashboard</h1>
          <div className="flex gap-2">
            <button className="text-sm text-gray-600 bg-white border px-3 py-1 rounded-md">2025 Q2</button>
            <button className="text-sm text-gray-600 bg-white border px-3 py-1 rounded-md">In-Store</button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm p-2 border border-gray-200">
              <div className="flex flex-col items-center">
                <div className="text-xs text-gray-500">{kpi.title}</div>
                <div className="text-lg font-bold text-gray-900">{kpi.value}</div>
                <div className="text-xs text-green-600">▲{kpi.change}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="relative bg-white border rounded-xl mb-4" style={{ height: '280px' }}>
          {/* Y Axis Button */}
          <button
            className="absolute top-1/2 left-0 transform -translate-y-1/2 -rotate-90 text-[10px] px-2 py-1 bg-white border rounded z-10"
            onClick={() => {
              const choice = prompt('Select Y-Axis Variable:\n' + yOptions.join('\n'));
              if (choice && yOptions.includes(choice)) setSelectedYAxis(choice);
            }}
          >
            {selectedYAxis}
          </button>

          {/* X Axis Button */}
          <button
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[10px] px-2 py-1 bg-white border rounded z-10"
            onClick={() => {
              const choice = prompt('Select X-Axis Variable:\n' + xOptions.join('\n'));
              if (choice && xOptions.includes(choice)) setSelectedXAxis(choice);
            }}
          >
            {selectedXAxis}
          </button>

          {/* Chart Content */}
          <div className="absolute inset-0 pl-4 pr-4 pt-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend Row */}
        <div className="flex justify-between gap-1 mb-3">
          {[...Array(6)].map((_, i) => (
            <button
              key={i}
              onClick={() => setSelectedLegendIndex(i)}
              className={`w-8 h-8 rounded border ${
                selectedLegendIndex === i ? 'bg-blue-500' : 'bg-white'
              }`}
            />
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-2">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="space-y-2">
          {filteredProducts.map((p, i) => (
            <div key={i} className="bg-white rounded border px-3 py-2 text-sm text-gray-800">
              {p}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
