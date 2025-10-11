/**
 * ZoneB2.js
 *
 * Configuration for D2 section (scrolling body zone)
 * Maps to B2 section underneath
 */

export function getZoneB2Config({
  rowCount = 10,       // How many row slots
  colSlotCount = 7,    // How many column slots in scrolling area
  slotAssignments = {} // What's been assigned to each slot
}) {
  // Generate column slots
  const colSlots = Array.from({ length: colSlotCount }, (_, i) => ({
    id: `d2_col_${i}`,
    position: i,
    type: 'column'
  }));

  // Generate row slots (same as C2, mirrors it)
  const rowSlots = Array.from({ length: rowCount }, (_, i) => ({
    id: `d2_row_${i}`,
    position: i,
    type: 'row'
  }));

  return {
    zoneId: 'd2',
    zoneType: 'body',
    colSlots,
    rowSlots,

    // Blank zone styling
    blankStyle: {
      backgroundColor: '#f9fafb', // gray-50
      border: '2px dashed #d1d5db', // gray-300
      minHeight: '200px'
    },

    // Props to pass to B2 section underneath
    b2Props: {
      columnKeys: [],
      columnWidths: {},
      rows: [],
      styles: {}
    }
  };
}
