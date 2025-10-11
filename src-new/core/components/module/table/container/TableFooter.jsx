/**
 * TableFooter
 *
 * Container for table footer sections (A3 + B3).
 * Processes column assignments and totals, renders pure UI sections.
 */

import React from 'react';
import A3Section from '../../../custom/table/sections/A/A3.jsx';
import B3Section from '../../../custom/table/sections/B/B3.jsx';

export default function TableFooter({
  columnAssignments = [],
  totals = {},
  columnWidths = {},
  fixedColumns = [],
  scrollingColumns = [],
  tableContext
}) {
  // Build props for A3 section
  const a3Props = {
    columnKeys: fixedColumns,
    columnWidths,
    totals,
    styles: tableContext?.styles?.a3 || {},
    tableContext
  };

  // Build props for B3 section
  const b3Props = {
    columnKeys: scrollingColumns,
    columnWidths,
    totals,
    styles: tableContext?.styles?.b3 || {},
    tableContext
  };

  return (
    <>
      <A3Section {...a3Props} />
      <B3Section {...b3Props} />
    </>
  );
}
