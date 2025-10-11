/**
 * ZoneB3.js
 *
 * Configuration for D3 section (scrolling footer zone)
 * Maps to B3 section underneath
 */

export function getZoneB3Config({
  slotCount = 7,       // How many column slots in this zone
  slotAssignments = {} // What's been assigned to each slot
}) {
  // Generate slot definitions
  const slots = Array.from({ length: slotCount }, (_, i) => ({
    id: `d3_slot_${i}`,
    position: i,
    type: 'column',
    state: slotAssignments[`d3_slot_${i}`] ? 'plugin' : 'blank'
  }));

  return {
    zoneId: 'd3',
    zoneType: 'footer',
    slots,

    // Blank zone styling
    blankStyle: {
      backgroundColor: '#f3f4f6', // gray-100
      border: '2px dashed #d1d5db', // gray-300
      minHeight: '40px'
    },

    // Props to pass to B3 section underneath
    b3Props: {
      columnKeys: [],
      columnWidths: {},
      totals: {},
      styles: {}
    }
  };
}
