/**
 * ZoneA3.js
 *
 * Configuration for C3 section (fixed footer zone)
 * Maps to A3 section underneath
 */

export function getZoneA3Config({
  slotCount = 1,       // How many column slots in this zone
  slotAssignments = {} // What's been assigned to each slot
}) {
  // Generate slot definitions
  const slots = Array.from({ length: slotCount }, (_, i) => ({
    id: `c3_slot_${i}`,
    position: i,
    type: 'column',
    state: slotAssignments[`c3_slot_${i}`] ? 'plugin' : 'blank'
  }));

  return {
    zoneId: 'c3',
    zoneType: 'footer',
    slots,

    // Blank zone styling
    blankStyle: {
      backgroundColor: '#f3f4f6', // gray-100
      border: '2px dashed #d1d5db', // gray-300
      minHeight: '40px'
    },

    // Props to pass to A3 section underneath
    a3Props: {
      columnKeys: [],
      columnWidths: {},
      totals: {},
      styles: {}
    }
  };
}
