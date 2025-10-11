/**
 * ZoneA2.js
 *
 * Configuration for C2 section (fixed body zone)
 * Maps to A2 section underneath
 */

export function getZoneA2Config({
  rowCount = 10,       // How many row slots
  colSlotCount = 1,    // How many column slots in fixed area
  slotAssignments = {} // What's been assigned to each slot
}) {
  // Generate column slots
  const colSlots = Array.from({ length: colSlotCount }, (_, i) => ({
    id: `c2_col_${i}`,
    position: i,
    type: 'column'
  }));

  // Generate row slots
  const rowSlots = Array.from({ length: rowCount }, (_, i) => ({
    id: `c2_row_${i}`,
    position: i,
    type: 'row'
  }));

  return {
    zoneId: 'c2',
    zoneType: 'body',
    colSlots,
    rowSlots,

    // Blank zone styling
    blankStyle: {
      backgroundColor: '#f9fafb', // gray-50
      border: '2px dashed #d1d5db', // gray-300
      minHeight: '200px'
    },

    // Props to pass to A2 section underneath
    a2Props: {
      columnKeys: [],
      columnWidths: {},
      rows: [],
      styles: {}
    }
  };
}
