// lib/dataPaths.js
// Purpose: Resolve dataset paths & metadata from data/registry/index.json

export async function getDataPaths(loadJson, registryLocation = '/data/registry/index.json') {
  // loadJson: function (pathOrUrl) => Promise<json>
  // registryLocation: path or URL to the registry file

  const registry = await loadJson(registryLocation);

  if (!registry?.datasets) {
    throw new Error('Registry missing datasets.');
  }

  const ordersInStore = registry.datasets.orders_in_store;
  if (!ordersInStore?.path) {
    throw new Error('orders_in_store path not set in registry.');
  }

  return {
    ordersInStore: ordersInStore.path,
    schemas: { ordersInStore: ordersInStore.schema },
    meta: {
      period: ordersInStore.period,
      source: ordersInStore.source,
      scope: ordersInStore.scope,
      generatedAt: registry.generated_at
    }
  };
}

// Node loader: read JSON from disk
export async function loadJsonNode(filePath) {
  const fs = await import('node:fs/promises');
  const text = await fs.readFile(filePath, 'utf8');
  return JSON.parse(text);
}

// Browser loader: fetch JSON from server
export async function loadJsonBrowser(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}