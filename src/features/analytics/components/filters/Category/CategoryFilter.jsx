import { filterTagRegistry } from "../filterTagRegistry";

// Logic-only: export tags and logic for category filter
export const filterKey = "category";
export const categoryTags = filterTagRegistry[filterKey];

// Pure toggle handler logic
export const handleClick = (val, onToggle, selected = []) => {
  if (selected.includes(val)) {
    onToggle(selected.filter((item) => item !== val));
  } else {
    onToggle([...selected, val]);
  }
};

// No visual rendering here
export default function CategoryFilter() {
  return null;
}