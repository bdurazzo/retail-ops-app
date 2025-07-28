import orderHistory from '../data/order_history.json';
import productCatalog from '../data/product_catalog.json';
import Fuse from "fuse.js";

const intentMatchers = [
  { type: "attach_rate", keywords: ["attach rate", "paired with", "bundle", "also buy", "bought with", "what else"] },
  { type: "aov", keywords: ["aov", "average order value", "avg spend", "how much do they spend", "total value", "average spend"] },
  { type: "upt", keywords: ["upt", "units per transaction", "basket size", "how many items", "items per order"] },
  { type: "order_volume", keywords: ["order volume", "orders per week", "how many orders", "weekly sales", "order count"] }
];

function extractProduct(query) {
  const fuse = new Fuse(productCatalog, {
    keys: ["sku", "name"],
    includeScore: true,
    threshold: 0.4,
  });

  const results = fuse.search(query);
  if (results.length === 0) {
    console.warn("❌ No product matched for:", query);
    return null;
  }

  console.log("🎯 Top 5 product matches:");
  results.slice(0, 5).forEach(r =>
    console.log(`→ ${r.item.name} (${r.item.sku}) - Score: ${r.score.toFixed(2)}`)
  );

  return results[0].item;
}


function extractTimeRange(query) {
  if (query.includes("Q2 2025")) return "2025Q2";
  if (query.includes("April 2025")) return "2025-04";
  if (query.includes("2025")) return "2025";
  return null;
}

function extractPriceFloor(query) {
  const match = query.match(/\$([0-9]+)/);
  return match ? parseInt(match[1]) : null;
}

function groupOrdersById(orders) {
  const grouped = {};

  for (const row of orders) {
    const { order_id, sku, order_date, line_total } = row;
    if (!grouped[order_id]) {
      grouped[order_id] = {
        order_id,
        order_date,
        products: [],
        total: 0,
        unit_count: 0,
      };
    }

    grouped[order_id].products.push(sku);
    grouped[order_id].total += parseFloat(line_total || 0);
    grouped[order_id].unit_count += 1;
  }

  return Object.values(grouped);
}

function analyzeAttachRate(primarySku, timeRange) {
  const groupedOrders = groupOrdersById(orderHistory);

  const filtered = groupedOrders.filter(order =>
    order.products.includes(primarySku) &&
    (timeRange === null || order.order_date.startsWith(timeRange.split('Q')[0]))
  );

  const attachmentCounts = {};
  let totalPrimaryOrders = 0;
  let combinedRevenue = 0;

  for (const order of filtered) {
    totalPrimaryOrders++;
    combinedRevenue += order.total;

    for (const sku of order.products) {
      if (sku === primarySku) continue;
      attachmentCounts[sku] = (attachmentCounts[sku] || 0) + 1;
    }
  }

  const attachArray = Object.entries(attachmentCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([sku, count]) => ({
      product: sku,
      attachCount: count,
    }));

  return {
    tableData: attachArray,
    chartData: {
      labels: attachArray.map(a => a.product),
      datasets: [
        {
          label: "Attach Count",
          data: attachArray.map(a => a.attachCount),
        }
      ]
    },
    kpi: {
      "Total Attachments": attachArray.reduce((sum, row) => sum + row.attachCount, 0),
      "Unique SKUs Paired": attachArray.length,
      "Orders with Primary": totalPrimaryOrders,
      "Revenue from Orders": `$${combinedRevenue.toFixed(0)}`
    }
  };
}

function analyzeAOV(parsedProduct, timeRange) {
  const grouped = {};
  for (const row of orderHistory) {
    const id = row.order_id;
    if (!grouped[id]) grouped[id] = [];
    grouped[id].push(row);
  }

  const relevantOrders = Object.values(grouped).filter(order =>
    order.some(item => item.sku === parsedProduct) &&
    (timeRange === null || order[0].order_date.startsWith(timeRange.split("Q")[0]))
  );

  const orderTotals = relevantOrders.map(order =>
    order.reduce((sum, item) => sum + (item.price || 0), 0)
  );

  const avg = orderTotals.length > 0
    ? (orderTotals.reduce((a, b) => a + b, 0) / orderTotals.length).toFixed(2)
    : "0.00";

  return {
    tableData: [
      { Metric: "Total Orders with Product", Value: relevantOrders.length },
      { Metric: "Avg Order Value", Value: `$${avg}` }
    ],
    chartData: {
      labels: ["AOV (Product-specific)"],
      datasets: [{
        label: "Avg Order Value",
        data: [parseFloat(avg)]
      }]
    },
    kpi: {
      "Avg AOV": `$${avg}`,
      "Orders Filtered": relevantOrders.length
    }
  };
}

