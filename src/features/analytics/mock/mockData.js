export const mockAttachRateTable = [
  { product: "Prospector Hoodie", attachCount: 73, totalRevenue: "$944", attachRate: "61%", avgAOV: "$128" },
  { product: "Pioneer Tee", attachCount: 45, totalRevenue: "$612", attachRate: "38%", avgAOV: "$117" },
];

export const mockAttachRateChart = {
  labels: ["Prospector Hoodie", "Pioneer Tee"],
  datasets: [
    {
      label: "Attach Count",
      data: [73, 45],
    }
  ]
};

export const mockAOVTable = [
  { product: "Tin Cruiser", AOV: "$132" },
  { product: "Short Lined Cruiser", AOV: "$125" },
];

export const mockAOVChart = {
  labels: ["Tin Cruiser", "Short Lined Cruiser"],
  datasets: [
    {
      label: "Average Order Value",
      data: [132, 125]
    }
  ]
};

export const mockUPTTable = [
  { product: "Tin Cruiser", UPT: 2.3 },
  { product: "Field Flannel", UPT: 1.8 },
];

export const mockUPTChart = {
  labels: ["Tin Cruiser", "Field Flannel"],
  datasets: [
    {
      label: "Units Per Transaction",
      data: [2.3, 1.8]
    }
  ]
};

export const mockOrderVolumeTable = [
  { week: "2025-04-01", orders: 23 },
  { week: "2025-04-08", orders: 31 },
  { week: "2025-04-15", orders: 27 },
  { week: "2025-04-22", orders: 35 },
];

export const mockOrderVolumeChart = {
  labels: ["2025-04-01", "2025-04-08", "2025-04-15", "2025-04-22"],
  datasets: [
    {
      label: "Weekly Order Volume",
      data: [23, 31, 27, 35]
    }
  ]
};
