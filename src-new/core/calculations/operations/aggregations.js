// Data aggregation operations
// Builds on math functions to aggregate arrays of data

import { sum, mean, count, countNonZero } from '../math/statistical.js';
import { toNumber, round } from '../math/basic.js';

/**
 * Field extraction utilities
 */
export const extractField = (rows, fieldName) => {
  if (!Array.isArray(rows)) return [];
  return rows.map(row => row?.[fieldName]).filter(val => val !== null && val !== undefined);
};

export const extractNumericField = (rows, fieldName, defaultValue = 0) => {
  return extractField(rows, fieldName).map(val => toNumber(val, defaultValue));
};

/**
 * Basic aggregations
 */
export const sumField = (rows, fieldName) => {
  return sum(extractNumericField(rows, fieldName));
};

export const averageField = (rows, fieldName) => {
  return mean(extractNumericField(rows, fieldName));
};

export const countField = (rows, fieldName) => {
  return count(extractField(rows, fieldName));
};

export const countNonZeroField = (rows, fieldName) => {
  return countNonZero(extractNumericField(rows, fieldName));
};

/**
 * Group by operations
 */
export const groupBy = (rows, keyField) => {
  if (!Array.isArray(rows)) return new Map();
  
  const groups = new Map();
  
  rows.forEach(row => {
    const key = row?.[keyField];
    if (key === null || key === undefined) return;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(row);
  });
  
  return groups;
};

export const groupByMultiple = (rows, keyFields) => {
  if (!Array.isArray(rows) || !Array.isArray(keyFields)) return new Map();
  
  const groups = new Map();
  
  rows.forEach(row => {
    const compositeKey = keyFields.map(field => row?.[field]).join('|');
    
    if (!groups.has(compositeKey)) {
      groups.set(compositeKey, []);
    }
    groups.get(compositeKey).push(row);
  });
  
  return groups;
};

/**
 * Aggregate grouped data
 */
export const aggregateGroups = (groupedData, aggregations) => {
  const results = [];
  
  groupedData.forEach((rows, key) => {
    const result = { groupKey: key };
    
    Object.entries(aggregations).forEach(([outputField, config]) => {
      const { field, operation } = config;
      
      switch (operation) {
        case 'sum':
          result[outputField] = sumField(rows, field);
          break;
        case 'average':
          result[outputField] = round(averageField(rows, field), 2);
          break;
        case 'count':
          result[outputField] = countField(rows, field);
          break;
        case 'countNonZero':
          result[outputField] = countNonZeroField(rows, field);
          break;
        default:
          result[outputField] = 0;
      }
    });
    
    results.push(result);
  });
  
  return results;
};

/**
 * Quick aggregation helpers
 */
export const sumByGroup = (rows, groupField, sumField) => {
  const groups = groupBy(rows, groupField);
  const results = [];
  
  groups.forEach((groupRows, key) => {
    results.push({
      [groupField]: key,
      [sumField]: sumField(groupRows, sumField),
      count: groupRows.length
    });
  });
  
  return results;
};

export const averageByGroup = (rows, groupField, avgField) => {
  const groups = groupBy(rows, groupField);
  const results = [];
  
  groups.forEach((groupRows, key) => {
    results.push({
      [groupField]: key,
      [avgField]: round(averageField(groupRows, avgField), 2),
      count: groupRows.length
    });
  });
  
  return results;
};

/**
 * Filter operations
 */
export const filterByValue = (rows, field, value) => {
  if (!Array.isArray(rows)) return [];
  return rows.filter(row => row?.[field] === value);
};

export const filterByRange = (rows, field, min, max) => {
  if (!Array.isArray(rows)) return [];
  return rows.filter(row => {
    const val = toNumber(row?.[field]);
    return val >= toNumber(min) && val <= toNumber(max);
  });
};

export const filterNonZero = (rows, field) => {
  if (!Array.isArray(rows)) return [];
  return rows.filter(row => toNumber(row?.[field]) !== 0);
};