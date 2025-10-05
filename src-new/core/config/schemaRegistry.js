/**
 * Schema Registry
 *
 * Centralized access to data schemas for field definitions,
 * display labels, and formatting hints.
 */

import retailLineItemsSchema from '../../../public/data/schemas/retail_line_items.schema.json';

/**
 * Registry of all available schemas
 */
const SCHEMAS = {
  retail_line_items: retailLineItemsSchema
  // Add more schemas as they're created
  // orders: ordersSchema
};

/**
 * Get a schema by name
 */
export function getSchema(schemaName) {
  return SCHEMAS[schemaName] || null;
}

/**
 * Get field definition from schema
 */
export function getFieldDefinition(schemaName, fieldName) {
  const schema = getSchema(schemaName);
  return schema?.fields?.[fieldName] || null;
}

/**
 * Get display label for a field
 * @param {string} schemaName - Schema to use
 * @param {string} fieldName - Field name (snake_case)
 * @param {string} displayMode - 'default', 'short', or 'verbose'
 * @returns {string} Display label or field name as fallback
 */
export function getFieldLabel(schemaName, fieldName, displayMode = 'default') {
  const field = getFieldDefinition(schemaName, fieldName);

  // Try display_options first
  if (field?.display_options?.[displayMode]) {
    return field.display_options[displayMode];
  }

  // Fallback to default mode if requested mode not found
  if (displayMode !== 'default' && field?.display_options?.default) {
    return field.display_options.default;
  }

  // Ultimate fallback: capitalize snake_case
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get format hint for a field
 * @param {string} schemaName - Schema to use
 * @param {string} fieldName - Field name
 * @returns {string|null} Format hint ('currency', 'integer', 'decimal', 'percentage') or null
 */
export function getFormatHint(schemaName, fieldName) {
  const field = getFieldDefinition(schemaName, fieldName);
  return field?.format_hint || null;
}

/**
 * Get all numeric fields from schema
 * @param {string} schemaName - Schema to use
 * @returns {string[]} Array of field names that are numeric
 */
export function getNumericFields(schemaName) {
  const schema = getSchema(schemaName);
  return schema?.analytics_config?.numeric_fields || [];
}

/**
 * Get all grouping fields from schema
 * @param {string} schemaName - Schema to use
 * @returns {string[]} Array of field names that can be grouped by
 */
export function getGroupingFields(schemaName) {
  const schema = getSchema(schemaName);
  return schema?.analytics_config?.grouping_fields || [];
}

/**
 * Get primary fields from schema
 * @param {string} schemaName - Schema to use
 * @returns {string[]} Array of primary field names
 */
export function getPrimaryFields(schemaName) {
  const schema = getSchema(schemaName);
  return schema?.analytics_config?.primary_fields || [];
}

/**
 * Check if field is numeric
 * @param {string} schemaName - Schema to use
 * @param {string} fieldName - Field name
 * @returns {boolean} True if field is numeric
 */
export function isNumericField(schemaName, fieldName) {
  const numericFields = getNumericFields(schemaName);
  return numericFields.includes(fieldName);
}

export default {
  getSchema,
  getFieldDefinition,
  getFieldLabel,
  getFormatHint,
  getNumericFields,
  getGroupingFields,
  getPrimaryFields,
  isNumericField
};
