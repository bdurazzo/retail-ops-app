// ----------------------------------------------
// SalesPerformanceFilter.jsx – Logic-only filter
// ----------------------------------------------

import { filterTagRegistry } from "../filterTagRegistry";

// ✅ Required key for referencing
export const filterKey = "sales";
export const salesPerformanceTags = filterTagRegistry[filterKey];

// ✅ Shared toggle logic
export const handleClick = (val, onToggle, selected = []) => {
  if (selected.includes(val)) {
    onToggle(selected.filter((item) => item !== val));
  } else {
    onToggle([...selected, val]);
  }
};

// ✅ No visual rendering
export default function SalesPerformanceFilter() {
  return null;
}