// ------------------------------------------------------------------------
// filterLogicRegistry.js – Central toggle logic handlers for each filter
// ------------------------------------------------------------------------

import { handleClick as handleCategoryClick } from "./Category/CategoryFilter";
import { handleClick as handleSalesClick } from "./SalesPerformance/SalesPerformanceFilter";
import { handleClick as handleBehaviorClick } from "./CustomerBehavior/CustomerBehaviorFilter";
import { handleClick as handleTimeClick } from "./TimePatterns/TimePatternFilter";

// 🧠 Export a single registry object mapping keys to toggle handlers
export const filterLogicRegistry = {
  category: handleCategoryClick,
  salesPerformance: handleSalesClick,
  customerBehavior: handleBehaviorClick,
  timePattern: handleTimeClick,
};