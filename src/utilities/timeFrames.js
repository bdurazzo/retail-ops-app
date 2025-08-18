// src/utilities/timeFrames.js
import {
  addDays, subDays, subWeeks, subMonths, subQuarters, subYears,
  startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear,
  endOfWeek, endOfMonth, endOfQuarter, endOfYear
} from "date-fns";

// Week starts on Sunday (0). Change to 1 for Monday if you prefer.
const WEEK_OPTS = { weekStartsOn: 0 };

export const TIMEFRAMES = [
  { id: "today",                label: "Today" },
  { id: "yesterday",            label: "Yesterday" },
  { id: "same_weekday_last_week", label: "Same Weekday Last Week" },
  { id: "same_day_last_year",   label: "Same Date Last Year" },

  { id: "rolling_7d",           label: "Last 7 Days (rolling)" },
  { id: "rolling_30d",          label: "Last 30 Days (rolling)" },

  { id: "this_week",            label: "This Week" },
  { id: "last_week",            label: "Last Week" },

  { id: "this_month",           label: "This Month" },
  { id: "last_month",           label: "Last Month" },

  { id: "this_quarter",         label: "This Quarter" },
  { id: "last_quarter",         label: "Last Quarter" },

  { id: "this_year",            label: "This Year" },
  { id: "last_year",            label: "Last Year" },

  { id: "custom",               label: "Custom…" },
];

export function getTimeframeRange(id, today = new Date()) {
  const T0 = startOfDay(today);
  switch (id) {
    case "today":                return { start: T0, end: endOfDaySafe(T0) };
    case "yesterday": { const d = subDays(T0, 1); return { start: d, end: endOfDaySafe(d) }; }
    case "same_weekday_last_week": { const d = subWeeks(T0, 1); return { start: d, end: endOfDaySafe(d) }; }
    case "same_day_last_year":  { const d = subYears(T0, 1);  return { start: d, end: endOfDaySafe(d) }; }

    case "rolling_7d":           return { start: subDays(T0, 6),  end: endOfDaySafe(T0) };
    case "rolling_30d":          return { start: subDays(T0, 29), end: endOfDaySafe(T0) };

    case "this_week":            return { start: startOfWeek(T0, WEEK_OPTS), end: endOfWeek(T0, WEEK_OPTS) };
    case "last_week": { const d = subWeeks(T0, 1); return { start: startOfWeek(d, WEEK_OPTS), end: endOfWeek(d, WEEK_OPTS) }; }

    case "this_month":           return { start: startOfMonth(T0),   end: endOfMonth(T0) };
    case "last_month": { const d = subMonths(T0, 1); return { start: startOfMonth(d), end: endOfMonth(d) }; }

    case "this_quarter":         return { start: startOfQuarter(T0), end: endOfQuarter(T0) };
    case "last_quarter": { const d = subQuarters(T0, 1); return { start: startOfQuarter(d), end: endOfQuarter(d) }; }

    case "this_year":            return { start: startOfYear(T0),    end: endOfYear(T0) };
    case "last_year": { const d = subYears(T0, 1); return { start: startOfYear(d), end: endOfYear(d) }; }

    default:                     return { start: T0, end: endOfDaySafe(T0) }; // or throw if you want strictness
  }
}

function endOfDaySafe(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}