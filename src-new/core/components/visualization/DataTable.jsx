import React, { useMemo } from 'react';
import Table from '../../../components/Table.jsx';
import { applyMetric, toTable } from '../../config/tableConfig.js';

// DataTable: Configurable table component that can apply independent metric filters
// and display custom headers/values separate from the main analytics query
export default function DataTable({ 
  data,                    // Raw data rows (before metric processing)
  metricConfig = [],       // Independent metric filters ['quantitySold', 'totalRevenue', etc.]
  customColumns = null,    // Override column configuration
  customLabels = {},       // Override display labels
  tableProps = {},         // Additional props for Table component
  ...otherProps 
}) {
  
  // Process data through metric pipeline with custom configuration
  const processedData = useMemo(() => {
    if (!data?.length) return [];
    
    // Apply independent metric filters to the data
    return applyMetric(data, metricConfig);
  }, [data, metricConfig]);

  // Convert processed data to table format with custom configuration
  const table = useMemo(() => {
    if (!processedData?.length) {
      return {
        columnKeys: customColumns || ["Product Name"],
        displayLabels: ["Product"],
        rows: [],
        totals: {},
        rowCount: 0,
        columnCount: customColumns?.length || 1,
        meta: { kpis: {} }
      };
    }

    // Generate table using standard feeder
    const baseTable = toTable(processedData, {
      meta: { 
        customColumns,
        customLabels,
        metricConfig 
      }
    });

    // Override columns if custom configuration provided
    if (customColumns?.length) {
      const filteredRows = baseTable.rows.map(row => {
        const filtered = {};
        customColumns.forEach(col => {
          if (row.hasOwnProperty(col)) {
            filtered[col] = row[col];
          }
        });
        return filtered;
      });

      const filteredTotals = {};
      customColumns.forEach(col => {
        if (baseTable.totals.hasOwnProperty(col)) {
          filteredTotals[col] = baseTable.totals[col];
        }
      });

      return {
        ...baseTable,
        columnKeys: customColumns,
        displayLabels: customColumns.map(col => customLabels[col] || col),
        rows: filteredRows,
        totals: filteredTotals,
        columnCount: customColumns.length
      };
    }

    // Apply custom labels if provided
    if (Object.keys(customLabels).length > 0) {
      return {
        ...baseTable,
        displayLabels: baseTable.columnKeys.map(col => customLabels[col] || col)
      };
    }

    return baseTable;
  }, [processedData, customColumns, customLabels]);

  // Merge default table props with custom overrides  
  const finalTableProps = {
    // Use Table.jsx default styling (matches original design)
    height: "100%",
    ...tableProps,
    ...otherProps
  };

  console.log('DataTable render:', { 
    dataLength: data?.length || 0,
    metricConfig,
    customColumns,
    tableKeys: table.columnKeys,
    processedLength: processedData?.length || 0
  });

  return (
    <Table
      table={table}
      placeholderRows={data?.length ? 0 : 8}
      placeholderCols={customColumns?.length || 4}
      {...finalTableProps}
    />
  );
}