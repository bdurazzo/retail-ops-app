// Statistical mathematical operations
// Pure functions for statistical calculations

import { toNumber, divide, add } from './basic.js';

/**
 * Array statistical functions
 */
export const sum = (values) => values.reduce((acc, val) => acc + toNumber(val), 0);

export const mean = (values) => {
  if (!values || values.length === 0) return 0;
  return divide(sum(values), values.length);
};

export const median = (values) => {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].map(toNumber).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? mean([sorted[mid - 1], sorted[mid]])
    : sorted[mid];
};

export const mode = (values) => {
  if (!values || values.length === 0) return 0;
  const frequency = {};
  let maxFreq = 0;
  let mode = 0;
  
  values.forEach(val => {
    const num = toNumber(val);
    frequency[num] = (frequency[num] || 0) + 1;
    if (frequency[num] > maxFreq) {
      maxFreq = frequency[num];
      mode = num;
    }
  });
  
  return mode;
};

export const variance = (values) => {
  if (!values || values.length === 0) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map(val => Math.pow(toNumber(val) - avg, 2));
  return mean(squaredDiffs);
};

export const standardDeviation = (values) => Math.sqrt(variance(values));

/**
 * Range and distribution
 */
export const range = (values) => {
  if (!values || values.length === 0) return 0;
  const numbers = values.map(toNumber);
  return Math.max(...numbers) - Math.min(...numbers);
};

export const percentile = (values, p) => {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].map(toNumber).sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  
  if (Number.isInteger(index)) {
    return sorted[index];
  } else {
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
};

/**
 * Count-based statistics
 */
export const count = (values) => values ? values.length : 0;
export const countNonZero = (values) => values ? values.filter(val => toNumber(val) !== 0).length : 0;
export const countPositive = (values) => values ? values.filter(val => toNumber(val) > 0).length : 0;
export const countNegative = (values) => values ? values.filter(val => toNumber(val) < 0).length : 0;