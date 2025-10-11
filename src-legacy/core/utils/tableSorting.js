// src/core/utils/tableSorting.js

// src/core/utils/tableSorting.js

/**
 * Size sorting hierarchy:
 * 1. Number sizes (30 < 30x30 < 30x32 < 32x30)
 * 2. Letter sizes (XS < S < M < L < XL < XXL < XXXL)
 * 3. "One Size"
 * 4. "OS" (One Size abbreviation)
 * 5. Everything else (alphabetical)
 * 6. "Custom" (absolute last)
 */

// Letter sizes in order
const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

/**
 * Parse and categorize a size value
 */
function parseSize(size) {
  if (!size) return { category: 6, value: '', sortKey: 'zzz_null' };
  
  const normalized = String(size).toUpperCase().trim();
  
  // Category 1: Number sizes (30, 30x30, 30x32, etc.)
  const numberMatch = normalized.match(/^(\d+)(?:[Xx](\d+))?$/);
  if (numberMatch) {
    const first = parseInt(numberMatch[1]);
    const second = numberMatch[2] ? parseInt(numberMatch[2]) : 0;
    // Sort by first number, then second number
    const sortKey = `${first.toString().padStart(3, '0')}_${second.toString().padStart(3, '0')}`;
    return { category: 1, value: normalized, sortKey };
  }
  
  // Category 2: Letter sizes
  const letterIndex = LETTER_SIZES.indexOf(normalized);
  if (letterIndex !== -1) {
    const sortKey = letterIndex.toString().padStart(2, '0');
    return { category: 2, value: normalized, sortKey };
  }
  
  // Category 3: "One Size"
  if (normalized === 'ONE SIZE' || normalized === 'ONESIZE') {
    return { category: 3, value: normalized, sortKey: '000' };
  }
  
  // Category 4: "OS" (One Size abbreviation)
  if (normalized === 'OS') {
    return { category: 4, value: normalized, sortKey: '000' };
  }
  
  // Category 6: "Custom" (absolute last)
  if (normalized === 'CUSTOM') {
    return { category: 6, value: normalized, sortKey: 'zzz' };
  }
  
  // Category 5: Everything else (alphabetical)
  return { category: 5, value: normalized, sortKey: normalized.toLowerCase() };
}

/**
 * Compare two sizes according to the hierarchy
 */
function compareSizes(a, b) {
  const sizeA = parseSize(a);
  const sizeB = parseSize(b);
  
  // First compare by category
  if (sizeA.category !== sizeB.category) {
    return sizeA.category - sizeB.category;
  }
  
  // Within same category, compare by sortKey
  if (sizeA.sortKey < sizeB.sortKey) return -1;
  if (sizeA.sortKey > sizeB.sortKey) return 1;
  return 0;
}

/**
 * Determines the data type of a column for proper sorting
 */
function getColumnType(rows, columnKey) {
  // Special case: Size columns get special size sorting
  if (columnKey === 'Size' || columnKey.toLowerCase().includes('size')) {
    return 'size';
  }
  
  // Special case: Date/Time columns
  if (columnKey === 'Order Date/Time' || columnKey.toLowerCase().includes('date') || columnKey.toLowerCase().includes('time')) {
    return 'date';
  }

  // Find the first non-null, non-undefined value
  const sampleValue = rows.find(row => {
    const val = row[columnKey];
    return val !== null && val !== undefined && val !== '';
  })?.[columnKey];

  if (sampleValue === undefined) return 'string';
  
  // Check if it's a number
  if (typeof sampleValue === 'number' || !isNaN(Number(sampleValue))) {
    return 'number';
  }
  
  // Check if it's a date string (broader pattern for various formats)
  if (typeof sampleValue === 'string') {
    // Match YYYY-MM-DD or other date-like patterns
    const dateRegex = /^\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}/;
    if (dateRegex.test(sampleValue)) {
      return 'date';
    }
  }
  
  return 'string';
}

/**
 * Compare function for different data types
 */
function compareValues(a, b, columnType, direction = 'asc') {
  // Handle null/undefined values - always put them at the end
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  let comparison = 0;

  switch (columnType) {
    case 'size':
      comparison = compareSizes(a, b);
      break;
      
    case 'number':
      const numA = Number(a) || 0;
      const numB = Number(b) || 0;
      comparison = numA - numB;
      break;
      
    case 'date':
      // Handle various date formats
      let dateA, dateB;
      
      // Try parsing as ISO string first, then fallback to Date constructor
      try {
        dateA = new Date(a);
        dateB = new Date(b);
        
        // If Date parsing failed, fall back to string comparison
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          const strA = String(a).toLowerCase();
          const strB = String(b).toLowerCase();
          comparison = strA.localeCompare(strB);
        } else {
          comparison = dateA.getTime() - dateB.getTime();
        }
      } catch (e) {
        // If all else fails, do string comparison
        const strA = String(a).toLowerCase();
        const strB = String(b).toLowerCase();
        comparison = strA.localeCompare(strB);
      }
      break;
      
    case 'string':
    default:
      const strA = String(a).toLowerCase();
      const strB = String(b).toLowerCase();
      comparison = strA.localeCompare(strB);
      break;
  }

  // Apply direction
  return direction === 'desc' ? -comparison : comparison;
}

/**
 * Main sorting function
 * @param {Array} rows - Array of row objects to sort
 * @param {string} columnKey - The column key to sort by
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} - New sorted array
 */
export function sortTableRows(rows, columnKey, direction = 'asc') {
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return rows;
  }

  if (!columnKey) {
    return rows;
  }

  // Determine column data type
  const columnType = getColumnType(rows, columnKey);

  // Sort the rows
  const sortedRows = [...rows].sort((a, b) => {
    return compareValues(a[columnKey], b[columnKey], columnType, direction);
  });

  return sortedRows;
}

/**
 * Toggle sort direction helper with 3-state cycle: asc -> desc -> unsorted
 * @param {string} currentKey - Currently sorted column
 * @param {string} newKey - Column being clicked
 * @param {string} currentDirection - Current sort direction
 * @returns {Object} - { sortKey, sortDirection }
 */
export function getNextSortState(currentKey, newKey, currentDirection) {
  if (currentKey !== newKey) {
    // Clicking a new column - default to ascending
    return { sortKey: newKey, sortDirection: 'asc' };
  } else {
    // Clicking the same column - cycle through: asc -> desc -> unsorted
    if (currentDirection === 'asc') {
      return { sortKey: newKey, sortDirection: 'desc' };
    } else if (currentDirection === 'desc') {
      return { sortKey: null, sortDirection: null }; // Unsorted state
    } else {
      return { sortKey: newKey, sortDirection: 'asc' }; // Back to ascending
    }
  }
}

/**
 * Get sort indicator for UI display
 * @param {string} columnKey - Column being checked
 * @param {string} currentSortKey - Currently sorted column (can be null for unsorted)
 * @param {string} currentDirection - Current sort direction (can be null for unsorted)
 * @returns {string} - '↑', '↓', or ''
 */
export function getSortIndicator(columnKey, currentSortKey, currentDirection) {
  if (columnKey !== currentSortKey || currentSortKey === null) {
    return '';
  }
  return currentDirection === 'asc' ? '↑' : '↓';
}

/**
 * Check if a column is sortable
 * @param {string} columnKey - Column to check
 * @param {Array} excludeColumns - Columns that shouldn't be sortable
 * @returns {boolean}
 */
export function isColumnSortable(columnKey, excludeColumns = ['#']) {
  return !excludeColumns.includes(columnKey);
}

export default {
  sortTableRows,
  getNextSortState,
  getSortIndicator,
  isColumnSortable
};