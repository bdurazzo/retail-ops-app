// Attach Rate KPI - measures how often customers buy multiple items in a single order

export function attachRate(rows) {
  return {
    requiresGrouping: false,
    aggregateOnly: false,
    total: calculateOverallAttachRate(rows),
    byProduct: calculateAttachRateByProduct(rows),
    byDate: calculateAttachRateByDate(rows)
  };
}

function calculateOverallAttachRate(rows) {
  // Group by order to find orders with multiple items
  const orderGroups = groupByOrder(rows);
  const ordersWithAttachments = Object.values(orderGroups).filter(orderItems => orderItems.length > 1).length;
  const totalOrders = Object.keys(orderGroups).length;
  
  return totalOrders > 0 ? (ordersWithAttachments / totalOrders) * 100 : 0;
}

function calculateAttachRateByProduct(rows) {
  const productAttachRates = {};
  
  // Group by product to see how often each product appears with other items
  const productGroups = {};
  rows.forEach(row => {
    const productName = row["Product Name"];
    if (!productGroups[productName]) {
      productGroups[productName] = [];
    }
    productGroups[productName].push(row);
  });
  
  // For each product, calculate how often it appears in multi-item orders
  Object.keys(productGroups).forEach(productName => {
    const productRows = productGroups[productName];
    const orderGroups = groupByOrder(productRows);
    
    let productInMultiItemOrders = 0;
    let totalProductOrders = 0;
    
    Object.values(orderGroups).forEach(orderItems => {
      // Check if this order (that contains our product) has multiple items total
      const orderId = orderItems[0]["Order ID"];
      const allItemsInOrder = rows.filter(r => r["Order ID"] === orderId);
      
      totalProductOrders++;
      if (allItemsInOrder.length > 1) {
        productInMultiItemOrders++;
      }
    });
    
    productAttachRates[productName] = totalProductOrders > 0 
      ? (productInMultiItemOrders / totalProductOrders) * 100 
      : 0;
  });
  
  return productAttachRates;
}

function calculateAttachRateByDate(rows) {
  const dateGroups = {};
  
  // Group by date
  rows.forEach(row => {
    const date = row.order_datetime_normalized?.slice(0, 10);
    if (date) {
      if (!dateGroups[date]) {
        dateGroups[date] = [];
      }
      dateGroups[date].push(row);
    }
  });
  
  // Calculate attach rate for each date
  const dateAttachRates = {};
  Object.keys(dateGroups).forEach(date => {
    const dayRows = dateGroups[date];
    const orderGroups = groupByOrder(dayRows);
    const ordersWithAttachments = Object.values(orderGroups).filter(orderItems => orderItems.length > 1).length;
    const totalOrders = Object.keys(orderGroups).length;
    
    dateAttachRates[date] = totalOrders > 0 ? (ordersWithAttachments / totalOrders) * 100 : 0;
  });
  
  return dateAttachRates;
}

function groupByOrder(rows) {
  const orderGroups = {};
  rows.forEach(row => {
    const orderId = row["Order ID"];
    if (orderId) {
      if (!orderGroups[orderId]) {
        orderGroups[orderId] = [];
      }
      orderGroups[orderId].push(row);
    }
  });
  return orderGroups;
}