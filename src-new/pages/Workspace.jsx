import React, { useState, useEffect } from "react";
import TableWorkspace from "../core/components/module/table/container/TableWorkspace.jsx";
import { modularTable } from "../core/components/custom/table/templates/modularTable.js";
import { sortTableRows, getNextSortState } from "../core/utils/tableSorting.js";

export function Workspace() {
  const [tableProps, setTableProps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('discounted_price');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    async function loadData() {
      try {
        const props = await modularTable();
        setTableProps(props);
      } catch (error) {
        console.error('Workspace: Failed to load table data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Apply sorting when tableProps, sortKey, or sortDirection changes
  const sortedTableProps = tableProps ? {
    ...tableProps,
    rows: sortKey ? sortTableRows(tableProps.rows, sortKey, sortDirection) : tableProps.rows
  } : null;

  // Sort handler - mimics TablePlugin pattern
  const handleSort = (columnKey) => {
    const { sortKey: newSortKey, sortDirection: newSortDirection } = getNextSortState(
      sortKey,
      columnKey,
      sortDirection
    );
    setSortKey(newSortKey);
    setSortDirection(newSortDirection);
  };

  // Column swap handler - swap positions of two columns
  const handleColumnSwap = (oldColumnKey, newColumnKey) => {
    if (!tableProps || oldColumnKey === newColumnKey) return;

    setTableProps(prev => {
      const oldIndex = prev.scrollingColumns.indexOf(oldColumnKey);
      const newIndex = prev.scrollingColumns.indexOf(newColumnKey);

      if (oldIndex === -1) return prev; // Old column not found, do nothing

      const newScrollingColumns = [...prev.scrollingColumns];

      if (newIndex === -1) {
        // New column doesn't exist in scrollingColumns, simple replacement
        newScrollingColumns[oldIndex] = newColumnKey;
      } else {
        // Both columns exist - swap their positions
        newScrollingColumns[oldIndex] = newColumnKey;
        newScrollingColumns[newIndex] = oldColumnKey;
      }

      return {
        ...prev,
        scrollingColumns: newScrollingColumns
      };
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-gray-500">Loading top products...</span>
      </div>
    );
  }

  if (!tableProps) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-gray-500">Failed to load data</span>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex-1 flex h-full py-4 mx-4 ">
        <TableWorkspace
          tableProps={sortedTableProps}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          onColumnSwap={handleColumnSwap}
        />
      </div>
    </div>
  );
}

