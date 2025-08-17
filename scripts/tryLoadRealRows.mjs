// scripts/tryLoadRealRows.mjs
// Goal: Resolve the July CSV path from the registry and print the first 5 rows (Node-only).

import path from "node:path";
import fs from "node:fs/promises";
import Papa from "papaparse";
import { getDataPaths, loadJsonNode } from "../lib/dataPaths.js";

(async () => {
  // 1) Read registry from disk (Node) and get the CSV path + metadata
  const { ordersInStore, meta } =
    await getDataPaths(loadJsonNode, "data/registry/index.json");

  // 2) Build an absolute path to the CSV (since the registry path is repo-relative)
  const csvAbs = path.join(process.cwd(), ordersInStore);

  // 3) Read and parse CSV
  const csvText = await fs.readFile(csvAbs, "utf8");
  const parsed = Papa.parse(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  // 4) Basic output
  console.log(`Period: ${meta.period}`);
  console.log(`Rows: ${parsed.data.length}`);
  console.log("First 5 rows:", parsed.data.slice(0, 5));
})();