/**
 * NestedTable
 *
 * Pure UI component - renders A/B table sections with TableContainer
 * All state and logic managed by parent (TablePlugin)
 */

import React from 'react';
import TableContainer, { TableHeader, TableBody, TableFooter } from './TableContainer.jsx';
import A1Section from './sections/A/A1.jsx';
import A2Section from './sections/A/A2.jsx';
import A3Section from './sections/A/A3.jsx';
import B1Section from './sections/B/B1.jsx';
import B2Section from './sections/B/B2.jsx';
import B3Section from './sections/B/B3.jsx';

export default function NestedTable({
  // Column routing
  fixedColumns = [],
  scrollingColumns = [],

  // Data
  rows = [],
  totals = {},
  columnKeys = [],
  columnLabels = {},
  columnWidths = {},

  // Sort state
  sortKey = null,
  sortDirection = null,
  onSort = () => {},

  // Styles
  styles = {},

  // Layout (for TableContainer)
  layout = {},

  // Drag/drop handlers
  onHeaderDragStart = null,
  onA1Drop = null,
  onDragOver = null,
  isTransitioning = false,

  ...props
}) {
  return (
    <TableContainer
      rows={rows}
      totals={totals}
      columnKeys={columnKeys}
      columnLabels={columnLabels}
      layout={layout}
      styles={styles}
      showHeader={true}
      showBody={true}
      showFooter={true}
      containerClasses="w-full h-auto bg-gray-100 flex flex-col overflow-hidden"
    >
      <TableHeader>
        <A1Section
          columnKeys={fixedColumns}
          columnLabels={columnLabels}
          columnWidths={columnWidths}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={onSort}
          styles={styles?.a1 || {}}
          className="bg-gradient-to-b from-gray-200 via-white to-gray-100 border-r"
          onA1Drop={onA1Drop}
          onDragOver={onDragOver}
          isTransitioning={isTransitioning}
        />
        <B1Section
          columnKeys={scrollingColumns}
          columnLabels={columnLabels}
          columnWidths={columnWidths}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={onSort}
          styles={styles?.b1 || {}}
          className="bg-gradient-to-b from-gray-200 via-white to-gray-100"
          onHeaderDragStart={onHeaderDragStart}
          isTransitioning={isTransitioning}
        />
      </TableHeader>

      <TableBody>
        <A2Section
          columnKeys={fixedColumns}
          columnWidths={columnWidths}
          rows={rows}
          styles={styles?.a2 || {}}
        />
        <B2Section
          columnKeys={scrollingColumns}
          columnWidths={columnWidths}
          rows={rows}
          styles={styles?.b2 || {}}
        />
      </TableBody>

      <TableFooter>
        <A3Section
          columnKeys={fixedColumns}
          columnWidths={columnWidths}
          totals={totals}
          styles={styles?.a3 || {}}
        />
        <B3Section
          columnKeys={scrollingColumns}
          columnWidths={columnWidths}
          totals={totals}
          styles={styles?.b3 || {}}
        />
      </TableFooter>
    </TableContainer>
  );
}
