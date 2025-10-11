/**
 * Button Assignment Configuration
 *
 * Defines the contract and schema for button assignments
 */

export const buttonAssignmentContract = {
  type: 'button',

  // Where can this assignment be dropped?
  validTargets: ['TableToolbar'],

  // What can be dropped ONTO this assignment?
  accepts: [
    {
      type: 'filter',
      required: false,
      default: null
    },
    {
      type: 'action',
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
  requires: ['label', 'action'],

  // Optional fields
  optional: ['params', 'icon'],

  // What does this produce for tableOperator?
  output: {
    label: 'string',      // Button text
    action: 'string',     // Action type (filter, export, etc.)
    handler: 'function',  // Click handler
    params: 'object',     // Action parameters
    icon: 'string'        // Optional icon name
  },

  // Validation function
  validate: (assignment) => {
    if (!assignment.label || typeof assignment.label !== 'string') {
      return { valid: false, error: 'label is required and must be a string' };
    }
    if (!assignment.action || typeof assignment.action !== 'string') {
      return { valid: false, error: 'action is required and must be a string' };
    }
    return { valid: true };
  }
};

export default buttonAssignmentContract;
