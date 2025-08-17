import { getDataPaths, loadJsonNode } from '../lib/dataPaths.js';

async function run() {
  const { ordersInStore, meta } =
    await getDataPaths(loadJsonNode, 'data/registry/index.json');

  console.log('Orders CSV file path:', ordersInStore);
  console.log('Period:', meta.period);
  console.log('Generated at:', meta.generatedAt);
}

run();