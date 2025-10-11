export function totalRevenue(rows) {
  if (!rows || !Array.isArray(rows)) return 0;
  return rows.reduce((sum, row) => {
    const revenue = Number(row['Product Net']) || 0;
    return sum + revenue;
  }, 0);
}