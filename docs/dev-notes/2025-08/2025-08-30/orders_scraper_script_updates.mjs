import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Configuration
const BASE_URL = 'https://manager.filson.p.newstore.net/sales/orders';
const USERNAME = 'ben.durazzo@filson.com';
const PASSWORD = 'BDbd6464555@';
const DEBUG = process.env.DEBUG === 'true';
const SCREENSHOT = process.env.SCREENSHOT === 'true';
const MAX_RETRIES = 3;
const STORAGE_STATE_PATH = 'storageState.json';
const EXPORTS_DIR = 'orders_exports';

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
  const [year, month] = dateStr.split('-');
  const monthDir = path.join(EXPORTS_DIR, year, `${year}-${month}`);
  const ordersFile = path.join(monthDir, `${dateStr}_orders.csv`);
  const lineItemsFile = path.join(monthDir, `${dateStr}_line-items.csv`);
  return fs.existsSync(ordersFile) && fs.existsSync(lineItemsFile);
}

function saveDailyFiles(dateStr, orders, lineItems) {
  const [year, month] = dateStr.split('-');
  const monthDir = path.join(EXPORTS_DIR, year, `${year}-${month}`);
  ensureDirectoryExists(monthDir);
  if (orders.length > 0) {
    const ordersFile = path.join(monthDir, `${dateStr}_orders.csv`);
    const ordersCSV = arrayToCSV(orders);
    fs.writeFileSync(ordersFile, ordersCSV);
    log(`Saved ${orders.length} orders to ${ordersFile}`);
  }
  if (lineItems.length > 0) {
    const lineItemsFile = path.join(monthDir, `${dateStr}_line-items.csv`);
    const lineItemsCSV = arrayToCSV(lineItems);
    fs.writeFileSync(lineItemsFile, lineItemsCSV);
    log(`Saved ${lineItems.length} line items to ${lineItemsFile}`);
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
    const columnTriggers = [
      page.locator(`[role="columnheader"]:has-text("${columnName}") .bp3-popover-target span[tabindex="0"]`),
      page.locator(`[role="columnheader"]:has-text("${columnName}") .bp3-popover-target span`),
      page.locator(`[role="columnheader"]:has-text("${columnName}") .bp3-popover-wrapper`),
      page.locator(`[role="columnheader"]:has-text("${columnName}") .bp3-popover-target`)
    ];

    let popoverOpened = false;
    for (const trigger of columnTriggers) {
      try {
        if (await trigger.count() > 0 && await trigger.isVisible()) {
          log(`Found ${columnName} column, hovering...`, 'debug');
          await trigger.hover();
          await page.waitForTimeout(2000);
          try {
            await page.waitForSelector('.bp3-popover', { timeout: 3000 });
            popoverOpened = true;
            log(`${columnName} popover opened`, 'debug');
            break;
          } catch (e) {
            continue;
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
          await selector.click();
          await page.waitForTimeout(1000);
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
    await page.waitForSelector('[role="grid"]', { timeout: 15000 });
    await page.waitForTimeout(2000);
    log('Setting up filters via popover menus...', 'debug');
    await setPopoverFilter(page, 'Fulfillment Location', '50003');
    await setPopoverFilter(page, 'Channel Type', 'In-Store');

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

async function setMonthlyRange(page, isFirstMonth = true, monthsBack = 0) {
  try {
    log(`Setting monthly date range (isFirstMonth: ${isFirstMonth}, monthsBack: ${monthsBack})`, 'debug');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const dateColumnTriggers = [
      page.locator(`[role="columnheader"]:has-text("Date/Time") .bp3-popover-target span[tabindex="0"]`),
      page.locator(`[role="columnheader"]:has-text("Date/Time") .bp3-popover-target span`),
      page.locator(`[role="columnheader"]:has-text("Date/Time") .bp3-popover-wrapper`),
      page.locator(`[role="columnheader"]:has-text("Date/Time") .bp3-popover-target`)
    ];

    let popoverOpened = false;
    for (const trigger of dateColumnTriggers) {
      try {
        if (await trigger.count() > 0 && await trigger.isVisible()) {
          log(`Found date column trigger, hovering...`, 'debug');
          await trigger.hover();
          await page.waitForTimeout(3000);
          try {
            await page.waitForSelector('.bp3-popover .DayPicker, .bp3-popover .bp3-datepicker', { timeout: 5000 });
            popoverOpened = true;
            log(`Date picker popover opened successfully`, 'debug');
            break;
          } catch (e) {
            log(`Popover trigger attempt failed: ${e.message}`, 'debug');
            continue;
          }
        }
      } catch (e) {
        log(`Error with trigger: ${e.message}`, 'debug');
        continue;
      }
    }

    if (!popoverOpened) {
      throw new Error('Could not open date filter popover');
    }

    if (!isFirstMonth) {
      log(`Navigating to previous month...`, 'debug');
      const leftCarets = [
        page.locator('.bp3-popover .DayPicker-NavButton--prev'),
        page.locator('.bp3-popover button[aria-label*="Previous"]'),
        page.locator('.bp3-popover .bp3-icon-chevron-left').locator('..'),
        page.locator('.bp3-popover button:has(.bp3-icon-chevron-left)')
      ];
      
      let navigated = false;
      for (const caret of leftCarets) {
        try {
          if (await caret.count() > 0 && await caret.isVisible()) {
            await caret.click();
            await page.waitForTimeout(2000);
            navigated = true;
            log(`Successfully navigated to previous month`, 'debug');
            break;
          }
        } catch (e) {
          log(`Navigation attempt failed: ${e.message}`, 'debug');
          continue;
        }
      }
      if (!navigated) {
        throw new Error('Could not navigate to previous month');
      }
    }

    const now = new Date();
    if (!isFirstMonth) {
      now.setMonth(now.getMonth() - monthsBack);
    }
    
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = 1;
    const lastDay = new Date(year, month, 0).getDate();

    log(`Target date range: ${year}-${month.toString().padStart(2, '0')}-${firstDay.toString().padStart(2, '0')} to ${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`, 'debug');

    await page.waitForTimeout(2000);
    
    const dayElements = page.locator('.bp3-popover .DayPicker-Day:not(.DayPicker-Day--disabled):not(.DayPicker-Day--outside)');
    const dayCount = await dayElements.count();
    
    if (dayCount === 0) {
      const altDayElements = page.locator('.bp3-popover [role="gridcell"]:not([aria-disabled="true"])');
      const altCount = await altDayElements.count();
      if (altCount > 0) {
        log(`Using alternative day selector, found ${altCount} elements`, 'debug');
      } else {
        throw new Error('Could not find any clickable day elements in the calendar');
      }
    } else {
      log(`Found ${dayCount} clickable day elements`, 'debug');
    }

    let firstDayClicked = false;
    let lastDayClicked = false;
    
    const availableDays = dayCount > 0 ? dayElements : page.locator('.bp3-popover [role="gridcell"]:not([aria-disabled="true"])');
    const allDays = await availableDays.all();
    
    log(`Looking for days ${firstDay} and ${lastDay} among ${allDays.length} available days`, 'debug');
    
    for (let i = 0; i < allDays.length; i++) {
      try {
        const dayElement = allDays[i];
        const dayText = (await dayElement.textContent() || '').trim();
        
        if (dayText === firstDay.toString()) {
          const isDisabled = await dayElement.getAttribute('aria-disabled') === 'true';
          const hasDisabledClass = await dayElement.evaluate(el => el.classList.contains('DayPicker-Day--disabled'));
          const hasOutsideClass = await dayElement.evaluate(el => el.classList.contains('DayPicker-Day--outside'));
          
          if (!isDisabled && !hasDisabledClass && !hasOutsideClass) {
            await dayElement.click();
            await page.waitForTimeout(500);
            firstDayClicked = true;
            log(`Successfully clicked first day: ${firstDay}`, 'debug');
            break;
          }
        }
      } catch (e) {
        log(`Error checking day element ${i}: ${e.message}`, 'debug');
        continue;
      }
    }

    for (let i = 0; i < allDays.length; i++) {
      try {
        const dayElement = allDays[i];
        const dayText = (await dayElement.textContent() || '').trim();
        
        if (dayText === lastDay.toString()) {
          const isDisabled = await dayElement.getAttribute('aria-disabled') === 'true';
          const hasDisabledClass = await dayElement.evaluate(el => el.classList.contains('DayPicker-Day--disabled'));
          const hasOutsideClass = await dayElement.evaluate(el => el.classList.contains('DayPicker-Day--outside'));
          
          if (!isDisabled && !hasDisabledClass && !hasOutsideClass) {
            await dayElement.click();
            await page.waitForTimeout(500);
            lastDayClicked = true;
            log(`Successfully clicked last day: ${lastDay}`, 'debug');
            break;
          }
        }
      } catch (e) {
        log(`Error checking day element ${i}: ${e.message}`, 'debug');
        continue;
      }
    }
    
    if (!firstDayClicked) {
      throw new Error(`Could not find or click first day: ${firstDay}`);
    }
    
    if (!lastDayClicked) {
      throw new Error(`Could not find or click last day: ${lastDay}`);
    }

    log(`Date range selected, closing popover...`, 'debug');
    
    await page.mouse.move(100, 100);
    await page.waitForTimeout(1000);
    
    const closeStrategies = [
      () => page.keyboard.press('Escape'),
      () => page.click('body', { position: { x: 100, y: 100 } }),
      () => page.click('[role="grid"]', { force: true })
    ];
    
    let popoverClosed = false;
    for (const strategy of closeStrategies) {
      try {
        await strategy();
        await page.waitForTimeout(500);
        
        const popoverExists = await page.locator('.bp3-popover .DayPicker').count() > 0;
        if (!popoverExists) {
          popoverClosed = true;
          log(`Popover closed successfully`, 'debug');
          break;
        }
      } catch (e) {
        log(`Close strategy failed: ${e.message}`, 'debug');
        continue;
      }
    }
    
    if (!popoverClosed) {
      log(`Warning: Popover may still be open, but continuing...`, 'warning');
    }

    log(`Waiting for grid to reload with filtered data...`, 'debug');
    await page.waitForTimeout(5000);
    
    try {
      await page.waitForSelector('[role="grid"] [role="row"]', { timeout: 15000 });
      await page.waitForTimeout(2000);
      log(`Grid data loaded successfully`, 'debug');
    } catch (e) {
      log(`Warning: Grid may not have reloaded properly: ${e.message}`, 'warning');
    }
    
    log(`Successfully set date range for ${year}-${month.toString().padStart(2, '0')}`, 'success');
    return { year, month };

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
          
          const orderLink = cells.nth(0).locator('a').first();
          const linkCount = await orderLink.count();
          
          if (linkCount === 0) {
            log(`Row ${i}: No order link found, skipping`, 'debug');
            continue;
          }
          
          const orderId = await orderLink.textContent({ timeout: 2000 });
          const href = await orderLink.getAttribute('href', { timeout: 2000 });
          
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

async function extractOrderLineItems(page, orderInfo) {
 const lineItems = [];
 
 try {
   log(`Extracting line items for ${orderInfo.order_id}`, 'debug');
   
   const orderPage = await page.context().newPage();
   
   try {
     await orderPage.goto(orderInfo.href, { 
       waitUntil: 'domcontentloaded',
       timeout: 30000 
     });
     
     await orderPage.waitForTimeout(5000);
     
     // DEBUG: Let's see what's actually on the page
     const allDivs = await orderPage.locator('div').all();
     log(`Found ${allDivs.length} div elements on page`, 'debug');
     
     // Look for divs that might contain product info
     for (let i = 0; i < Math.min(allDivs.length, 50); i++) {
       const div = allDivs[i];
       const text = await div.textContent();
       
       // If this div contains what looks like product info, log it
       if (text && (text.includes('$') || text.includes('SKU') || text.includes('Qty'))) {
         const className = await div.getAttribute('class');
         log(`Potential product div ${i} with class="${className}": ${text.substring(0, 200)}`, 'debug');
       }
     }
     
     // Also check for any tables
     const tables = await orderPage.locator('table').all();
     log(`Found ${tables.length} tables on page`, 'debug');
     
     for (let i = 0; i < tables.length; i++) {
       const tableText = await tables[i].textContent();
       log(`Table ${i} content: ${tableText.substring(0, 300)}`, 'debug');
     }
     
     // Check for any elements with "product" in class name
     const productElements = await orderPage.locator('[class*="product" i], [class*="item" i], [class*="line" i]').all();
     log(`Found ${productElements.length} elements with product/item/line in class name`, 'debug');
     
     for (let i = 0; i < Math.min(productElements.length, 10); i++) {
       const elem = productElements[i];
       const className = await elem.getAttribute('class');
       const text = await elem.textContent();
       log(`Product element ${i} class="${className}": ${text.substring(0, 200)}`, 'debug');
     }
     
     // KEEP THE REST OF YOUR EXISTING CODE BELOW THIS
     // ... rest of the function stays the same ...
     
     const productSelectors = [
       '.ant-descriptions-item',
       '[class*="product-item"]',
       '[class*="line-item"]',
       '[class*="order-item"]',
       'tr:has(td)',
       '[class*="sc-"]:has([class*="product"])',
       'section:has(span:text-matches("\\$"))',
     ];
     
     let foundProducts = false;
     
     for (const selector of productSelectors) {
       try {
         const elements = await orderPage.locator(selector).all();
         
         if (elements.length > 0) {
           log(`Found ${elements.length} potential product elements with selector: ${selector}`, 'debug');
           
           for (let i = 0; i < Math.min(elements.length, 10); i++) {
             const element = elements[i];
             const text = await element.textContent();
             
             if (text && text.length > 10) {
               const productNameMatch = text.match(/([A-Z][a-z]+[\s\w]+?)(?=\$|Size|Color|SKU)/);
               const priceMatch = text.match(/\$[\d,]+\.?\d*/);
               const sizeMatch = text.match(/Size[:\s]+([^\s,]+)/i);
               const colorMatch = text.match(/Color[:\s]+([^\s,]+)/i);
               const skuMatch = text.match(/SKU[:\s]+([^\s,]+)/i);
               const quantityMatch = text.match(/Qty[:\s]+(\d+)|Quantity[:\s]+(\d+)/i);
               
               if (productNameMatch || priceMatch) {
                 lineItems.push({
                   order_id: orderInfo.order_id,
                   line_number: lineItems.length + 1,
                   product_name: productNameMatch ? productNameMatch[1].trim() : 'Product',
                   sku: skuMatch ? skuMatch[1] : '',
                   upc: '',
                   color: colorMatch ? colorMatch[1] : '',
                   size: sizeMatch ? sizeMatch[1] : '',
                   quantity: quantityMatch ? (quantityMatch[1] || quantityMatch[2]) : '1',
                   ax_item_number: '',
                   jasper_product_id: '',
                   magento_sku: '',
                   variant_group_id: '',
                   tax_class_id: '',
                   product_id: '',
                   status: orderInfo.status || 'Complete',
                   unit_price: priceMatch ? priceMatch[0] : '',
                   line_discount: '',
                   discounted_price: priceMatch ? priceMatch[0] : '',
                   taxes: ''
                 });
                 
                 foundProducts = true;
               }
             }
           }
         }
       } catch (e) {
         log(`Error with selector ${selector}: ${e.message}`, 'debug');
       }
     }
     
     if (!foundProducts) {
       log(`No products found with selectors, trying text extraction`, 'debug');
       
       const pageText = await orderPage.locator('body').textContent();
       const lines = pageText.split('\n').filter(line => line.trim());
       
       for (const line of lines) {
         if (line.includes('$') && !line.includes('Total') && !line.includes('Subtotal') && !line.includes('Tax')) {
           const priceMatch = line.match(/\$[\d,]+\.?\d*/);
           if (priceMatch) {
             lineItems.push({
               order_id: orderInfo.order_id,
               line_number: lineItems.length + 1,
               product_name: line.replace(/\$[\d,]+\.?\d*/g, '').trim().slice(0, 100) || 'Product',
               sku: '', upc: '', color: '', size: '', quantity: '1',
               ax_item_number: '', jasper_product_id: '', magento_sku: '',
               variant_group_id: '', tax_class_id: '', product_id: '',
               status: orderInfo.status || 'Complete',
               unit_price: priceMatch[0],
               line_discount: '',
               discounted_price: priceMatch[0],
               taxes: ''
             });
           }
         }
       }
     }
     
   } finally {
     await orderPage.close();
   }
   
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

    for (let i = 0; i < dayOrders.length; i++) {
      const orderInfo = dayOrders[i];
      
      try {
        // Extract line items (this creates its own page internally)
        const lineItems = await extractOrderLineItems(page, orderInfo);
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
      }
    }

    saveDailyFiles(dateStr, dayOrders, dayLineItems);
    processedDates++;
    log(`Completed ${dateStr}: ${dayOrders.length} orders, ${dayLineItems.length} line items`, 'success');
  }

  return { processedDates, skippedDates, totalDates: dates.length };
}

(async () => {
  log('Starting daily order scraper…');
  ensureDirectoryExists(EXPORTS_DIR);
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  let context;

  try {
    if (fs.existsSync(STORAGE_STATE_PATH)) {
      context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
    } else {
      context = await browser.newContext();
    }

    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    const authSuccess = await authenticateWithFallback(page, context);
    if (!authSuccess) {
      throw new Error('Authentication failed');
    }

    await setupFilters(page);

    let totalProcessedDates = 0;
    let totalSkippedDates = 0;
    let monthsProcessed = 0;
    let consecutiveEmptyMonths = 0;
    let isFirstMonth = true;
    let monthsBackFromToday = 0;

    while (true) {
      try {
        const monthInfo = await setMonthlyRange(page, isFirstMonth, monthsBackFromToday);
        if (!isFirstMonth) {
          monthsBackFromToday++;
        }
        isFirstMonth = false;
        const monthOrders = await extractAllOrdersFromMonth(page);

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
          const result = await processOrdersByDate(page, monthOrders);
          totalProcessedDates += result.processedDates;
          totalSkippedDates += result.skippedDates;
          log(`Month summary - Processed: ${result.processedDates}, Skipped: ${result.skippedDates}, Total: ${result.totalDates}`);
        }

        monthsProcessed++;
        if (monthsProcessed >= 60) {
          log('Reached maximum months limit (60), stopping');
          break;
        }
      } catch (error) {
        log(`Error processing month: ${error.message}`, 'error');
        consecutiveEmptyMonths++;
        if (consecutiveEmptyMonths >= 3) break;
        if (SCREENSHOT) {
          try {
            await page.screenshot({ path: `debug_month_error_${Date.now()}.png`, fullPage: true });
          } catch (e) {
            log(`Failed to take debug screenshot: ${e.message}`, 'debug');
          }
        }
      }
    }

    log(`Scraping complete!`, 'success');
    log(`Processed ${totalProcessedDates} new dates, skipped ${totalSkippedDates} existing dates across ${monthsProcessed} months`, 'success');
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
  } finally {
    await browser.close();
  }
})();