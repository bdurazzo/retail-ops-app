// action_logger.mjs
import { chromium } from 'playwright';

(async () => {
  console.log('Starting action logger...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const actions = [];
  let stepNumber = 1;
  
  // Log page navigation
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      const action = `${stepNumber++}. NAVIGATE: ${frame.url()}`;
      console.log(action);
      actions.push(action);
    }
  });
  
  // Log clicks with element info
  await page.exposeFunction('logClick', (elementInfo) => {
    const action = `${stepNumber++}. CLICK: ${elementInfo}`;
    console.log(action);
    actions.push(action);
  });
  
  // Log hovers
  await page.exposeFunction('logHover', (elementInfo) => {
    const action = `${stepNumber++}. HOVER: ${elementInfo}`;
    console.log(action);
    actions.push(action);
  });
  
  // Log text input
  await page.exposeFunction('logInput', (elementInfo, text) => {
    const action = `${stepNumber++}. TYPE: "${text}" into ${elementInfo}`;
    console.log(action);
    actions.push(action);
  });
  
  // Add event listeners to the page
  await page.addInitScript(() => {
    // Log clicks
    document.addEventListener('click', (e) => {
      const element = e.target;
      const info = `${element.tagName}${element.className ? '.' + element.className.split(' ').join('.') : ''}${element.textContent ? ` "${element.textContent.trim().slice(0, 50)}"` : ''}`;
      window.logClick(info);
    });
    
    // Log mouse hovers that might open popovers
    document.addEventListener('mouseover', (e) => {
      const element = e.target;
      if (element.classList.contains('bp3-popover-target') || 
          element.closest('.bp3-popover-target')) {
        const info = `${element.tagName}${element.className ? '.' + element.className.split(' ').join('.') : ''}${element.textContent ? ` "${element.textContent.trim().slice(0, 50)}"` : ''}`;
        window.logHover(info);
      }
    });
    
    // Log text inputs
    document.addEventListener('input', (e) => {
      const element = e.target;
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        const info = `${element.tagName}${element.className ? '.' + element.className.split(' ').join('.') : ''}${element.placeholder ? ` placeholder="${element.placeholder}"` : ''}`;
        window.logInput(info, element.value);
      }
    });
  });
  
  console.log('\n=== INSTRUCTIONS ===');
  console.log('1. Navigate through your normal workflow');
  console.log('2. All your actions will be logged to the console');
  console.log('3. When finished, copy the logged actions and paste them to me');
  console.log('4. Close this browser window when done');
  console.log('====================\n');
  
  // Start at orders page
  await page.goto('https://manager.filson.p.newstore.net/sales/orders');
  
  // Wait for browser to close
  await page.waitForEvent('close', { timeout: 0 }).catch(() => {});
  
  console.log('\n=== FINAL ACTION LOG ===');
  actions.forEach(action => console.log(action));
  console.log('========================\n');
  console.log('Copy the actions above and paste them to Claude');
  
  await browser.close();
  
})().catch(console.error);