// 📄 tableLayout.js — Reusable dynamic table layout utilities

// 🔧 Dynamically generate grid column count (e.g. "grid grid-cols-7")
export function generateGridClass(columnKeys) {
  return `grid grid-cols-${columnKeys.length}`;
}

// 🎨 Generate per-column style classes for table rows
export function generateColumnStyles(columnKeys) {
  return columnKeys.map((_, index) =>
    index === 0
      ? "px-4 py-2 text-xs border-r border-gray-200 bg-white sticky left-0 z-10" // Sticky product column
      : "px-4 py-2 text-center border-r border-gray-100" // Normal data column
  );
}