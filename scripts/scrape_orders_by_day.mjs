import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Configuration
const BASE_URL = 'https://manager.filson.p.newstore.net/sales/orders?page=0&pageSize=10&sortBy=placedAt&dir=desc';
const USERNAME = process.env.NS_USERNAME || '';
const PASSWORD = process.env.NS_PASSWORD || '';
const DEBUG = process.env.DEBUG === 'true';
const SCREENSHOT = process.env.SCREENSHOT === 'true';
const MAX_RETRIES = 3;
const STORAGE_STATE_PATH = 'storageState.json';
// Default export root
const EXPORTS_DIR = process.env.EXPORTS_DIR || 'orders_exports';
const FORCE_REBUILD = process.env.FORCE_REBUILD === 'true';
const FORCE_REBUILD_DATE = process.env.FORCE_REBUILD_DATE || '';
const HEADLESS = process.env.HEADLESS === 'false' ? false : true;
const SLOWMO = Number(process.env.SLOWMO || 0);
const MAX_MONTHS = Number(process.env.MAX_MONTHS || 60);
// Wide desktop viewport so all grid columns (e.g., Channel) render
const VIEWPORT = {
  width: Number(process.env.VIEWPORT_WIDTH || 1680),
  height: Number(process.env.VIEWPORT_HEIGHT || 1050)
};
const SAVE_STATE_ONLY = process.env.SAVE_STATE_ONLY === 'true';

