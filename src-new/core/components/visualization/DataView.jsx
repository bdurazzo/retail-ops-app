import React from 'react';
import { COLUMN_LABELS } from '../../config/tableConfig';

export default function DataView({ 
  currentView, 
  components, 
  table,
  rawData,
  placeholderRows, 
  placeholderCols,
  ...otherProps 
}) {
  console.log('DataView render:', { currentView, table, components: Object.keys(components) });
  
  // Get the component to render based on current view
  const ViewComponent = components[currentView];
  console.log('DataView ViewComponent for', currentView, ':', ViewComponent?.name || ViewComponent);

  if (!ViewComponent) {
    console.log('DataView: No component found for view:', currentView);
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded">
        <span className="text-gray-500">Unknown view: {currentView}</span>
      </div>
    );
  }

  // Special handling for Line Items view - convert table back to raw data and provide custom config
  if (currentView === 'line_items') {
    const rawData = table?.rows || [];
    const customConfig = {
      metricConfig: ['quantity'],  // Focus on line item metrics
      customColumns: ['product_name', 'upc', 'color', 'size', 'quantity', 'discounted_price'],
      customLabels: COLUMN_LABELS  // Use shared labels
    };

    console.log('DataView: Rendering Line Items with custom config:', customConfig);
    return (
      <div className="h-full">
        <ViewComponent
          data={rawData}
          placeholderRows={placeholderRows}
          placeholderCols={placeholderCols}
          height="100%"
          {...customConfig}
          {...otherProps}
        />
      </div>
    );
  }

  // Special handling for OrderGroup - pass raw data instead of processed table
  if (currentView === 'orders') {
    console.log('DataView: Rendering OrderGroup with raw data:', rawData?.length, 'rows');
    
    // Create a mock table structure using raw data for OrderGroup
    const rawTable = rawData ? {
      columnKeys: Object.keys(rawData[0] || {}),
      rows: rawData,
      totals: {},
      rowCount: rawData.length,
      columnCount: Object.keys(rawData[0] || {}).length
    } : null;
    
    return (
      <div className="h-full">
        <ViewComponent
          table={rawTable}
          placeholderRows={placeholderRows}
          placeholderCols={placeholderCols}
          height="100%"
          {...otherProps}
        />
      </div>
    );
  }

  // Special handling for ProductGroup - pass raw data instead of processed table
  if (currentView === 'grouped') {
    console.log('DataView: Rendering ProductGroup with raw data:', rawData?.length, 'rows');
    console.log('DataView: ProductGroup productFilter:', otherProps.productFilter);
    console.log('DataView: ProductGroup selectedProducts:', otherProps.selectedProducts);
    
    // Create a mock table structure using raw data
    const rawTable = rawData ? {
      columnKeys: Object.keys(rawData[0] || {}),
      rows: rawData,
      totals: {},
      rowCount: rawData.length,
      columnCount: Object.keys(rawData[0] || {}).length
    } : null;
    
    return (
      <div className="h-full flex flex-col">
        <ViewComponent
          table={rawTable}
          placeholderRows={placeholderRows}
          placeholderCols={placeholderCols}
          height="100%"
          {...otherProps}
        />
      </div>
    );
  }

  console.log('DataView: Rendering component for view:', currentView);
  return (
    <div className="h-full">
      <ViewComponent
        table={table}
        placeholderRows={placeholderRows}
        placeholderCols={placeholderCols}
        height="100%"
        {...otherProps}
      />
    </div>
  );
}
