// Barrel for all KPI families under registry/kpis/
// Right now we only have the Top Performers family.

import topPerformers, {
  topPerformerProgramList,
} from "./top_performers/index.js";

// 1) Map of all programs by id (family → flattened)
export const kpiFamilies = {
  ...topPerformers,
};

// 2) Optional: ordered lists per family (handy for menus/debug)
export const kpiFamilyProgramLists = {
  top_performers: topPerformerProgramList,
};

// Default export = the flattened map
export default kpiFamilies;