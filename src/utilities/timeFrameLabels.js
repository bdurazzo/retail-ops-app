// src/utilities/timeFrameLabels.js
// Short, stable labels (intentionally no date ranges)

const LABELS = {
  today: "Today",
  today_last_week: "Today Last Week",
  today_last_month: "Today Last Month",
  today_last_year: "Today Last Year",
  this_week: "This Week",
  last_week: "Last Week",
  this_month: "This Month",
  last_month: "Last Month",
  this_quarter: "This Quarter",
  last_quarter: "Last Quarter",
  this_year: "This Year",
  last_year: "Last Year",
};

// Separate fns in case you ever diverge TF1/TF2 wording later
export function getTf1Label(id) {
  return LABELS[id] ?? id;
}

export function getTf2Label(id) {
  return LABELS[id] ?? id;
}