/**
 * Row Assignment Configuration
 *
 * Defines the contract and schema for row assignments
 */

export const rowAssignmentContract = {
  type: 'row',

  // Where can this assignment be dropped?
  validTargets: ['TableBody'],

  // What can be dropped ONTO this assignment?
  accepts: [
    {
      type: 'dataSource',
      required: false,
      default: null
    },
    {
      type: 'filter',
      required: false,
      default: null
    },
    {
      type: 'plugin',
      required: false,
      default: null
    }
  ],

  // Required fields
  requires: [],  // Row assignment can exist without nested drops initially

  // Optional fields
  optional: ['dataSource', 'filter', 'plugin'],

  // What does this produce for tableOperator?
  output: {
    dataSource: 'string|object',  // CSV path, API endpoint, or data variable
    filter: 'object',             // Query to filter rows
    plugin: 'object',             // Plugin configuration (expand/collapse, etc.)
    rows: 'array'                 // Resulting data rows
  },

  // Validation function
  validate: (assignment) => {
    // Row assignment is valid as long as it has valid nested assignments
    if (assignment.dataSource && typeof assignment.dataSource !== 'string' && typeof assignment.dataSource !== 'object') {
      return { valid: false, error: 'dataSource must be a string or object' };
    }
    return { valid: true };
  }
};

export default rowAssignmentContract;
