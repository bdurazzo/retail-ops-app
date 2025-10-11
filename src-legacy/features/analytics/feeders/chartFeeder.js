// src/features/analytics/feeders/chartFeeder.js
import { makeEmptyChart } from "../dtos/ChartDTO.js";

export function toChart(rows, { xKey = "__mm", yKey = "Product Net" } = {}) {
  if (!rows?.length) return makeEmptyChart();

  const byMonth = new Map();
  for (const r of rows) {
    const k = `${r.__yyyy}-${r.__mm}`;
    byMonth.set(k, (byMonth.get(k) ?? 0) + (Number(r[yKey]) || 0));
  }

  const categories = Array.from(byMonth.keys()).sort();
  const series = [{ name: yKey, data: categories.map(c => byMonth.get(c)) }];

  return { categories, series, meta: { xKey, yKey } };
}