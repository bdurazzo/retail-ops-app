// src/features/analytics/components/filters/filterTagRegistry.js

const filterTagRegistry = {
  object: [ /* … */ ],
  vector: [ /* … */ ],
  time:   [ /* … */ ],
  context:[ /* … */ ],
};

// ✅ Keep default export (for files that do `import registry from ...`)
export default filterTagRegistry;

// ✅ Add named exports used by AssistantPanel.jsx
export const objectTags  = filterTagRegistry.object;
export const vectorTags  = filterTagRegistry.vector;
export const timeTags    = filterTagRegistry.time;
export const contextTags = filterTagRegistry.context;

// ✅ NEW: add a named export so `import { filterTagRegistry } ...` works too
export { filterTagRegistry };

/*
Explanation:
- `export default filterTagRegistry;` supports default-import style.
- `export { filterTagRegistry };` ALSO exposes a named export with the same object.
- This covers BOTH import styles used across your codebase.
*/