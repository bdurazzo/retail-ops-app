// src/utilities/timeFrames.js
// Date math for common “this/last” windows using date-fns

import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  parseISO,
  isValid,
} from "date-fns";

// Two lists so each selector has its own canonical options
export const TIMEFRAME1 = ["today", "this_week", "this_month", "this_quarter", "this_year"];
export const TIMEFRAME2 = [
  "last_week",
  "last_month",
  "last_quarter",
  "last_year",
  "today_last_week",
  "today_last_month",
  "today_last_year"
];

/**
 * Compute a concrete date range for a timeframe id.
 * @param {string} id - e.g., "this_week" | "last_month" etc.
 * @param {object} opts - { today?: Date|string, weekStartsOn?: 0|1 }
 *   weekStartsOn: 0 = Sunday (US default), 1 = Monday (EU style)
 * @returns {{start: Date, end: Date}}
 */
export function getTimeframeRange(id, opts = {}) {
  const { today = new Date(), weekStartsOn = 0 } = opts;
  const base = normalizeDate(today);

  switch (id) {
    case "today":
      return { start: base, end: base };
    case "today_last_week": {
      const d = subWeeks(base, 1);
      return { start: d, end: d };
    }
    case "today_last_month": {
      const d = subMonths(base, 1);
      return { start: d, end: d };
    }
    case "today_last_year": {
      const d = subYears(base, 1);
      return { start: d, end: d };
    }
    case "this_week":
      return {
        start: startOfWeek(base, { weekStartsOn }),
        end: endOfWeek(base, { weekStartsOn }),
      };
    case "last_week": {
      const d = subWeeks(base, 1);
      return {
        start: startOfWeek(d, { weekStartsOn }),
        end: endOfWeek(d, { weekStartsOn }),
      };
    }

    case "this_month":
      return { start: startOfMonth(base), end: endOfMonth(base) };
    case "last_month": {
      const d = subMonths(base, 1);
      return { start: startOfMonth(d), end: endOfMonth(d) };
    }

    case "this_quarter":
      return { start: startOfQuarter(base), end: endOfQuarter(base) };
    case "last_quarter": {
      const d = subQuarters(base, 1);
      return { start: startOfQuarter(d), end: endOfQuarter(d) };
    }

    case "this_year":
      return { start: startOfYear(base), end: endOfYear(base) };
    case "last_year": {
      const d = subYears(base, 1);
      return { start: startOfYear(d), end: endOfYear(d) };
    }

    default:
      // Fallback to a single-day range around "today"
      return { start: base, end: base };
  }
}

function normalizeDate(d) {
  if (d instanceof Date) return d;
  if (typeof d === "string") {
    const parsed = parseISO(d);
    if (isValid(parsed)) return parsed;
  }
  return new Date();
}