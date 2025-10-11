/**
 * Column Assignment Configuration
 *
 * Defines the contract and schema for column assignments
 */

export const columnAssignmentContract = {
  type: 'column',

  // Where can this assignment be dropped?
  validTargets: ['TableHeader', 'TableFooter'],

  // What can be dropped ONTO this assignment?
  accepts: [
    {
      type: 'label',
      required: false,
      default: (csvHeader) => csvHeader  // Use CSV header if no label provided
    },
    {
      type: 'formatter',
      required: false,
      default: (value) => String(value)  // Default string formatter
    },
    {
      type: 'width',
      required: false,
      default: 100  // Default column width
    },
    {
      type: 'alignment',
      required: false,
      default: 'center'  // Default alignment
    }
  ],

  // Required fields for this assignment
  requires: ['columnKey'],

  // Optional fields
  optional: ['label', 'width', 'alignment', 'formatter'],

  // What does this produce for tableOperator?
  output: {
    columnKey: 'string',      // Key for the column
    columnLabel: 'string',    // Display label
    columnWidth: 'number',    // Width in px
    columnAlignment: 'string', // left | center | right
    formatter: 'function'     // Value formatter function
  },

  // Validation function
  validate: (assignment) => {
    if (!assignment.columnKey || typeof assignment.columnKey !== 'string') {
      return { valid: false, error: 'columnKey is required and must be a string' };
    }
    if (assignment.width && typeof assignment.width !== 'number') {
      return { valid: false, error: 'width must be a number' };
    }
    if (assignment.alignment && !['left', 'center', 'right'].includes(assignment.alignment)) {
      return { valid: false, error: 'alignment must be left, center, or right' };
    }
    return { valid: true };
  }
};

export default columnAssignmentContract;
