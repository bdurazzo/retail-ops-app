// ---------------------------------------------
// TimePatternFilter.jsx
// Logic-only component for time-based tag filtering
// ---------------------------------------------

import { filterTagRegistry } from "../filterTagRegistry";

// ✅ Filter key and tag list
export const filterKey = "time";
export const timePatternTags = filterTagRegistry[filterKey];

// ✅ Standard toggle logic
export const handleClick = (val, onToggle, selected = []) => {
  if (selected.includes(val)) {
    onToggle(selected.filter((item) => item !== val));
  } else {
    onToggle([...selected, val]);
  }
};

// ✅ Logic-only file
export default function TimePatternFilter() {
  return null;
}