async function waitForEnter(prompt = 'Press Enter here to save and exit…') {
  // Require an interactive TTY so we can read Enter
  if (!process.stdin.isTTY) {
    console.log('ℹ️ [wait] SAVE_STATE_ONLY needs a real terminal (stdin TTY). Window will stay open indefinitely.');
    // Never resolve; user can Ctrl+C to abort (no save in that case)
    return new Promise(() => {});
  }
  try {
    const { createInterface } = await import('node:readline/promises');
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    await rl.question(`${prompt}\n`);
    rl.close();
  } catch (e) {
    console.log(`ℹ️ [wait] Readline error (${e.message}). Waiting indefinitely…`);
    return new Promise(() => {});
  }
}

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = { 'info': 'ℹ️', 'debug': '🔍', 'error': '❌', 'success': '✅', 'warning': '⚠️' }[level] || 'ℹ️';
  if (level === 'debug' && !DEBUG) return;
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function safeText(locator) {
  try {
    const text = await locator.textContent({ timeout: 1000 });
    return (text || '').trim();
  } catch {
    return '';
  }
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Move the real mouse to the center of a locator before hover to ensure popovers open
async function moveMouseTo(page, locator, label = 'target') {
  try {
    await locator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
  } catch {}
  try {
    const box = await locator.boundingBox({ timeout: 2000 });
    if (!box) return false;
    const cx = Math.round(box.x + box.width / 2);
    const cy = Math.round(box.y + Math.min(box.height / 2, 300));
    await page.mouse.move(cx - 2, cy - 2);
    await page.mouse.move(cx, cy);
    log(`Moved mouse to ${label} at (${cx},${cy})`, 'debug');
    return true;
  } catch {
    return false;
  }
}

function arrayToCSV(data) {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

function parseDateFromOrderTable(dateTimeStr) {
  try {
    const datePart = dateTimeStr.split(',').slice(0, 2).join(',').trim();
    const date = new Date(datePart);
    if (isNaN(date)) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

function dailyFilesExist(dateStr) {
  if (FORCE_REBUILD || (FORCE_REBUILD_DATE && FORCE_REBUILD_DATE === dateStr)) {
    log(`Forcing rebuild for ${dateStr}`, 'debug');
    return false;
  }
  const [year, month] = dateStr.split('-');
  const monthDir = path.join(EXPORTS_DIR, year, `${year}-${month}`);
  const ordersFile = path.join(monthDir, `${dateStr}_orders.csv`);
  const lineItemsFile = path.join(monthDir, `${dateStr}_line-items.csv`);

  const ordersExists = fs.existsSync(ordersFile);
  const itemsExists = fs.existsSync(lineItemsFile);
  const ordersSize = ordersExists ? (fs.statSync(ordersFile).size || 0) : 0;
  const itemsSize = itemsExists ? (fs.statSync(lineItemsFile).size || 0) : 0;

  const bothExist = ordersExists && itemsExists && ordersSize > 0 && itemsSize > 0;
  if (DEBUG) {
    log(`Existence check for ${dateStr}: orders=${ordersExists} (${ordersSize}b), items=${itemsExists} (${itemsSize}b) at ${monthDir}`, 'debug');
  }
  return bothExist;
}

function saveDailyFiles(dateStr, orders, lineItems) {
  const [year, month] = dateStr.split('-');
  const monthDir = path.join(EXPORTS_DIR, year, `${year}-${month}`);
  const dayDir = path.join(monthDir, dateStr);
  ensureDirectoryExists(monthDir);
  ensureDirectoryExists(dayDir);
  if (orders.length > 0) {
    const ordersFile = path.join(monthDir, `${dateStr}_orders.csv`);
    const ordersCSV = arrayToCSV(orders);
    fs.writeFileSync(ordersFile, ordersCSV);
    log(`Saved ${orders.length} orders to ${ordersFile}`);
    const perDayOrders = path.join(dayDir, `${dateStr}_orders.csv`);
    fs.writeFileSync(perDayOrders, ordersCSV);
    log(`Saved per-day orders to ${perDayOrders}`, 'debug');
  }
  if (lineItems.length > 0) {
    const lineItemsFile = path.join(monthDir, `${dateStr}_line-items.csv`);
    const lineItemsCSV = arrayToCSV(lineItems);
    fs.writeFileSync(lineItemsFile, lineItemsCSV);
    log(`Saved ${lineItems.length} line items to ${lineItemsFile}`);
    const perDayItems = path.join(dayDir, `${dateStr}_line-items.csv`);
    fs.writeFileSync(perDayItems, lineItemsCSV);
    log(`Saved per-day line items to ${perDayItems}`, 'debug');
  }
}

async function authenticateWithFallback(page, context) {
  try {
    await page.goto(BASE_URL);
    await page.waitForSelector('[role="grid"]', { timeout: 10000 });
    log('Using existing session from storageState');
    return true;
  } catch {
    log('Session expired or invalid, performing fresh login');
    try {
      await page.goto(BASE_URL);
      await page.getByRole('link', { name: 'Login with my company email' }).click();
      if (!USERNAME || !PASSWORD) {
        throw new Error('Missing NS_USERNAME/NS_PASSWORD env vars for interactive login');
      }
      await page.getByRole('textbox', { name: 'Enter your email, phone, or' }).fill(USERNAME);
      await page.getByRole('button', { name: 'Next' }).click();
      await page.getByRole('textbox', { name: /Enter the password for/ }).fill(PASSWORD);
      await page.getByRole('button', { name: 'Sign in' }).click();
      try {
        await page.getByRole('button', { name: 'Yes' }).click({ timeout: 10000 });
      } catch {
        log('No 2FA prompt found, continuing...');
      }
      await page.waitForSelector('[role="grid"]', { timeout: 30000 });
      await context.storageState({ path: STORAGE_STATE_PATH });
      log('Login successful, saved new session state');
      return true;
    } catch (error) {
      log(`Login failed: ${error.message}`, 'error');
      return false;
    }
  }
}

async function setPopoverFilter(page, columnName, targetValue) {
  try {
    log(`Setting ${columnName} filter to: ${targetValue}`, 'debug');
    // Nudge horizontal scroll containers so off-screen headers render
    try {
      await page.evaluate(() => {
        const sels = [
          '.bp3-table-container',
          '.bp3-table-header',
          '.ant-table-container',
          '.ant-table-content',
          '[role="table"]',
          '[role="grid"]'
        ];
        const nodes = Array.from(document.querySelectorAll(sels.join(',')));
        for (const n of nodes) {
          // Scroll to end and back to force header virtualization to mount
          if (n && typeof n.scrollLeft === 'number' && n.scrollWidth > n.clientWidth) {
            n.scrollLeft = n.scrollWidth;
            // eslint-disable-next-line no-self-assign
            n.scrollLeft = n.scrollLeft; // trigger layout
          }
        }
      });
      await page.waitForTimeout(150);
    } catch {}
    const columnTriggers = [
      page.locator(`[role="columnheader"]:has-text("${columnName}") .bp3-popover-target span[tabindex="0"]`),
      page.locator(`[role="columnheader"]:has-text("${columnName}") .bp3-popover-target span`),
      page.locator(`[role="columnheader"]:has-text("${columnName}") .bp3-popover-wrapper`),
      page.locator(`[role="columnheader"]:has-text("${columnName}") .bp3-popover-target`),
      page.locator(`[role="columnheader"]:has-text("${columnName}")`)
    ];

    let popoverOpened = false;
    for (const trigger of columnTriggers) {
      try {
        if (await trigger.count() > 0 && await trigger.isVisible()) {
          log(`Found ${columnName} column, moving cursor + hover…`, 'debug');
          await moveMouseTo(page, trigger, `${columnName} header`);
          await page.waitForTimeout(120);
          try {
            await trigger.hover({ force: true });
          } catch {}
          try {
            await page.waitForSelector('.bp3-popover', { timeout: 1200 });
            popoverOpened = true;
            log(`${columnName} popover opened (hover)`, 'debug');
            break;
          } catch (e) {
            log(`Hover didn't open ${columnName}. Trying click…`, 'debug');
            try {
              await trigger.click({ force: true });
              await page.waitForSelector('.bp3-popover', { timeout: 1500 });
              popoverOpened = true;
              log(`${columnName} popover opened (click)`, 'debug');
              break;
            } catch {}
          }
        }
      } catch (e) {
        continue;
      }
    }

    if (!popoverOpened) {
      log(`Could not open popover for ${columnName}`, 'warning');
      return false;
    }

    // Minimal selection path identical to other filters
    const valueSelectors = [
      page.locator('.bp3-popover').getByText(targetValue, { exact: true }),
      page.locator('.bp3-popover').locator(`text=${targetValue}`),
      page.locator('.bp3-popover').locator(`input[value="${targetValue}"]`),
      page.locator('.bp3-popover').locator(`label:has-text("${targetValue}")`),
      page.locator('.bp3-popover').locator(`[role="option"]:has-text("${targetValue}")`),
      page.locator('.bp3-popover').locator(`a:has-text("${targetValue}"), button:has-text("${targetValue}"), div:has-text("${targetValue}")`)
    ];

    let valueSelected = false;
    for (const selector of valueSelectors) {
      try {
        if (await selector.count() > 0 && await selector.isVisible()) {
          await selector.first().click();
          await page.waitForTimeout(500);
          valueSelected = true;
          log(`Selected ${targetValue} in ${columnName} filter`, 'debug');
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!valueSelected) {
      log(`Could not find/select "${targetValue}" in ${columnName} popover`, 'warning');
      return false;
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    log(`Successfully set ${columnName} filter to ${targetValue}`, 'success');
    return true;
  } catch (error) {
    log(`Error setting ${columnName} filter: ${error.message}`, 'error');
    return false;
  }
}

async function setupFilters(page) {
  try {
    // Be flexible on grid readiness to avoid timing issues
    await page.waitForSelector('[role="grid"], [role="rowgroup"] [role="row"], table', { timeout: 15000 });
    await page.waitForTimeout(2000);
    log('Setting up basic table options...', 'debug');

    const rowsPerPageSelectors = [
      page.getByLabel('rows per page'),
      page.locator('select[aria-label*="rows"]'),
      page.locator('.rows-per-page select'),
      page.locator('[data-testid*="pagination"] select')
    ];
    for (const selector of rowsPerPageSelectors) {
      try {
        if (await selector.count() > 0 && await selector.isVisible()) {
          await selector.selectOption('100');
          log('Set rows per page to 100', 'debug');
          break;
        }
      } catch (e) {
        continue;
      }
    }
    log('Filters setup complete');
  } catch (error) {
    log(`Error setting up filters: ${error.message}`, 'error');
  }
}

// Merge URL query params into the current page URL and navigate
async function applyUrlFilters(page, params = {}) {
  try {
    const current = page.url();
    const u = new URL(current);
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      u.searchParams.set(k, String(v));
    }
    const target = u.toString();
    if (target !== current) {
      await page.goto(target, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);
      log(`Applied URL filters: ${Object.keys(params).join(', ')}`, 'debug');
    }
  } catch (e) {
    log(`applyUrlFilters error: ${e.message}`, 'debug');
  }
}

// Ensure Date/Time column is sorted descending (newest first)
async function ensureDateSortDesc(page) {
  try {
    const header = page.getByRole('columnheader', { name: /Date\/?Time/i }).first();
    await header.scrollIntoViewIfNeeded().catch(()=>{});
    // Try to detect current sort via aria-sort or icon classes
    const isDesc = async () => {
      try {
        const sort = await header.getAttribute('aria-sort');
        if (sort && /desc/i.test(sort)) return true;
      } catch {}
      try {
        const descIcon = header.locator('.bp3-icon-sort-desc, .sort-desc, .ant-table-column-sorter-down[aria-disabled="false"]');
        if (await descIcon.count()) return true;
      } catch {}
      return false;
    };
    // Click up to 3 times to land on descending
    for (let i = 0; i < 3; i++) {
      if (await isDesc()) {
        log('Date/Time sorted descending', 'debug');
        return true;
      }
      await header.click({ force: true });
      await page.waitForTimeout(200);
    }
  } catch (e) {
    log(`ensureDateSortDesc failed: ${e.message}`, 'debug');
  }
  return false;
}

// Attempt to reset pagination to the first page after a filter/range change
async function goToFirstPage(page) {
  // Brute-force: click Prev until it's disabled; then try clicking page "1".
  const prevSelectors = [
    // Ant Design
    'li.ant-pagination-prev button',
    // Generic/ARIA
    'button[aria-label*="prev" i]',
    'button[aria-label*="previous" i]',
    // Text-based
    'button:has-text("Prev")',
    'button:has-text("Previous")',
    // Containers
    '.pagination button:has-text("Prev")',
    '[data-testid*="pagination"] button:has-text("Prev")',
    // Blueprint (best-effort)
    '.bp3-pagination .bp3-button:has-text("Prev")',
  ];

  let resetDone = false;
  for (const sel of prevSelectors) {
    const prevBtn = page.locator(sel).first();
    try {
      if (await prevBtn.count() === 0) continue;
      for (let i = 0; i < 24; i++) {
        // Detect disabled state via button, aria-disabled, or Ant parent li
        const visible = await prevBtn.isVisible().catch(()=>false);
        if (!visible) break;
        const enabled = await prevBtn.isEnabled().catch(()=>true);
        let parentDisabled = false;
        try {
          const li = prevBtn.locator('xpath=ancestor::li[contains(@class, "ant-pagination-prev")]');
          if (await li.count()) {
            const cls = (await li.first().getAttribute('class')) || '';
            parentDisabled = /ant-pagination-disabled/.test(cls);
          }
        } catch {}
        if (!enabled || parentDisabled) break;
        await prevBtn.scrollIntoViewIfNeeded().catch(()=>{});
        await prevBtn.click({ force: true });
        await page.waitForTimeout(150);
      }
      resetDone = true;
      break;
    } catch {}
  }

  // Validate active page; if not page 1, try clicking explicit "1"
  try {
    const activeAnt = page.locator('li.ant-pagination-item-active');
    if (await activeAnt.count()) {
      const txt = (await activeAnt.first().innerText().catch(()=>''))?.trim();
      if (txt && txt !== '1') {
        const pageOne = page.locator('li.ant-pagination-item-1 a, li.ant-pagination-item-1 button').first();
        if (await pageOne.count()) {
          await pageOne.click({ force: true });
          await page.waitForTimeout(150);
        }
      }
    }
  } catch {}

  // Also try clicking an explicit "1" page button if present
  const pageOneCandidates = [
    page.getByRole('button', { name: /^1$/ }).first(),
    page.locator('a:has-text("1"), button:has-text("1")').first(),
  ];
  for (const cand of pageOneCandidates) {
    try {
      if (await cand.count() > 0 && await cand.isVisible()) {
        await cand.click({ force: true });
        await page.waitForTimeout(200);
        log('Clicked page 1 button', 'debug');
        break;
      }
    } catch {}
  }

  // Wait a moment for the grid to repopulate
  await page.waitForSelector('[role="grid"], [role="rowgroup"] [role="row"], table', { timeout: 8000 }).catch(()=>{});
  return true;
}

// Stronger pager reset: try quick-jumper, explicit page 1, then brute Prev; verify active=1
async function forcePageOne(page) {
  // Try Ant quick jumper input
  const quickJumper = page.locator('.ant-pagination-options-quick-jumper input, input[aria-label*="page" i]').first();
  try {
    if (await quickJumper.count() > 0 && await quickJumper.isVisible()) {
      await quickJumper.fill('1');
      await quickJumper.press('Enter');
      await page.waitForTimeout(200);
      log('Used quick jumper to go to page 1', 'debug');
    }
  } catch {}

  // Click explicit page 1 buttons/links if present
  const pageOneCandidates = [
    'li.ant-pagination-item-1 a',
    'li.ant-pagination-item-1 button',
    'li[title="1"] a',
    'li[title="1"] button',
    'button:has-text("1")',
    'a:has-text("1")',
  ];
  for (const sel of pageOneCandidates) {
    try {
      const el = page.locator(sel).first();
      if (await el.count() > 0 && await el.isVisible()) {
        await el.click({ force: true });
        await page.waitForTimeout(150);
        log('Clicked explicit page 1 control', 'debug');
        break;
      }
    } catch {}
  }

  // As last resort, brute-force Prev
  await goToFirstPage(page).catch(()=>{});

  // Verify active page label
  try {
    const activeAnt = page.locator('li.ant-pagination-item-active');
    if (await activeAnt.count()) {
      const txt = (await activeAnt.first().innerText().catch(()=>''))?.trim();
      log(`Active page after reset: ${txt || 'unknown'}`, 'debug');
    }
  } catch {}
}

// Open the Date/Time popover using a real mouse pointer engagement
async function openDatePopoverForDateTime(page) {
  // Be flexible with header label (may include arrows)
  const header = page.getByRole('columnheader', { name: /Date\/?Time/i }).first();
  await header.scrollIntoViewIfNeeded().catch(() => {});

  const tryPointer = async (loc) => {
    try {
      const box = await loc.boundingBox({ timeout: 1500 });
      if (box) {
        const cx = Math.round(box.x + box.width / 2);
        const cy = Math.round(box.y + Math.min(box.height / 2, 300));
        await page.mouse.move(cx, cy);
        await page.mouse.move(cx + 1, cy + 1);
      }
    } catch {}
    await loc.hover({ force: true }).catch(()=>{});
    try {
      await page.waitForSelector('.bp3-popover .DayPicker, .bp3-popover .bp3-datepicker', { timeout: 1200 });
      return true;
    } catch {}
    try { await loc.click({ force: true }); } catch {}
    try {
      await page.waitForSelector('.bp3-popover .DayPicker, .bp3-popover .bp3-datepicker', { timeout: 1500 });
      return true;
    } catch {}
    // Dispatch mouseenter event (Blueprint often listens to it)
    try {
      const sel = await loc.evaluateHandle(el => el);
      await page.evaluate((el) => {
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, view: window }));
      }, sel);
      await page.waitForSelector('.bp3-popover .DayPicker, .bp3-popover .bp3-datepicker', { timeout: 1500 });
      return true;
    } catch {}
    return false;
  };

  // Try a series of increasingly-broad targets inside the header cell
  const candidates = [
    header.locator('.bp3-popover-target span[tabindex="0"]').first(),
    header.locator('.bp3-popover-target span').first(),
    header.locator('.bp3-popover-target').first(),
    header.locator('.bp3-popover-wrapper').first(),
    header
  ];

  for (const c of candidates) {
    if (await c.count()) {
      const ok = await tryPointer(c);
      if (ok) return true;
    }
  }

  // If still closed, log headers and screenshot for debugging
  try {
    const headers = await page.$$eval('[role="columnheader"]', els => els.map(e => (e.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean));
    log(`Failed to open date popover. Headers: ${JSON.stringify(headers)}`, 'warning');
    if (SCREENSHOT) await page.screenshot({ path: `debug_date_popover_${Date.now()}.png`, fullPage: true });
  } catch {}
  return false;
}

// Explicitly select Month/Year from native <select>s, then click first/last day
async function setMonthYearRangeExact(page, { year, month, startDay = 1, endDay } = {}) {
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthName = monthNames[month - 1];
  if (!endDay) endDay = new Date(year, month, 0).getDate();

  const targetMin = `${year}-${String(month).padStart(2,'0')}-${String(startDay).padStart(2,'0')}`;
  const targetMax = `${year}-${String(month).padStart(2,'0')}-${String(endDay).padStart(2,'0')}`;

  const pop = page.locator('.bp3-popover').last();
  const selects = pop.locator('select');
  const count = await selects.count();
  if (count < 2) throw new Error('Month/Year selects not found in date popover');
  const monthSelect = selects.nth(0);
  const yearSelect = selects.nth(1);

  // Pick month by label, fallback by index
  try {
    await monthSelect.selectOption({ label: monthName });
  } catch {
    await monthSelect.selectOption({ index: month - 1 });
  }
  // Pick year strictly by value
  await yearSelect.selectOption(String(year));

  // Click first and last day
  const dayCells = pop.locator('.DayPicker-Day:not(.DayPicker-Day--disabled):not(.DayPicker-Day--outside)')
    .or(pop.locator('[role="gridcell"]:not([aria-disabled="true"])'));

  await dayCells.filter({ hasText: String(startDay) }).first().click();
  // After first click, URL often updates with min
  await page.waitForURL(u => u.toString().includes(`filters%5BplacedAt%5D%5Bmin%5D=${targetMin}`), { timeout: 10000 }).catch(()=>{});

  await dayCells.filter({ hasText: String(endDay) }).last().click();
  await page.waitForURL(u => u.toString().includes(`filters%5BplacedAt%5D%5Bmax%5D=${targetMax}`), { timeout: 10000 }).catch(()=>{});

  // Close popover; wait for grid rows
  await page.keyboard.press('Escape').catch(()=>{});
  await page.waitForTimeout(300);
  await page.waitForSelector('[role="grid"] [role="row"]', { timeout: 15000 }).catch(()=>{});
}

async function setMonthlyRange(page, isFirstMonth = true, monthsBack = 0) {
  try {
    log(`Setting monthly date range (isFirstMonth: ${isFirstMonth}, monthsBack: ${monthsBack})`, 'debug');
    // First, force pager back to page 1 to avoid stale page index carrying into the new month
    await forcePageOne(page).catch(()=>{});
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Apply filters in this strict order: Channel -> Channel Type, then set calendar
    const channelOk = await setPopoverFilter(page, 'Channel', '50003');
    // Ensure Channel popover is closed before moving to Channel Type
    if (channelOk) {
      try {
        await page.mouse.move(5, 5);
        await page.keyboard.press('Escape').catch(()=>{});
        await page.waitForSelector('.bp3-popover', { state: 'detached', timeout: 1000 }).catch(()=>{});
        await page.waitForTimeout(150);
      } catch {}
    }
    const channelTypeOk = await setPopoverFilter(page, 'Channel Type', 'In-Store')
      || await setPopoverFilter(page, 'Channel Type', 'In Store');

    if (!(channelOk && channelTypeOk)) {
      await applyUrlFilters(page, {
        'filters[channel]': '50003',
        'filters[channelType]': 'In-Store',
        'pageSize': '100'
      });
    } else {
      // Still bump rows per page where supported
      await applyUrlFilters(page, { 'pageSize': '100' });
    }

    const opened = await openDatePopoverForDateTime(page);
    if (!opened) throw new Error('Could not open date filter popover');

    // Ensure the calendar shows the target month/year using explicit month/year controls if available
    const now = new Date();
    if (!isFirstMonth) now.setMonth(now.getMonth() - monthsBack);
    const targetYear = now.getFullYear();
    const targetMonthIndex = now.getMonth();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const targetCaption = `${monthNames[targetMonthIndex]} ${targetYear}`;

    async function readCaption() {
      const cap = page.locator('.bp3-popover .DayPicker-Caption, .bp3-popover .bp3-datepicker .DayPicker-Caption, .DayPicker-Caption').first();
      try { return (await cap.textContent({ timeout: 1000 }) || '').trim(); } catch { return ''; }
    }

    // Try month/year selects or dropdown buttons first
    const monthSelect = page.locator('.bp3-popover select[aria-label*="month" i], .bp3-popover select[name*="month" i]');
    const yearSelect  = page.locator('.bp3-popover select[aria-label*="year" i], .bp3-popover select[name*="year" i]');
    let usedPickers = false;
    try {
      if (await monthSelect.count()) {
        await monthSelect.selectOption({ label: monthNames[targetMonthIndex] });
        usedPickers = true;
        log(`Picked month via <select>: ${monthNames[targetMonthIndex]}`, 'debug');
      }
      if (await yearSelect.count()) {
        await yearSelect.selectOption({ label: String(targetYear) });
        usedPickers = true;
        log(`Picked year via <select>: ${targetYear}`, 'debug');
      }
    } catch (e) { log(`Select pickers failed: ${e.message}`, 'debug'); }

    if (!usedPickers) {
      // Dropdown buttons (Blueprint HTMLSelect / buttons with text + chevron)
      const monthBtnCandidates = [
        `.bp3-popover [aria-haspopup="listbox"]:has-text("${monthShort[targetMonthIndex]}")`,
        `.bp3-popover [aria-haspopup="listbox"]:has-text("${monthNames[targetMonthIndex]}")`,
        `.bp3-popover button:has-text("${monthShort[targetMonthIndex]}")`,
        `.bp3-popover button:has-text("${monthNames[targetMonthIndex]}")`
      ];
      let monthBtnOpened = false;
      for (const sel of monthBtnCandidates) {
        const btn = page.locator(sel).first();
        if (await btn.count()) {
          try {
            await moveMouseTo(page, btn, 'Month control');
            await btn.click({ force: true });
            const opt = page.getByRole('option', { name: monthNames[targetMonthIndex], exact: true })
              .or(page.locator(`.bp3-popover [role="option"]:has-text("${monthNames[targetMonthIndex]}")`).first());
            if (await opt.count()) {
              await opt.click({ force: true });
              monthBtnOpened = true;
              log(`Picked month via dropdown: ${monthNames[targetMonthIndex]}`, 'debug');
            }
          } catch (e) { log(`Month dropdown path failed: ${e.message}`, 'debug'); }
          if (monthBtnOpened) break;
        }
      }
      const yearBtnCandidates = [
        `.bp3-popover [aria-haspopup="listbox"]:has-text("${targetYear}")`,
        `.bp3-popover button:has-text("${targetYear}")`
      ];
      let yearBtnOpened = false;
      for (const sel of yearBtnCandidates) {
        const btn = page.locator(sel).first();
        if (await btn.count()) {
          try {
            await moveMouseTo(page, btn, 'Year control');
            await btn.click({ force: true });
            const opt = page.getByRole('option', { name: String(targetYear), exact: true })
              .or(page.locator(`.bp3-popover [role="option"]:has-text("${targetYear}")`).first());
            if (await opt.count()) {
              await opt.click({ force: true });
              yearBtnOpened = true;
              log(`Picked year via dropdown: ${targetYear}`, 'debug');
            }
          } catch (e) { log(`Year dropdown path failed: ${e.message}`, 'debug'); }
          if (yearBtnOpened) break;
        }
      }
      usedPickers = monthBtnOpened || yearBtnOpened;
    }

    // Use explicit selects to set month/year, then click first/last day
    await setMonthYearRangeExact(page, { year: targetYear, month: targetMonthIndex + 1, startDay: 1 });

    // After range change, some UIs keep prior page index. Force reset to first page if possible.
    await forcePageOne(page).catch(()=>{});
    // Ensure Date/Time is sorted newest-first before extracting
    await ensureDateSortDesc(page).catch(()=>{});

    // Filters already applied above (Channel -> Channel Type)

    // Wait for either a data row with a link or a visible no-results indicator
    const linkInRow = page.locator('[role="grid"] [role="rowgroup"] [role="row"] a').first();
    const noResults = page.locator('.bp3-non-ideal-state, .ant-empty, div:has-text("No results")').first();
    try {
      await linkInRow.waitFor({ timeout: 5000 });
    } catch {
      try { await noResults.waitFor({ timeout: 1500 }); } catch {}
    }

    log(`Successfully set date range for ${targetYear}-${String(targetMonthIndex + 1).padStart(2,'0')}`, 'success');
    return { year: targetYear, month: targetMonthIndex + 1 };

  } catch (error) {
    log(`Error setting monthly range: ${error.message}`, 'error');
    if (SCREENSHOT) {
      await page.screenshot({ path: `debug_date_error_${Date.now()}.png`, fullPage: true });
    }
    throw error;
  }
}

async function extractAllOrdersFromMonth(page) {
  const allOrders = [];
  let pageNum = 0;
  let hasMorePages = true;

  while (hasMorePages) {
    try {
      await page.waitForSelector('[role="grid"]', { timeout: 15000 });
      await page.waitForTimeout(2000);
      
      const loadingSelectors = [
        '.bp3-spinner',
        '.loading',
        '[data-testid*="loading"]',
        '.ant-spin'
      ];
      
      for (const selector of loadingSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 1000, state: 'detached' });
          log(`Waited for loading indicator to disappear: ${selector}`, 'debug');
        } catch (e) {
          // No loading indicator found or it disappeared already, continue
        }
      }
      
      const orderRows = page.locator('[role="grid"] [role="rowgroup"] [role="row"]');
      const rowCount = await orderRows.count();
      log(`Page ${pageNum + 1}: Found ${rowCount} orders`, 'debug');
      
      if (rowCount === 0) {
        log(`No orders found on page ${pageNum + 1}, ending pagination`, 'debug');
        hasMorePages = false;
        break;
      }

      log(`Extracting data from ${rowCount} orders...`, 'debug');
      
      for (let i = 0; i < rowCount; i++) {
        try {
          const row = orderRows.nth(i);
          const cells = row.locator('[role="gridcell"]');

          // Try multiple strategies to find the order link within the row
          const linkCandidates = [
            cells.nth(0).locator('a').first(),
            row.locator('a[href*="/sales/orders"]').first(),
            row.getByRole('link').first()
          ];
          let orderLink = null;
          for (const cand of linkCandidates) {
            try {
              if (await cand.count() > 0 && await cand.isVisible()) { orderLink = cand; break; }
            } catch {}
          }

          if (!orderLink) {
            const rowPreview = (await row.innerText().catch(()=>''))?.trim().slice(0, 120) || '';
            log(`Row ${i}: No order link found, skipping. Preview="${rowPreview}"`, 'debug');
            continue;
          }

          const orderId = await orderLink.textContent({ timeout: 2000 }).catch(()=>null);
          const href = await orderLink.getAttribute('href', { timeout: 2000 }).catch(()=>null);
          
          if (!orderId || !href) {
            log(`Row ${i}: Missing order ID or href, skipping`, 'debug');
            continue;
          }

          if (i === 0) {
            const cellCount = await cells.count();
            const cellContents = [];
            for (let cellIdx = 0; cellIdx < Math.min(cellCount, 10); cellIdx++) {
              const cellText = await safeText(cells.nth(cellIdx));
              cellContents.push(`Cell ${cellIdx}: "${cellText}"`);
            }
            log(`Row ${i} cell contents: ${cellContents.join(', ')}`, 'debug');
          }

          const orderData = {
            order_id: orderId.trim(),
            href: `https://manager.filson.p.newstore.net${href}`,
            customer_name: await safeText(cells.nth(1)),
            associate: '',
            date_time: await safeText(cells.nth(2)),
            channel_type: await safeText(cells.nth(3)),
            channel: await safeText(cells.nth(4)),
            fulfillment_type: '',
            demand_location: '',
            fulfillment_location: await safeText(cells.nth(5)),
            carrier: '',
            shipment_method: '',
            total: await safeText(cells.nth(6)),
            discount: await safeText(cells.nth(7)),
            status: await safeText(cells.nth(8))
          };
          
          allOrders.push(orderData);
          
          if ((i + 1) % 25 === 0) {
            log(`Extracted ${i + 1}/${rowCount} orders...`, 'debug');
          }
          
        } catch (error) {
          log(`Error extracting row ${i}: ${error.message}`, 'debug');
          continue;
        }
      }
      
      log(`Successfully extracted ${allOrders.length} orders from page ${pageNum + 1}`, 'debug');

      const nextButtons = [
        page.getByRole('button', { name: /Next|→/ }),
        page.locator('button:has-text("Next")'),
        page.locator('[data-testid*="next"]'),
        page.locator('.pagination button:last-child'),
        page.locator('.bp3-button:has-text("Next")'),
        page.locator('button[aria-label*="Next"]')
      ];
      
      let nextClicked = false;
      for (const nextButton of nextButtons) {
        try {
          const count = await nextButton.count();
          if (count > 0) {
            const isVisible = await nextButton.isVisible();
            const isEnabled = await nextButton.isEnabled();
            log(`Next button found: visible=${isVisible}, enabled=${isEnabled}`, 'debug');
            
            if (isVisible && isEnabled) {
              await nextButton.click();
              await page.waitForTimeout(3000);
              pageNum++;
              nextClicked = true;
              log(`Navigated to page ${pageNum + 1}`, 'debug');
              break;
            }
          }
        } catch (e) {
          log(`Next button attempt failed: ${e.message}`, 'debug');
          continue;
        }
      }
      
      if (!nextClicked) {
        log(`No more pages available, ending pagination`, 'debug');
        hasMorePages = false;
      }
      
    } catch (error) {
      log(`Error on page ${pageNum + 1}: ${error.message}`, 'error');
      hasMorePages = false;
    }
  }
  
  log(`Extraction complete: ${allOrders.length} total orders across ${pageNum + 1} pages`, 'success');
  return allOrders;
}

async function extractOrderLineItems(page, orderInfo, sharedOrderPage = null) {
  const lineItems = [];
  
  try {
    log(`Extracting line items for ${orderInfo.order_id}`, 'debug');
    
    // Reuse shared order page if provided; otherwise create locally
    let createdLocal = false;
    let orderPage = sharedOrderPage;
    if (!orderPage || (typeof orderPage.isClosed === 'function' && orderPage.isClosed())) {
      orderPage = await page.context().newPage();
      createdLocal = true;
    }
    
    try {
      // Try to navigate; if shared page was closed mid-run, recreate once
      try {
        await orderPage.goto(orderInfo.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      } catch (navErr) {
        if (!createdLocal) {
          // Attempt a one-time recreate of the shared page
          try { await orderPage.close().catch(()=>{}); } catch {}
          orderPage = await page.context().newPage();
          await orderPage.goto(orderInfo.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } else {
          throw navErr;
        }
      }
      
    // Wait for item sections
    await orderPage.waitForSelector('.ant-descriptions', { timeout: 10000 }).catch(() => {});

    // Robust extraction: map prices by header positions and read attributes from descriptions
    function moneyToPlain(s){ if (!s || s==='N/A') return '0'; const v=String(s).replace(/[^0-9.\-]/g,''); return v===''?'0':v; }
    const items = await orderPage.evaluate(() => {
      const norm=(s)=> (s||'').replace(/\s+/g,' ').trim();
      const keyify=(s)=> (s||'').trim().toUpperCase().replace(/\s+/g,'_').replace(/[^A-Z0-9_]/g,'');
      function parseKV(group){ const kv={}; const its=group.querySelectorAll('.ant-descriptions-item'); if(its.length){ its.forEach(it=>{ const l=(it.querySelector('.ant-descriptions-item-label')?.textContent||'').trim(); const v=(it.querySelector('.ant-descriptions-item-content')?.textContent||'').trim(); if(l) kv[keyify(l)]=v; }); } return kv; }
      function bestRow(group){ let best=null,bestC=-1,cur=group.parentElement,steps=0; function cnt(node){ const rr=node.getBoundingClientRect(); const w=document.createTreeWalker(node,NodeFilter.SHOW_ELEMENT,null); let n=w.currentNode,c=0; while(n){ if(group.contains(n)){ n=w.nextSibling(); continue;} const t=(n.textContent||'').trim(); if(/\$[0-9][\d,]*\.?\d*/.test(t)){ const r=n.getBoundingClientRect(); if(r.width>0&&r.height>0&&r.bottom>=rr.top-4&&r.top<=rr.bottom+4) c++; } n=w.nextNode(); } return c; } while(cur&&steps<8){ const c=cnt(cur); if(c>bestC){best=cur; bestC=c;} cur=cur.parentElement; steps++; } return best||group; }
      function headerPositions(){ const defs=[{name:'Price',re:/^(price)$/i},{name:'Discount',re:/^(discount)$/i},{name:'Disc. Price',re:/^(disc\.?\s*price)$/i},{name:'Taxes',re:/^(taxes)$/i}]; const pos={}; const els=Array.from(document.querySelectorAll('body *')); for(const {name,re} of defs){ let best=null,bestY=Infinity; for(const el of els){ const t=(el.textContent||'').trim(); if(!t||t.length>30) continue; if(!re.test(t)) continue; const r=el.getBoundingClientRect(); if(r.width>0&&r.height>0&&r.top<bestY){bestY=r.top; best=r;} } if(best) pos[name]=best.left+best.width/2; } return pos; }
      function mapAmounts(row, group){ const headers=headerPositions(); const out={'Price':'','Discount':'','Disc. Price':'','Taxes':''}; const rr=row.getBoundingClientRect(); const w=document.createTreeWalker(row,NodeFilter.SHOW_ELEMENT,null); let n=w.currentNode; const cands=[]; while(n){ if(group.contains(n)){ n=w.nextSibling(); continue;} const t=(n.textContent||'').trim(); const m=t.match(/\$[0-9][\d,]*\.?\d*/); if(m){ const r=n.getBoundingClientRect(); if(r.width>0&&r.height>0&&r.bottom>=rr.top-4&&r.top<=rr.bottom+4){ let red=false; try{ const cs=window.getComputedStyle(n); const col=cs.color||''; const mm=col.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/); if(mm){ const R=+mm[1],G=+mm[2],B=+mm[3]; if(R>=170&&G<=90&&B<=90) red=true; } }catch{} cands.push({price:m[0], x:r.left+r.width/2, red}); } } n=w.nextNode(); }
        const pick=(name, filter)=>{ const hx=headers[name]; if(hx==null) return ''; let best=null,bestDx=Infinity; for(const c of cands){ if(filter&&!filter(c)) continue; const dx=Math.abs(c.x-hx); if(dx<bestDx){ bestDx=dx; best=c; } } return best?best.price:''; };
        out['Price']=pick('Price',c=>!c.red)||''; out['Discount']=pick('Discount',c=>c.red)||'N/A'; out['Disc. Price']=pick('Disc. Price',c=>!c.red&&c.price!==out['Price'])||''; out['Taxes']=pick('Taxes',c=>c.red)||''; return out; }
      const res=[]; const groups=Array.from(document.querySelectorAll('.ant-descriptions'));
      for(const g of groups){ const kv=parseKV(g); const has=kv['SKU']||kv['UPC']||kv['AX_ITEM_NUMBER']||kv['JASPER_PRODUCT_ID']||kv['VARIANT_GROUP_ID']; if(!has) continue; const row=bestRow(g); const link=row.querySelector('a'); const name=norm(link?.textContent||''); const mapped=mapAmounts(row,g); res.push({name, kv, mapped}); }
      return res;
    });

    const foundProducts = Array.isArray(items) && items.length > 0;

    items.forEach(it => {
      lineItems.push({
        order_id: orderInfo.order_id,
        line_number: lineItems.length + 1,
        product_name: it.name || 'Item',
        sku: it.kv.SKU || '',
        upc: it.kv.UPC || '',
        color: it.kv.COLOR || '',
        size: it.kv.SIZE || '',
        quantity: '1',
        ax_item_number: it.kv.AX_ITEM_NUMBER || '',
        jasper_product_id: it.kv.JASPER_PRODUCT_ID || '',
        magento_sku: it.kv.MAGENTO_SKU || '',
        variant_group_id: it.kv.VARIANT_GROUP_ID || '',
        tax_class_id: it.kv.TAX_CLASS_ID || '',
        product_id: it.kv.PRODUCT_ID || '',
        status: orderInfo.status || 'Complete',
        unit_price: moneyToPlain(it.mapped['Price']),
        line_discount: moneyToPlain(it.mapped['Discount']),
        discounted_price: moneyToPlain(it.mapped['Disc. Price'] || it.mapped['Price']),
        taxes: (parseFloat(moneyToPlain(it.mapped['Taxes'] || '0'))>0)? moneyToPlain(it.mapped['Taxes']): '0'
      });
    });
      
      // If still nothing, try a conservative fallback from page text
      if (!foundProducts) {
        const pageText = (await orderPage.locator('body').innerText().catch(() => '')) || '';
        const m = pageText.match(/\$[0-9][\d,]*\.?\d*/);
        lineItems.push({
          order_id: orderInfo.order_id,
          line_number: 1,
          product_name: 'Store Purchase',
          sku: '', upc: '', color: '', size: '', quantity: '1',
          ax_item_number: '', jasper_product_id: '', magento_sku: '',
          variant_group_id: '', tax_class_id: '', product_id: '',
          status: orderInfo.status || 'Complete',
          unit_price: m ? m[0] : (orderInfo.total || '$0.00'),
          line_discount: orderInfo.discount || '',
          discounted_price: m ? m[0] : (orderInfo.total || '$0.00'),
          taxes: ''
        });
      }
      
    } finally {
      // Only close if we created the page locally; keep shared pages alive
      if (createdLocal) {
        try { await orderPage.close(); } catch {}
      }
    }
    
    // Ensure we always return at least one line item
    if (lineItems.length === 0) {
      lineItems.push({
        order_id: orderInfo.order_id,
        line_number: 1,
        product_name: 'Store Purchase',
        sku: '', upc: '', color: '', size: '', quantity: '1',
        ax_item_number: '', jasper_product_id: '', magento_sku: '',
        variant_group_id: '', tax_class_id: '', product_id: '',
        status: orderInfo.status || 'Complete',
        unit_price: orderInfo.total || '$0.00',
        line_discount: orderInfo.discount || '',
        discounted_price: orderInfo.total || '$0.00',
        taxes: ''
      });
    }
    
    log(`Extracted ${lineItems.length} line items for ${orderInfo.order_id}`, 'success');
    
  } catch (error) {
    log(`Error extracting line items for ${orderInfo.order_id}: ${error.message}`, 'error');
    
    // Return a fallback line item
    lineItems.push({
      order_id: orderInfo.order_id,
      line_number: 1,
      product_name: 'Error - Store Purchase',
      sku: '', upc: '', color: '', size: '', quantity: '1',
      ax_item_number: '', jasper_product_id: '', magento_sku: '',
      variant_group_id: '', tax_class_id: '', product_id: '',
      status: 'Complete',
      unit_price: orderInfo.total || '$0.00',
      line_discount: '',
      discounted_price: orderInfo.total || '$0.00',
      taxes: ''
    });
  }
  
  return lineItems;
}

async function processOrdersByDate(page, orders) {
  const ordersByDate = {};
  
  for (const order of orders) {
    const dateStr = parseDateFromOrderTable(order.date_time);
    if (!dateStr) {
      log(`Could not parse date from: ${order.date_time}`, 'warning');
      continue;
    }
    if (!ordersByDate[dateStr]) {
      ordersByDate[dateStr] = [];
    }
    ordersByDate[dateStr].push(order);
  }

  const dates = Object.keys(ordersByDate).sort().reverse();
  let processedDates = 0;
  let skippedDates = 0;

  for (const dateStr of dates) {
    if (dailyFilesExist(dateStr)) {
      log(`Files already exist for ${dateStr}, skipping`);
      skippedDates++;
      continue;
    }

    const dayOrders = ordersByDate[dateStr];
    const dayLineItems = [];
    log(`Processing ${dateStr}: ${dayOrders.length} orders`);
    
    // Reuse a single detail page across all orders for stability
    let orderPage = null;
    try { orderPage = await page.context().newPage(); } catch {}

    for (let i = 0; i < dayOrders.length; i++) {
      const orderInfo = dayOrders[i];
      
      try {
        // Ensure reusable page exists (recreate if closed)
        if (!orderPage || (typeof orderPage.isClosed === 'function' && orderPage.isClosed())) {
          try { if (orderPage) await orderPage.close().catch(()=>{}); } catch {}
          orderPage = await page.context().newPage();
        }
        // Extract line items using the shared page
        const lineItems = await extractOrderLineItems(page, orderInfo, orderPage);
        dayLineItems.push(...lineItems);
        
        // Progress indicator
        if ((i + 1) % 5 === 0 || i === dayOrders.length - 1) {
          log(`Progress: ${i + 1}/${dayOrders.length} orders processed for ${dateStr}`, 'info');
        }
        
        // Small delay between orders to avoid overwhelming the server
        await page.waitForTimeout(1000);
        
      } catch (error) {
        log(`Error processing order ${orderInfo.order_id}: ${error.message}`, 'error');
        
        // Add fallback line item for failed order
        dayLineItems.push({
          order_id: orderInfo.order_id,
          line_number: 1,
          product_name: 'Processing Error',
          sku: '', upc: '', color: '', size: '', quantity: '1',
          ax_item_number: '', jasper_product_id: '', magento_sku: '',
          variant_group_id: '', tax_class_id: '', product_id: '',
          status: 'Error',
          unit_price: orderInfo.total || '$0.00',
          line_discount: '',
          discounted_price: orderInfo.total || '$0.00',
          taxes: ''
        });
      } finally {
        // If the shared page was closed during extraction, recreate on next loop
      }
    }

    saveDailyFiles(dateStr, dayOrders, dayLineItems);
    processedDates++;
    log(`Completed ${dateStr}: ${dayOrders.length} orders, ${dayLineItems.length} line items`, 'success');
    
    // Close the shared page for this day
    try { if (orderPage && !orderPage.isClosed()) await orderPage.close(); } catch {}
  }

  return { processedDates, skippedDates, totalDates: dates.length };
}

(async () => {
  log('Starting daily order scraper…');
  ensureDirectoryExists(EXPORTS_DIR);
  const browser = await chromium.launch({ headless: HEADLESS, slowMo: SLOWMO });
  let context;

  try {
    if (fs.existsSync(STORAGE_STATE_PATH)) {
      context = await browser.newContext({ storageState: STORAGE_STATE_PATH, viewport: VIEWPORT, deviceScaleFactor: 1 });
    } else {
      context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    }

    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    const authSuccess = await authenticateWithFallback(page, context);
    if (!authSuccess) {
      throw new Error('Authentication failed');
    }

    // Quick interactive mode to persist localStorage (e.g., column visibility)
    if (SAVE_STATE_ONLY) {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      log('SAVE_STATE_ONLY: Toggle columns in the browser window, then return to the terminal.', 'info');
      await waitForEnter('After enabling the columns you want, press Enter to save.');
      await context.storageState({ path: STORAGE_STATE_PATH });
      log(`Saved storage state to ${STORAGE_STATE_PATH}`, 'success');
      return;
    }

    // We'll open a fresh page per month iteration to avoid pager/sort carryover

    let totalProcessedDates = 0;
    let totalSkippedDates = 0;
    let monthsProcessed = 0;
    let consecutiveEmptyMonths = 0;
    // Always start from the last fully completed month.
    // Example: If today is Sep 1, start from August.
    let isFirstMonth = false;
    let monthsBackFromToday = 1;

    while (true) {
      let monthPage = null;
      try {
        // Fresh page for this month to isolate pager/sort state
        monthPage = await context.newPage();
        monthPage.setDefaultTimeout(30000);
        await monthPage.goto(BASE_URL);
        await setupFilters(monthPage);

        const monthInfo = await setMonthlyRange(monthPage, isFirstMonth, monthsBackFromToday);
        // After the first iteration, keep moving backward month by month
        monthsBackFromToday++;
        isFirstMonth = false;
        const monthOrders = await extractAllOrdersFromMonth(monthPage);

        if (monthOrders.length === 0) {
          consecutiveEmptyMonths++;
          log(`No orders found for ${monthInfo.year}-${monthInfo.month.toString().padStart(2, '0')}`, 'warning');
          if (consecutiveEmptyMonths >= 3) {
            log('Reached end of historical data (3 consecutive empty months)');
            break;
          }
        } else {
          consecutiveEmptyMonths = 0;
          log(`Found ${monthOrders.length} orders in ${monthInfo.year}-${monthInfo.month.toString().padStart(2, '0')}`);
          const result = await processOrdersByDate(monthPage, monthOrders);
          totalProcessedDates += result.processedDates;
          totalSkippedDates += result.skippedDates;
          log(`Month summary - Processed: ${result.processedDates}, Skipped: ${result.skippedDates}, Total: ${result.totalDates}`);
        }

        monthsProcessed++;
        if (monthsProcessed >= MAX_MONTHS) {
          log('Reached maximum months limit (60), stopping');
          break;
        }
      } catch (error) {
        log(`Error processing month: ${error.message}`, 'error');
        consecutiveEmptyMonths++;
        if (consecutiveEmptyMonths >= 3) break;
        if (SCREENSHOT && monthPage) {
          try {
            await monthPage.screenshot({ path: `debug_month_error_${Date.now()}.png`, fullPage: true });
          } catch (e) {
            log(`Failed to take debug screenshot: ${e.message}`, 'debug');
          }
        }
      } finally {
        try { if (monthPage) await monthPage.close(); } catch {}
      }
    }

    log(`Scraping complete!`, 'success');
    log(`Processed ${totalProcessedDates} new dates, skipped ${totalSkippedDates} existing dates across ${monthsProcessed} months`, 'success');
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
  } finally {
    // Persist session + localStorage (e.g., column visibility) for future runs
    try {
      if (context) {
        await context.storageState({ path: STORAGE_STATE_PATH });
        log(`Saved storage state to ${STORAGE_STATE_PATH}`, 'debug');
      }
    } catch (e) {
      log(`Failed to save storage state: ${e.message}`, 'debug');
    }
    await browser.close();
  }
})();
