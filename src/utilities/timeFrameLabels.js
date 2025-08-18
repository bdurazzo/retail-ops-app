// src/utilities/timeFrameLabels.js
import { format, subDays, subWeeks, subYears } from "date-fns";
import { getTimeframeRange } from "@/timeFrames.js";

export function getTimeframeLabel(id, today = new Date()) {
  const { start, end } = getTimeframeRange(id, today);
  const fmt = (d, f = "MMM d") => format(d, f);

  switch (id) {
    case "today":                 return `Today (${format(today, "EEE, MMM d")})`;
    case "yesterday":             return `Yesterday (${format(subDays(today, 1), "EEE, MMM d")})`;
    case "same_weekday_last_week":return `Same Weekday Last Week (${format(subWeeks(today, 1), "EEE, MMM d")})`;
    case "same_day_last_year":    return `Same Date Last Year (${format(subYears(today, 1), "EEE, MMM d, yyyy")})`;

    case "rolling_7d":            return `Last 7 Days (${fmt(start)}–${fmt(end)})`;
    case "rolling_30d":           return `Last 30 Days (${fmt(start)}–${fmt(end)})`;

    case "this_week":             return `This Week (${fmt(start)}–${fmt(end)})`;
    case "last_week":             return `Last Week (${fmt(start)}–${fmt(end)})`;

    case "this_month":            return `This Month (${fmt(start)}–${fmt(end)})`;
    case "last_month":            return `Last Month (${fmt(start)}–${fmt(end)})`;

    case "this_quarter":          return `This Quarter (${fmt(start)}–${fmt(end)})`;
    case "last_quarter":          return `Last Quarter (${fmt(start)}–${fmt(end)})`;

    case "this_year":             return `This Year (${fmt(start, "MMM d, yyyy")}–${fmt(end, "MMM d, yyyy")})`;
    case "last_year":             return `Last Year (${fmt(start, "MMM d, yyyy")}–${fmt(end, "MMM d, yyyy")})`;

    default:                      return "Custom";
  }
}