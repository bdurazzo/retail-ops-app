import React from 'react';

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

  if (!ViewComponent) {
    console.log('DataView: No component found for view:', currentView);
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded">
        <span className="text-gray-500">Unknown view: {currentView}</span>
      </div>
    );
  }

  // Special handling for DataTable view - convert table back to raw data and provide custom config
  if (currentView === 'data') {
    const rawData = table?.rows || [];
    const customConfig = {
      metricConfig: ['quantitySold'],  // Example: different metrics than main table
      customColumns: ['Product Name', 'UPC', 'Color', 'Size', 'Quantity Sold', 'Product Net'],
      customLabels: {
        'Product Name': 'Product',
        'UPC': 'UPC',
        'Color': 'Color',
        'Size': 'Size', 
        'Quantity Sold': 'Units',
        'Product Net': 'Revenue'
      }
    };

    console.log('DataView: Rendering DataTable with custom config:', customConfig);
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

  // Special handling for VariantGroup - pass raw data instead of processed table
  if (currentView === 'grouped') {
    console.log('DataView: Rendering VariantGroup with raw data:', rawData?.length, 'rows');
    
    // Create a mock table structure using raw data
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
