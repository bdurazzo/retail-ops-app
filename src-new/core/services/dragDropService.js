/**
 * Drag and Drop Service
 *
 * Centralized service for serializing, deserializing, and validating
 * drag/drop data across the application.
 */

import { DRAG_TYPES, dragDataSchemas } from '../utils/dragDropTypes.js';

export const dragDropService = {
  /**
   * Serialize drag data into a JSON string for dataTransfer
   * @param {string} type - One of DRAG_TYPES constants
   * @param {object} data - Data to serialize (will be merged with schema)
   * @returns {string} JSON string ready for dataTransfer.setData()
   */
  serialize(type, data) {
    const schema = dragDataSchemas[type];

    if (!schema) {
      console.warn(`[dragDropService] Unknown drag type: ${type}`);
      return JSON.stringify({ type, ...data });
    }

    const payload = { ...schema, ...data, type }; // Ensure type is set
    return JSON.stringify(payload);
  },

  /**
   * Deserialize drag data from dataTransfer
   * @param {DataTransfer} dataTransfer - The drag event's dataTransfer object
   * @returns {object|null} Parsed drag data or null if invalid
   */
  deserialize(dataTransfer) {
    try {
      const rawData = dataTransfer.getData('text/plain');
      if (!rawData) return null;

      const data = JSON.parse(rawData);

      // Validate against schema
      if (!data.type || !dragDataSchemas[data.type]) {
        console.warn('[dragDropService] Invalid or missing drag type:', data);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[dragDropService] Failed to deserialize drag data:', error);
      return null;
    }
  },

  /**
   * Validate that drag data matches expected type
   * @param {object} data - Deserialized drag data
   * @param {string} expectedType - One of DRAG_TYPES constants
   * @returns {boolean} True if data matches expected type
   */
  validate(data, expectedType) {
    if (!data || !data.type) {
      return false;
    }

    return data.type === expectedType;
  },

  /**
   * Check if a drag type is registered
   * @param {string} type - Type to check
   * @returns {boolean} True if type exists in registry
   */
  isRegisteredType(type) {
    return Object.values(DRAG_TYPES).includes(type);
  },

  /**
   * Get the schema for a drag type
   * @param {string} type - One of DRAG_TYPES constants
   * @returns {object|null} Schema object or null if not found
   */
  getSchema(type) {
    return dragDataSchemas[type] || null;
  }
};
