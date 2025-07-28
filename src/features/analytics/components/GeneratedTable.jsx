import React, { useState, useEffect, useRef } from "react";
import SortContextMenu from "./SortContextMenu";

export default function GeneratedTable({ data }) {
  const [sortStack, setSortStack] = useState([]);
  const [sortedData, setSortedData] = useState(data);
  const [contextMenu, setContextMenu] = useState(null);
  const containerRef = useRef();

  useEffect(() => {
    let result = [...data];
    for (let { key, direction } of [...sortStack].reverse()) {
      result.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        if (typeof valA === "number" && typeof valB === "number") {
          return direction === "asc" ? valA - valB : valB - valA;
        }
        const aStr = String(valA || "").toLowerCase();
        const bStr = String(valB || "").toLowerCase();
        return direction === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }
    setSortedData(result);
  }, [data, sortStack]);

  const toggleSort = (key) => {
    setSortStack(prev => {
      const index = prev.findIndex(s => s.key === key);
      if (index === -1) return [{ key, direction: "desc" }];
      const newDir = prev[index].direction === "asc" ? "desc" : "asc";
      const updated = [...prev];
      updated[index] = { ...updated[index], direction: newDir };
      return updated;
    });
  };

  const handleContextMenu = (e, key) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    setContextMenu({
      key,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const clearContextMenu = () => setContextMenu(null);

  const addOrRemoveFromStack = (key) => {
    setSortStack(prev => {
      const index = prev.findIndex(s => s.key === key);
      if (index === -1) return [...prev, { key, direction: "desc" }];
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const toggleStackDirection = (key) => {
    setSortStack(prev =>
      prev.map(s =>
        s.key === key
          ? { ...s, direction: s.direction === "asc" ? "desc" : "asc" }
          : s
      )
    );
  };

  const clearStack = () => setSortStack([]);

  if (!data || data.length === 0) return <div>No data</div>;

  const headers = Object.keys(data[0]);

  return (
    <div ref={containerRef} className="relative">
      <table className="min-w-full text-xs text-left border">
        <thead>
          <tr>
            {headers.map((key) => {
              const sortInfo = sortStack.find(s => s.key === key);
              const index = sortStack.findIndex(s => s.key === key);
              const dirSymbol = sortInfo
                ? sortInfo.direction === "asc" ? "▲" : "▼"
                : "";
              const stackLabel = index >= 0 ? ` (${index + 1})` : "";

              return (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  onContextMenu={(e) => handleContextMenu(e, key)}
                  className={`px-3 py-2 border-b border-r bg-gray-100 cursor-pointer select-none text-gray-700 ${
                    index >= 0 ? "bg-blue-100 font-semibold border-blue-400" : ""
                  }`}
                  title="Click to sort. Right click or long press for more."
                >
                  {key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                  <span className="text-gray-500">{dirSymbol}{stackLabel}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              {headers.map((key) => (
                <td key={key} className="px-3 py-1 border-r whitespace-nowrap text-[11px] text-gray-800">
                  {String(row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {contextMenu && (
        <SortContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          columnKey={contextMenu.key}
          isInStack={sortStack.some(s => s.key === contextMenu.key)}
          currentDirection={
            sortStack.find(s => s.key === contextMenu.key)?.direction || "desc"
          }
          onAddRemove={() => addOrRemoveFromStack(contextMenu.key)}
          onToggleDirection={() => toggleStackDirection(contextMenu.key)}
          onClearStack={clearStack}
          onClose={clearContextMenu}
        />
      )}
    </div>
  );
}
