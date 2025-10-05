// Basic mathematical operations
// Pure functions with no business logic

/**
 * Basic arithmetic operations
 */
export const add = (a, b) => Number(a) + Number(b);
export const subtract = (a, b) => Number(a) - Number(b);
export const multiply = (a, b) => Number(a) * Number(b);
export const divide = (a, b) => Number(b) !== 0 ? Number(a) / Number(b) : 0;

/**
 * Percentage calculations
 */
export const percentage = (part, whole) => Number(whole) !== 0 ? (Number(part) / Number(whole)) * 100 : 0;
export const percentageChange = (oldValue, newValue) => Number(oldValue) !== 0 ? ((Number(newValue) - Number(oldValue)) / Number(oldValue)) * 100 : 0;
export const applyPercentage = (value, percent) => Number(value) * (Number(percent) / 100);

/**
 * Rounding and precision
 */
export const round = (value, decimals = 2) => Math.round(Number(value) * Math.pow(10, decimals)) / Math.pow(10, decimals);
export const floor = (value, decimals = 2) => Math.floor(Number(value) * Math.pow(10, decimals)) / Math.pow(10, decimals);
export const ceil = (value, decimals = 2) => Math.ceil(Number(value) * Math.pow(10, decimals)) / Math.pow(10, decimals);

/**
 * Min/Max operations
 */
export const min = (...values) => Math.min(...values.map(Number));
export const max = (...values) => Math.max(...values.map(Number));
export const clamp = (value, minimum, maximum) => Math.min(Math.max(Number(value), Number(minimum)), Number(maximum));

/**
 * Safe numeric conversion
 */
export const toNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Zero/null handling
 */
export const isZero = (value) => Number(value) === 0;
export const isPositive = (value) => Number(value) > 0;
export const isNegative = (value) => Number(value) < 0;