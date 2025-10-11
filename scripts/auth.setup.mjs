import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

await page.goto('https://manager.filson.p.newstore.net/login');
console.log('Log in, then return to terminal and press Enter to save the session…');

process.stdin.once('data', async () => {
  await context.storageState({ path: 'storageState.json' });
  console.log('✅ Session saved to storageState.json');
  await browser.close();
  process.exit(0);
});