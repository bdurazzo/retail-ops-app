// 📄 data/keys.js
// ROLE: One place to define how we build join keys, with normalizers shared by loaders/metrics.

export function norm(str) {
  return String(str ?? "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/&#39;|’|‘/g, "'")
    .replace(/&quot;|"/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// For orders rows (newer schema): title|color|size
export function orderComposite(row) {
  return [row["Product Name"], row["Color"], row["Size"]].map(norm).join("|");
}

// Style-level key (works for archival where only Product Name exists)
export function styleKey(rowOrTitle) {
  const title = typeof rowOrTitle === "string" ? rowOrTitle : rowOrTitle["Product Name"];
  return norm(title);
}