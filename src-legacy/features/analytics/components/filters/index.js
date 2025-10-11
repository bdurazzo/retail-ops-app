// src/features/analytics/components/filters/index.js

// Import filter wrappers (renamed from panels/tabs/*)
import ProductFilter from "./product/ProductFilter.jsx";
import MetricFilter from "./metric/MetricFilter.jsx";
import TimeFilter from "./time/TimeFilter.jsx";
import ElementFilter from "./element/ElementFilter.jsx";
import TrendFilter from "./trend/TrendFilter.jsx";

// Named exports (optional, handy for direct imports)
export {
  ProductFilter,
  MetricFilter,
  TimeFilter,
  ElementFilter,
  TrendFilter,
};

// Lookup used by FilterPanel to render the active panel by tab id
export const PANEL_BY_TAB = {
  "TAB 1": ProductFilter,
  "TAB 2": MetricFilter,
  "TAB 3": TimeFilter,
  "TAB 4": ElementFilter,
  "TAB 5": TrendFilter,
};
