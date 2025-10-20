/**
 * EXAMPLE_USAGE.jsx
 * Example showing how to use the coupled pairs analysis system
 *
 * This demonstrates:
 * 1. Loading data
 * 2. Generating three tables
 * 3. Rendering with TableWorkspace in multi mode
 */

import React, { useState, useEffect } from 'react';
import TableWorkspace from '../../container/TableWorkspace.jsx';
import { generatePrimaryMetricsTable, getProductsForPairing as getPrimaryProducts } from './primaryMetrics.js';
import { generateSecondaryMetricsTable, getProductsForPairing as getSecondaryProducts } from './secondaryMetrics.js';
import { generateCoupledPairsTable } from './coupledPairs.js';

export default function PairAnalysisExample() {
  const [lineItems, setLineItems] = useState([]);
  const [table1Props, setTable1Props] = useState(null);
  const [table2Props, setTable2Props] = useState(null);
  const [table3Props, setTable3Props] = useState(null);
  const [config, setConfig] = useState({
    table1Size: 10,
    table2Size: 10,
    pairSize: 10,
    dateRange: { days: 30 }
  });

  // Load data (replace with your actual data loading)
  useEffect(() => {
    // Example: fetch line items from your data source
    // For now, using empty array
    const mockLineItems = [];
    setLineItems(mockLineItems);
  }, []);

  // Generate tables when data or config changes
  useEffect(() => {
    if (lineItems.length === 0) return;

    // Generate Table 1: Primary Metrics
    const table1 = generatePrimaryMetricsTable(lineItems, {
      sampleSize: config.table1Size,
      sortBy: 'quantity'
    });
    setTable1Props(table1);

    // Generate Table 2: Secondary Metrics
    const table2 = generateSecondaryMetricsTable(lineItems, {
      sampleSize: config.table2Size,
      sortBy: 'attach_rate',
      dateRange: config.dateRange
    });
    setTable2Props(table2);

    // Extract products for pairing
    const products1 = getPrimaryProducts(table1);
    const products2 = getSecondaryProducts(table2);

    // Generate Table 3: Coupled Pairs
    const table3 = generateCoupledPairsTable(products1, products2, lineItems, {
      sampleSize: config.pairSize,
      dateRange: config.dateRange
    });
    setTable3Props(table3);

  }, [lineItems, config]);

  // Render nested rows for Table 3
  const renderNestedRows = (row) => {
    if (!row?.nestedRows || row.nestedRows.length === 0) {
      return <div className="p-4 text-gray-500">No alternatives available</div>;
    }

    return (
      <div className="p-4 bg-gray-50">
        {row.nestedRows.map((nested, index) => (
          <div key={index} className="mb-4">
            <div className="font-semibold text-sm mb-2">{nested.label}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-xs">
                <span className="font-medium">Best by Orders:</span> {nested.metrics.orders.bestPair}
                <span className="ml-2 text-gray-600">
                  ({nested.metrics.orders.value} orders, {nested.metrics.orders.percentDiff > 0 ? '+' : ''}
                  {nested.metrics.orders.percentDiff.toFixed(1)}%)
                </span>
              </div>
              <div className="text-xs">
                <span className="font-medium">Best by Net:</span> {nested.metrics.net.bestPair}
                <span className="ml-2 text-gray-600">
                  (${nested.metrics.net.value.toFixed(0)}, {nested.metrics.net.percentDiff > 0 ? '+' : ''}
                  {nested.metrics.net.percentDiff.toFixed(1)}%)
                </span>
              </div>
              <div className="text-xs">
                <span className="font-medium">Best by Bundle Rate:</span> {nested.metrics.bundleRate.bestPair}
                <span className="ml-2 text-gray-600">
                  ({(nested.metrics.bundleRate.value * 100).toFixed(1)}%, {nested.metrics.bundleRate.percentDiff > 0 ? '+' : ''}
                  {nested.metrics.bundleRate.percentDiff.toFixed(1)}%)
                </span>
              </div>
              <div className="text-xs">
                <span className="font-medium">Best by Velocity:</span> {nested.metrics.velocity.bestPair}
                <span className="ml-2 text-gray-600">
                  ({nested.metrics.velocity.value.toFixed(1)}/day, {nested.metrics.velocity.percentDiff > 0 ? '+' : ''}
                  {nested.metrics.velocity.percentDiff.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!table1Props || !table2Props || !table3Props) {
    return <div className="p-4">Loading data...</div>;
  }

  return (
    <TableWorkspace
      mode="multi"
      tables={[
        {
          id: 'primary-metrics',
          tableProps: table1Props,
          columnAssignments: [],
          rowAssignments: [],
          sortKey: 'quantity',
          sortDirection: 'desc',
          onSort: (key, direction) => {
            console.log('Table 1 sort:', key, direction);
          },
          onColumnSwap: () => {}
        },
        {
          id: 'secondary-metrics',
          tableProps: table2Props,
          columnAssignments: [],
          rowAssignments: [],
          sortKey: 'attach_rate',
          sortDirection: 'desc',
          onSort: (key, direction) => {
            console.log('Table 2 sort:', key, direction);
          },
          onColumnSwap: () => {}
        },
        {
          id: 'coupled-pairs',
          tableProps: table3Props,
          columnAssignments: [],
          rowAssignments: [],
          sortKey: 'compound_score',
          sortDirection: 'desc',
          onSort: (key, direction) => {
            console.log('Table 3 sort:', key, direction);
          },
          onColumnSwap: () => {},
          expandable: true,
          nestedRowRenderer: renderNestedRows
        }
      ]}
      resizeHeights={[30, 30, 40]}
      onResizeChange={(heights) => {
        console.log('Heights changed:', heights);
      }}
    />
  );
}

/**
 * INTEGRATION STEPS:
 *
 * 1. Import your actual line items data
 * 2. Wire up PairAnalysisPluginPanel to control config state
 * 3. Add this component to your routing/view system
 * 4. Customize nested row rendering for your UI
 * 5. Add export/filtering capabilities as needed
 *
 * MINIMAL EXAMPLE:
 *
 * import PairAnalysisExample from './path/to/EXAMPLE_USAGE.jsx';
 *
 * function MyApp() {
 *   return <PairAnalysisExample />;
 * }
 */
