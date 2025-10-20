import React, { useState, useEffect } from 'react';
import { useAnalyticsQueryWithVerification } from "../hooks/useAnalyticsData.js";
import TableWorkspace from '../core/components/module/table/container/TableWorkspace.jsx';
import { generatePrimaryMetricsTable, getProductsForPairing as getPrimaryProducts } from '../core/components/module/table/assignment/multivariable/primaryMetrics.js';
import { generateSecondaryMetricsTable, getProductsForPairing as getSecondaryProducts } from '../core/components/module/table/assignment/multivariable/secondaryMetrics.js';
import { generateCoupledPairsTable } from '../core/components/module/table/assignment/multivariable/coupledPairs.js';

export default function PairAnalysis() {
  const defaultQuery = { scope: 'line_items' };
  const [query, setQuery] = useState(defaultQuery);
  const [panelState, setPanelState] = useState({});

  // Use your existing data hook
  const { rawData } = useAnalyticsQueryWithVerification(query, panelState, 'line_items');

  const [tables, setTables] = useState(null);

  // Generate tables when data loads
  useEffect(() => {
    if (!rawData || rawData.length === 0) {
      console.log('PairAnalysis: No data yet');
      return;
    }

    console.log('PairAnalysis: Generating tables with', rawData.length, 'line items');

    // Table 1: Primary metrics
    const table1 = generatePrimaryMetricsTable(rawData, {
      sampleSize: 10,
      sortBy: 'quantity'
    });

    // Table 2: Secondary metrics
    const table2 = generateSecondaryMetricsTable(rawData, {
      sampleSize: 10,
      sortBy: 'attach_rate',
      dateRange: { days: 30 }
    });

    // Get products for pairing
    const products1 = getPrimaryProducts(table1);
    const products2 = getSecondaryProducts(table2);

    console.log('PairAnalysis: Products for pairing:', products1.length, 'x', products2.length);

    // Table 3: Coupled pairs
    const table3 = generateCoupledPairsTable(products1, products2, rawData, {
      sampleSize: 10,
      dateRange: { days: 30 }
    });

    setTables({ table1, table2, table3 });
  }, [rawData]);

  // Nested row renderer
  const renderNestedRows = (row) => {
    if (!row?.nestedRows || row.nestedRows.length === 0) {
      return <div className="p-2 text-xs text-gray-500">No alternatives</div>;
    }

    return (
      <div className="p-2 bg-gray-50 text-xs">
        {row.nestedRows.map((nested, index) => (
          <div key={index} className="mb-3">
            <div className="font-semibold text-[10px] mb-1">{nested.label}</div>
            <div className="grid grid-cols-2 gap-1">
              <div>
                <span className="font-medium">Orders:</span> {nested.metrics.orders?.bestPair || 'N/A'}
                <span className="ml-1 text-gray-600">
                  ({nested.metrics.orders?.value || 0},
                  {nested.metrics.orders?.percentDiff > 0 ? '+' : ''}
                  {nested.metrics.orders?.percentDiff?.toFixed(1) || 0}%)
                </span>
              </div>
              <div>
                <span className="font-medium">Net:</span> {nested.metrics.net?.bestPair || 'N/A'}
                <span className="ml-1 text-gray-600">
                  (${nested.metrics.net?.value?.toFixed(0) || 0})
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!tables) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Loading data...
      </div>
    );
  }

  return (
    <div className="h-full px-2 py-2">
      <TableWorkspace
        mode="multi"
        tables={[
          {
            id: 'primary',
            tableProps: tables.table1,
            columnAssignments: [],
            rowAssignments: [],
            sortKey: 'quantity',
            sortDirection: 'desc',
            onSort: () => {},
            onColumnSwap: () => {}
          },
          {
            id: 'secondary',
            tableProps: tables.table2,
            columnAssignments: [],
            rowAssignments: [],
            sortKey: 'attach_rate',
            sortDirection: 'desc',
            onSort: () => {},
            onColumnSwap: () => {}
          },
          {
            id: 'pairs',
            tableProps: tables.table3,
            columnAssignments: [],
            rowAssignments: [],
            sortKey: 'compound_score',
            sortDirection: 'desc',
            onSort: () => {},
            onColumnSwap: () => {},
            expandable: true,
            nestedRowRenderer: renderNestedRows
          }
        ]}
        resizeHeights={[30, 30, 40]}
      />
    </div>
  );
}
