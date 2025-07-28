import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export function ProductDetail({ productId, onBack }) {
  const products = [
    {
      id: 1,
      name: 'Short Lined Cruiser – Military Green',
      netSales: 4310,
      units: 98,
      attachRate: '38%',
      stock: 12,
      location: 'Rack A1',
      salesTrend: [
        { week: 'Week 1', units: 22 },
        { week: 'Week 2', units: 18 },
        { week: 'Week 3', units: 28 },
        { week: 'Week 4', units: 30 },
      ],
      topAttached: [
        { name: 'Frontier Pocket Tee – Black', count: 32 },
        { name: 'Chambray Work Shirt – Indigo', count: 21 },
      ],
    },
  ];

  const product = products.find(p => p.id === productId);
  if (!product) {
    return (
      <div className="p-4">
        <button onClick={onBack} className="text-blue-600 text-sm mb-2">← Back</button>
        <p className="text-gray-600 text-sm">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 pb-24">
      <div className="pt-6 pb-2 flex justify-between items-center">
        <h1 className="text-lg font-bold">{product.name}</h1>
        <button onClick={onBack} className="text-sm text-blue-600">← Back</button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
        <div>Net Sales: <span className="font-semibold">${product.netSales.toLocaleString()}</span></div>
        <div>Units: <span className="font-semibold">{product.units}</span></div>
        <div>Attach Rate: <span className="font-semibold">{product.attachRate}</span></div>
        <div>Stock: <span className="font-semibold">{product.stock}</span></div>
      </div>

      {/* Chart */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-2">Sales Trend</h2>
        <div className="bg-white h-40 rounded-xl border p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={product.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="units" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attach List */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-2">Top Attach Items</h2>
        <ul className="bg-white rounded-xl border p-4 space-y-2 text-sm">
          {product.topAttached.map((item, i) => (
            <li key={i} className="flex justify-between text-gray-700">
              <span>{item.name}</span>
              <span className="text-xs text-gray-500">{item.count} orders</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
