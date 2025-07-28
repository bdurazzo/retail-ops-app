import React, { useState } from "react";

export default function GeneratedTable({ data }) {
  const [sortStack, setSortStack] = useState([]);
  const [sortDirections, setSortDirections] = useState({});

  if (!data || data.length === 0) return <div className="text-gray-500">No data available.</div>;

  const headers = Object.keys(data[0]);

  // Normalize numeric values for composite sort
  const getNormalizedValues = (rows, col) => {
    const nums = rows.map(row => parseFloat(row[col]) || 0);
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    return nums.map(v => max !== min ? (v - min) / (max - min) : 0.5);
  };

  const getSortedData = () => {
    if (sortStack.length === 0) return data;

    const normalized = {};
    sortStack.forEach(col => {
      normalized[col] = getNormalizedValues(data, col);
    });

    return [...data].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      sortStack.forEach(col => {
        const idx = data.indexOf(a);
        const idy = data.indexOf(b);
        const direction = sortDirections[col] === "asc" ? 1 : -1;
        scoreA += (normalized[col][idx] || 0) * direction;
        scoreB += (normalized[col][idy] || 0) * direction;
      });
      return scoreB - scoreA;
    });
  };

  const handleClick = (col) => {
    if (sortStack.length === 1 && sortStack[0] === col) {
      setSortDirections(prev => ({
        ...prev,
        [col]: prev[col] === "desc" ? "asc" : "desc"
      }));
    } else {
      setSortStack([col]);
      setSortDirections({ [col]: "desc" });
    }
  };

  const handleLongPress = (col) => {
    if (!sortStack.includes(col)) {
      setSortStack(prev => [...prev, col]);
      setSortDirections(prev => ({ ...prev, [col]: "desc" }));
    }
  };

  let pressTimer = null;
  const startPress = (col) => {
    pressTimer = setTimeout(() => handleLongPress(col), 500);
  };
  const cancelPress = () => clearTimeout(pressTimer);

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full table-auto text-sm">
        <thead className="bg-gray-100 text-left text-gray-700">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-3 py-2 font-semibold cursor-pointer select-none"
                onClick={() => handleClick(header)}
                onTouchStart={() => startPress(header)}
                onTouchEnd={cancelPress}
                onMouseDown={() => startPress(header)}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
              >
                {header.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                {sortStack.includes(header) && (
                  <span className="ml-1 text-xs text-blue-500">
                    {sortDirections[header] === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {getSortedData().map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {headers.map((col) => (
                <td key={col} className="px-3 py-2 whitespace-nowrap text-gray-800">
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
