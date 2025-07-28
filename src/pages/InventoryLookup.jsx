import React, { useState } from 'react';

export function InventoryLookup({ onSelectProduct }) {
  const [query, setQuery] = useState('');

  const products = [
    { id: 1, name: 'Short Lined Cruiser – Military Green', stock: 12, location: 'Rack A1' },
    { id: 2, name: 'Frontier Pocket Tee – Black', stock: 28, location: 'Rack A2' },
    { id: 3, name: 'Chambray Work Shirt – Indigo', stock: 8, location: 'Stockroom' },
    { id: 4, name: 'Wool Jac Shirt – Charcoal', stock: 3, location: 'Rack B1' },
  ];

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="w-full px-4 pb-24">
      <h1 className="pt-6 pb-2 text-xl font-bold">Inventory Lookup</h1>

      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search SKU or name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow px-3 py-2 rounded-md border border-gray-300 text-sm"
        />
        <button className="text-sm px-3 py-2 border rounded-md text-gray-600">Filter</button>
      </div>

      {/* Product List */}
      <div className="mt-4 space-y-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectProduct(item.id)}
            className="bg-white p-4 rounded-xl shadow-sm border text-sm cursor-pointer hover:bg-gray-50 transition"
          >
            <div className="font-semibold text-gray-800">{item.name}</div>
            <div className="text-xs text-gray-500">On-hand: {item.stock}</div>
            <div className="text-xs text-gray-400">Location: {item.location}</div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-sm text-gray-500 pt-4">No results found.</div>
        )}
      </div>
    </div>
  );
}
