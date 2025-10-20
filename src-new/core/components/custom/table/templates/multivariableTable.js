/**
 * Multivariable Table Template
 * Returns 3 tables for coupled pairs analysis in multi-mode format
 * Receives data from dataService like all other templates
 */

import { MODULE_STYLES, MODULE_LAYOUT } from '../tableProps.js';
import { generatePrimaryMetricsTable } from '../../../module/table/assignment/multivariable/primaryMetrics.js';
import { generateSecondaryMetricsTable } from '../../../module/table/assignment/multivariable/secondaryMetrics.js';
import { generateCoupledPairsTable } from '../../../module/table/assignment/multivariable/coupledPairs.js';
import { getProductsForPairing as getPrimaryProducts } from '../../../module/table/assignment/multivariable/primaryMetrics.js';
import { getProductsForPairing as getSecondaryProducts } from '../../../module/table/assignment/multivariable/secondaryMetrics.js';

export function multivariableTable(lineItems = [], options = {}) {
  const {
    table1Size = 10,
    table2Size = 10,
    pairSize = 10,
    dateRange = { days: 30 }
  } = options;

  if (!lineItems || lineItems.length === 0) {
    console.error('multivariableTable: No line items provided');
    return null;
  }

  console.log('multivariableTable: Processing', lineItems.length, 'line items');

  // Generate Table 1: Primary Metrics (Quantity + Net)
  const table1Props = generatePrimaryMetricsTable(lineItems, {
    sampleSize: table1Size,
    sortBy: 'quantity'
  });

  // Get Table 1 product names to use as reference for Table 2 attach rates
  const table1ProductNames = table1Props.rows.map(row => row.product_name);
  console.log('multivariableTable: Table 1 product names:', table1ProductNames);

  // Generate Table 2: Secondary Metrics (Attach Rate + Velocity)
  // Attach rate calculated relative to Table 1 products
  const table2Props = generateSecondaryMetricsTable(lineItems, {
    sampleSize: table2Size,
    sortBy: 'attach_rate',
    dateRange,
    referenceProducts: table1ProductNames
  });
  console.log('multivariableTable: Table 2 sample:', table2Props.rows.slice(0, 3));

  // Get products for pairing
  const products1 = getPrimaryProducts(table1Props);
  const products2 = getSecondaryProducts(table2Props);

  console.log('multivariableTable: Generating pairs from', products1.length, 'x', products2.length, 'products');

  // Generate Table 3: Coupled Pairs
  const table3Props = generateCoupledPairsTable(products1, products2, lineItems, {
    sampleSize: pairSize,
    dateRange
  });

  // Add MODULE_STYLES and MODULE_LAYOUT to each table
  const enhanceTable = (tableProps) => ({
    ...tableProps,
    styles: tableProps.styles || MODULE_STYLES,
    layout: tableProps.layout || MODULE_LAYOUT
  });

  return {
    mode: 'multi',
    tables: [
      {
        id: 'primary-metrics',
        tableProps: enhanceTable(table1Props)
      },
      {
        id: 'secondary-metrics',
        tableProps: enhanceTable(table2Props)
      },
      {
        id: 'coupled-pairs',
        tableProps: enhanceTable(table3Props),
        expandable: true
      }
    ]
  };
}

export default multivariableTable;
