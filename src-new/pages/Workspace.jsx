import React, { useState, useEffect } from "react";
import TableWorkspace from "../core/components/module/table/container/TableWorkspace.jsx";
import { multivariableTable } from "../core/components/custom/table/templates/multivariableTable.js";
import { loadLineItemsData } from "../core/services/dataService.js";
import { sortTableRows, getNextSortState } from "../core/utils/tableSorting.js";

export function Workspace() {
  const [multiTableData, setMultiTableData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track sorting state per table
  const [sortStates, setSortStates] = useState({
    'primary-metrics': { sortKey: null, sortDirection: 'desc' },
    'secondary-metrics': { sortKey: null, sortDirection: 'desc' },
    'coupled-pairs': { sortKey: null, sortDirection: 'desc' }
  });

  useEffect(() => {
    async function loadData() {
      try {
        // Load line items data FIRST
        const lineItems = await loadLineItemsData('2025', '08');

        // Pass data to template
        const data = multivariableTable(lineItems);
        setMultiTableData(data);
      } catch (error) {
        console.error('Workspace: Failed to load multivariable table data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle column swap - swap positions of two keys in scrollingColumns
  const handleColumnSwap = (tableId) => (oldKey, newKey) => {
    setMultiTableData(prev => {
      if (!prev) return prev;

      const updatedTables = prev.tables.map(table => {
        if (table.id !== tableId) return table;

        const scrollingColumns = [...table.tableProps.scrollingColumns];
        const oldIndex = scrollingColumns.indexOf(oldKey);
        const newIndex = scrollingColumns.indexOf(newKey);

        if (oldIndex === -1) return table;

        // Swap positions
        if (newIndex !== -1) {
          scrollingColumns[oldIndex] = newKey;
          scrollingColumns[newIndex] = oldKey;
        }

        return {
          ...table,
          tableProps: {
            ...table.tableProps,
            scrollingColumns
          }
        };
      });

      return {
        ...prev,
        tables: updatedTables
      };
    });
  };

  // Handle sort for specific table
  const handleSort = (tableId) => (columnKey) => {
    setSortStates(prev => {
      const currentState = prev[tableId];
      const { sortKey, sortDirection } = getNextSortState(
        currentState.sortKey,
        columnKey,
        currentState.sortDirection
      );

      return {
        ...prev,
        [tableId]: { sortKey, sortDirection }
      };
    });
  };

  // Nested row renderer for table 3
  const renderNestedRows = (row) => {
    if (!row?.nestedRows || row.nestedRows.length === 0) {
      return <div className="p-2 text-xs text-gray-500">No alternatives</div>;
    }

    return (
      <div className="p-2 bg-gray-50 text-[10px]">
        {row.nestedRows.map((nested, i) => (
          <div key={i} className="mb-2">
            <div className="font-semibold mb-1">{nested.label}</div>
            <div className="grid grid-cols-2 gap-1 text-[9px]">
              <div>Orders: {nested.metrics.orders?.bestPair} ({nested.metrics.orders?.value})</div>
              <div>Net: {nested.metrics.net?.bestPair} (${nested.metrics.net?.value?.toFixed(0)})</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-gray-500">Loading top products...</span>
      </div>
    );
  }

  if (!multiTableData) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-gray-500">Failed to load data</span>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex-1 flex h-full py-4 mx-4">
        <TableWorkspace
          mode="multi"
          tables={multiTableData.tables.map(t => {
            const sortState = sortStates[t.id] || { sortKey: null, sortDirection: 'desc' };
            const { sortKey, sortDirection } = sortState;

            // Apply sorting to rows if sortKey is set
            const sortedRows = sortKey
              ? sortTableRows(t.tableProps.rows, sortKey, sortDirection)
              : t.tableProps.rows;

            return {
              ...t,
              tableProps: {
                ...t.tableProps,
                rows: sortedRows
              },
              sortKey,
              sortDirection,
              onSort: handleSort(t.id),
              onColumnSwap: handleColumnSwap(t.id),
              nestedRowRenderer: t.expandable ? renderNestedRows : null
            };
          })}
          resizeHeights={[30, 30, 40]}
        />
      </div>
    </div>
  );
}

