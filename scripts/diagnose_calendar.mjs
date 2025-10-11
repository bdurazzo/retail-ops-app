import { chromium } from 'playwright';

const BASE_URL = 'https://manager.filson.p.newstore.net/sales/orders';
const STORAGE_STATE_PATH = 'storageState.json';
const USERNAME = process.env.NS_USERNAME || 'ben.durazzo@filson.com';
const PASSWORD = process.env.NS_PASSWORD || 'BDbd6464555@';

async function auth(page, context) {
  try {
    await page.goto(BASE_URL, { timeout: 60000 });
    await page.waitForSelector('[role="grid"]', { timeout: 10000 });
    return true;
  } catch {}
  try {
    await page.goto(BASE_URL, { timeout: 60000 });
    await page.getByRole('link', { name: 'Login with my company email' }).click();
    await page.getByRole('textbox', { name: 'Enter your email, phone, or' }).fill(USERNAME);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('textbox', { name: /Enter the password for/ }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('button', { name: 'Yes' }).click({ timeout: 10000 }).catch(() => {});
    await page.waitForSelector('[role="grid"]', { timeout: 30000 });
    await context.storageState({ path: STORAGE_STATE_PATH });
    return true;
  } catch {
    return false;
  }
}

async function moveMouseTo(page, locator) {
  try { await locator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {}); } catch {}
  try {
    const box = await locator.boundingBox({ timeout: 2000 });
    if (!box) return false;
    const cx = Math.round(box.x + box.width / 2);
    const cy = Math.round(box.y + Math.min(box.height / 2, 300));
    await page.mouse.move(cx - 2, cy - 2);
    await page.mouse.move(cx, cy);
    return true;
  } catch { return false; }
}

async function openDatePopover(page) {
  const triggers = [
    `[role="columnheader"]:has-text("Date/Time") .bp3-popover-target span[tabindex="0"]`,
    `[role="columnheader"]:has-text("Date/Time") .bp3-popover-target span`,
    `[role="columnheader"]:has-text("Date/Time") .bp3-popover-wrapper`,
    `[role="columnheader"]:has-text("Date/Time") .bp3-popover-target`,
    `[role="columnheader"]:has-text("Date/Time")`
  ];
  for (const sel of triggers) {
    const el = page.locator(sel).first();
    if (await el.count()) {
      await moveMouseTo(page, el);
      try { await el.hover({ force: true }); } catch {}
      try {
        await page.waitForSelector('.bp3-popover .DayPicker, .bp3-popover .bp3-datepicker, .DayPicker', { timeout: 2000 });
        return true;
      } catch {}
      try { await el.click({ force: true }); } catch {}
      try {
        await page.waitForSelector('.bp3-popover .DayPicker, .bp3-popover .bp3-datepicker, .DayPicker', { timeout: 2500 });
        return true;
      } catch {}
      // Fallback: hover header cell, then try clicking any inner filter/trigger control
      try {
        const headerCell = page.getByRole('columnheader', { name: /Date\/?Time/i }).first();
        if (await headerCell.count()) {
          await moveMouseTo(page, headerCell);
          await headerCell.hover().catch(()=>{});
          const innerTriggers = headerCell.locator('.bp3-popover-target [tabindex="0"], .bp3-popover-target, .bp3-popover-wrapper, [aria-haspopup="listbox"], button');
          const innerCount = await innerTriggers.count();
          for (let i=0;i<innerCount;i++){
            const t = innerTriggers.nth(i);
            try { await t.click({ force: true }); } catch {}
            try {
              await page.waitForSelector('.bp3-popover .DayPicker, .bp3-popover .bp3-datepicker, .DayPicker', { timeout: 2000 });
              return true;
            } catch {}
          }
        }
      } catch {}
    }
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
  const page = await context.newPage();

  const ok = await auth(page, context);
  if (!ok) { console.error('AUTH_FAIL'); process.exit(1); }

  // Open date popover
  const opened = await openDatePopover(page);
  if (!opened) {
    const headers = await page.$$eval('[role="columnheader"]', els => els.map(e => (e.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean));
    console.error('POPOVER_FAIL');
    console.error('HEADERS:', JSON.stringify(headers));
    await page.screenshot({ path: `calendar_diag_${Date.now()}_headers.png`, fullPage: true }).catch(()=>{});
    await browser.close();
    process.exit(1);
  }

  // Gather info
  const info = await page.evaluate(() => {
    const norm = (s) => (s||'').replace(/\s+/g,' ').trim();
    const caption = document.querySelector('.bp3-popover .DayPicker-Caption, .DayPicker-Caption');
    const captionText = norm(caption?.textContent || '');
    const monthSelect = document.querySelector('.bp3-popover select[aria-label*="month" i], .bp3-popover select[name*="month" i]') ? true : false;
    const yearSelect = document.querySelector('.bp3-popover select[aria-label*="year" i], .bp3-popover select[name*="year" i]') ? true : false;
    const prevBtn = !!document.querySelector('.bp3-popover .DayPicker-NavButton--prev, .bp3-popover button[aria-label*="Previous"], .bp3-popover .bp3-icon-chevron-left');
    const nextBtn = !!document.querySelector('.bp3-popover .DayPicker-NavButton--next, .bp3-popover button[aria-label*="Next"], .bp3-popover .bp3-icon-chevron-right');
    const enabledCells = Array.from(document.querySelectorAll('.bp3-popover .DayPicker-Day:not(.DayPicker-Day--disabled):not(.DayPicker-Day--outside), .bp3-popover [role="gridcell"]:not([aria-disabled="true"])'))
      .map(el => norm(el.textContent || ''));
    const sampleCells = enabledCells.slice(0, 10);
    const applyBtn = Array.from(document.querySelectorAll('.bp3-popover button'))
      .some(b => /^(Apply|Done)$/i.test((b.textContent||'').trim()));
    return { captionText, monthSelect, yearSelect, prevBtn, nextBtn, sampleCells, applyBtn };
  });

  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: `calendar_diag_${Date.now()}.png` });
  await browser.close();
})();