function analyzeUPT(timeRange) {
  const groupedOrders = groupOrdersById(orderHistory);
  const filtered = groupedOrders.filter(order =>
    timeRange === null || order.order_date.startsWith(timeRange.split('Q')[0])
  );

  const data = filtered.map(order => ({
    order_id: order.order_id,
    upt: order.unit_count
  }));

  const average = filtered.reduce((sum, o) => sum + o.unit_count, 0) / (filtered.length || 1);

  return {
    tableData: data,
    chartData: {
      labels: data.map(d => d.order_id),
      datasets: [{
        label: "UPT",
        data: data.map(d => d.upt),
      }]
    },
    kpi: {
      "Avg UPT": average.toFixed(2),
      "Total Orders": filtered.length
    }
  };
}

function analyzeOrderVolume(timeRange) {
  const groupedOrders = groupOrdersById(orderHistory);
  const filtered = groupedOrders.filter(order =>
    timeRange === null || order.order_date.startsWith(timeRange.split('Q')[0])
  );

  const volumeByWeek = {};
  for (const order of filtered) {
    const week = order.order_date.slice(0, 7);
    volumeByWeek[week] = (volumeByWeek[week] || 0) + 1;
  }

  const data = Object.entries(volumeByWeek).map(([week, count]) => ({
    week,
    orders: count
  }));

  return {
    tableData: data,
    chartData: {
      labels: data.map(d => d.week),
      datasets: [{
        label: "Order Volume",
        data: data.map(d => d.orders),
      }]
    },
    kpi: {
      "Total Weeks": data.length,
      "Total Orders": filtered.length
    }
  };
}

export function simulateGPTResponse(queryText) {
  const query = queryText.toLowerCase();

  const intent = intentMatchers.find(({ keywords }) =>
    keywords.some(keyword => query.includes(keyword.toLowerCase()))
  )?.type || "unknown";

  if (intent === "unknown") {
    console.warn("❌ No matching intent found for query:", queryText);
  } else {
    console.log("✅ Matched intent:", intent);
  }

  const matchedProduct = extractProduct(queryText);
  let parsedProduct = null;
  let parsedProductName = null;

  if (matchedProduct && typeof matchedProduct === "object") {
    parsedProduct = matchedProduct.sku || null;
    parsedProductName = matchedProduct.name || null;
  }

  const parsedTimeRange = extractTimeRange(queryText);
  const priceFloor = extractPriceFloor(queryText);

  let tableData = [];
  let chartData = {};
  let kpi = {};

  switch (intent) {
    case "attach_rate": {
      const result = analyzeAttachRate(parsedProduct, parsedTimeRange);
      tableData = result.tableData;
      chartData = result.chartData;
      kpi = result.kpi;
      break;
    }
    case "aov": {
      const result = analyzeAOV(parsedProduct, parsedTimeRange);
      tableData = result.tableData;
      chartData = result.chartData;
      kpi = result.kpi;
      break;
    }
    case "upt": {
      const result = analyzeUPT(parsedTimeRange);
      tableData = result.tableData;
      chartData = result.chartData;
      kpi = result.kpi;
      break;
    }
    case "order_volume": {
      const result = analyzeOrderVolume(parsedTimeRange);
      tableData = result.tableData;
      chartData = result.chartData;
      kpi = result.kpi;
      break;
    }
    default:
      tableData = [{ message: "Query not recognized or not implemented yet." }];
      chartData = null;
      kpi = null;
      break;
  }
  console.log("Parsed Product:", parsedProduct);
  console.log("Parsed Time Range:", parsedTimeRange);
  console.log("Returning Table Data:", tableData);
  console.log("Returning Chart Data:", chartData);
  
  return {
    intentType: intent || "unknown",
    parsedProduct: parsedProduct || "N/A",
    parsedProductName: parsedProductName || "N/A",
    parsedTimeRange: parsedTimeRange || "N/A",
    priceFloor: priceFloor || null,
    tableData: Array.isArray(tableData) ? tableData : [],
    chartData: chartData || { labels: [], datasets: [] },
    kpi: kpi || {}
  };
}
