// ----------------------------------------------
// CustomerBehaviorFilter.jsx – Logic-only filter
// ----------------------------------------------

import { filterTagRegistry } from "../filterTagRegistry";

export const filterKey = "behavior";
export const behaviorTags = filterTagRegistry[filterKey];

// ✅ Shared toggle logic
export const handleClick = (val, onToggle, selected = []) => {
  if (selected.includes(val)) {
    onToggle(selected.filter((item) => item !== val));
  } else {
    onToggle([...selected, val]);
  }
};

export default function CustomerBehaviorFilter() {
  return null;
}