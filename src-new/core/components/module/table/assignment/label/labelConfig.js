/**
 * Label Assignment Configuration
 *
 * Defines the contract and schema for label assignments
 */

export const labelAssignmentContract = {
  type: 'label',

  // Where can this assignment be dropped?
  validTargets: ['ColumnAssignment'],

  // What can be dropped ONTO this assignment?
  accepts: [],  // Label assignments don't accept nested drops

  // Required fields
  requires: ['label'],

  // Optional fields
  optional: ['sourceField'],

  // What does this produce for tableOperator?
  output: {
    label: 'string',        // Display text
    sourceField: 'string'   // Optional: CSV field this label represents
  },

  // Validation function
  validate: (assignment) => {
    if (!assignment.label || typeof assignment.label !== 'string') {
      return { valid: false, error: 'label is required and must be a string' };
    }
    if (assignment.label.trim().length === 0) {
      return { valid: false, error: 'label cannot be empty' };
    }
    return { valid: true };
  }
};

export default labelAssignmentContract;
