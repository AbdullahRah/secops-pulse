const { chromium } = require('playwright');

async function testSecOpsPulse() {
  console.log('Starting browser test...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });
  
  try {
    // Test dashboard page
    console.log('Testing dashboard page...');
    await page.goto('https://gog84uziwpes.space.minimax.io/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check for key elements
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if dashboard loaded
    const dashboardHeader = await page.locator('h1').first().textContent().catch(() => null);
    console.log('Dashboard header:', dashboardHeader);
    
    // Test incidents page
    console.log('Testing incidents page...');
    await page.goto('https://gog84uziwpes.space.minimax.io/dashboard/incidents', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Test events page
    console.log('Testing events page...');
    await page.goto('https://gog84uziwpes.space.minimax.io/dashboard/events', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Test settings page
    console.log('Testing settings page...');
    await page.goto('https://gog84uziwpes.space.minimax.io/dashboard/settings', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Report results
    console.log('\n=== Test Results ===');
    if (consoleErrors.length > 0) {
      console.log('Console errors found:');
      consoleErrors.forEach(err => console.log('  -', err));
    } else {
      console.log('No console errors detected!');
    }
    console.log('All pages loaded successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testSecOpsPulse();
