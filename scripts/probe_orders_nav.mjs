import { chromium } from 'playwright';

const USERNAME = process.env.NS_USERNAME || '';
const PASSWORD = process.env.NS_PASSWORD || '';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://manager.filson.p.newstore.net/sales/orders');
  await page.getByRole('link', { name: 'Login with my company email' }).click();
  if (!USERNAME || !PASSWORD) throw new Error('Set NS_USERNAME/NS_PASSWORD');
  await page.getByRole('textbox', { name: 'Enter your email, phone, or' }).fill(USERNAME);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('#i0118').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'Yes' }).click({ timeout: 10000 }).catch(() => {});

  await page.goto('https://manager.filson.p.newstore.net/sales/orders?page=0&pageSize=10&sortBy=placedAt&dir=desc');

  // Example interactions (selectors may need to be updated per UI changes)
  // await page.locator('a').filter({ hasText: '50003' }).click();
  // await page.getByRole('link', { name: /FSP\d+/ }).first().click();
  // await page.getByRole('button', { name: '←' }).click();
  // await page.getByRole('button', { name: 'Next →' }).click();

  await context.storageState({ path: 'storageState.json' });
  await context.close();
  await browser.close();
})();
