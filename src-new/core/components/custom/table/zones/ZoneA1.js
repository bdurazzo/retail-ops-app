/**
 * ZoneA1.js
 *
 * Configuration for C1 section (fixed header zone)
 * Maps to A1 section underneath
 */

export function getZoneA1Config({
  slotCount = 1,      // How many column slots in this zone
  slotAssignments = {} // What's been assigned to each slot
}) {
  // Generate slot definitions
  const slots = Array.from({ length: slotCount }, (_, i) => ({
    id: `c1_slot_${i}`,
    position: i,
    type: 'column',
    state: slotAssignments[`c1_slot_${i}`] ? 'plugin' : 'blank'
  }));

  return {
    zoneId: 'c1',
    zoneType: 'header',
    slots,

    // Blank zone styling
    blankStyle: {
      backgroundColor: '#f3f4f6', // gray-100
      border: '2px dashed #d1d5db', // gray-300
      minHeight: '40px'
    },

    // Props to pass to A1 section underneath
    a1Props: {
      columnKeys: [],
      columnLabels: {},
      columnWidths: {},
      styles: {}
    }
  };
}
