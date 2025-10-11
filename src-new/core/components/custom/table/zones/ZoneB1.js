/**
 * ZoneB1.js
 *
 * Configuration for D1 section (scrolling header zone)
 * Maps to B1 section underneath
 */

export function getZoneB1Config({
  slotCount = 7,      // How many column slots in this zone
  slotAssignments = {} // What's been assigned to each slot
}) {
  // Generate slot definitions
  const slots = Array.from({ length: slotCount }, (_, i) => ({
    id: `d1_slot_${i}`,
    position: i,
    type: 'column',
    state: slotAssignments[`d1_slot_${i}`] ? 'plugin' : 'blank'
  }));

  return {
    zoneId: 'd1',
    zoneType: 'header',
    slots,

    // Blank zone styling
    blankStyle: {
      backgroundColor: '#f3f4f6', // gray-100
      border: '2px dashed #d1d5db', // gray-300
      minHeight: '40px'
    },

    // Props to pass to B1 section underneath
    b1Props: {
      columnKeys: [],
      columnLabels: {},
      columnWidths: {},
      styles: {}
    }
  };
}
