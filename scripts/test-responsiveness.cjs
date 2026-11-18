const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const viewports = [
  { name: 'Mobile-Small-360x640', width: 360, height: 640 },
  { name: 'Mobile-Medium-375x812-iPhoneX', width: 375, height: 812 },
  { name: 'Mobile-Large-414x896-iPhoneXR', width: 414, height: 896 },
  { name: 'Tablet-Portrait-768x1024-iPad', width: 768, height: 1024 },
  { name: 'Tablet-Landscape-1024x768', width: 1024, height: 768 },
  { name: 'Laptop-1280x800', width: 1280, height: 800 },
  { name: 'Desktop-FHD-1920x1080', width: 1920, height: 1080 },
  { name: 'UltraWide-4K-2560x1440', width: 2560, height: 1440 }
];

const testRoutes = [
  '/',
  '/courses',
  '/gift-hampers',
  '/shop'
];

async function runTests() {
  console.log('🚀 Starting Comprehensive Playwright Responsiveness Test Suite...\n');
  const browser = await chromium.launch({ headless: true });
  
  const results = [];
  const reportDir = path.join(__dirname, 'playwright-report');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  for (const vp of viewports) {
    console.log(`\n📱 Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    for (const route of testRoutes) {
      const url = `http://localhost:5173${route}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(600);

        // Check for horizontal overflow (critical responsiveness bug check)
        const overflow = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const hasOverflow = scrollWidth > clientWidth;
          return {
            hasOverflow,
            scrollWidth,
            clientWidth,
            diff: scrollWidth - clientWidth
          };
        });

        // Check if navbar and hero are rendered
        const navVisible = await page.locator('.floating-navbar-wrapper, header').first().isVisible().catch(() => false);
        const footerVisible = await page.locator('#site-footer, footer').first().isVisible().catch(() => false);

        // If on homepage, check hero & center monument
        let heroVisible = true;
        let monumentVisible = true;
        if (route === '/') {
          heroVisible = await page.locator('.hero-section').first().isVisible().catch(() => false);
          monumentVisible = await page.locator('.chef-phone-monument-wrap, .experience-center-monument').first().isVisible().catch(() => false);
        }

        const isSuccess = !overflow.hasOverflow && consoleErrors.length === 0;

        results.push({
          viewport: vp.name,
          route,
          width: vp.width,
          overflow: overflow.hasOverflow ? `Overflow by ${overflow.diff}px` : 'No Overflow (Pass)',
          consoleErrorsCount: consoleErrors.length,
          navVisible,
          footerVisible,
          heroVisible,
          monumentVisible,
          status: isSuccess ? 'PASSED' : (overflow.hasOverflow ? 'OVERFLOW_FAIL' : 'CONSOLE_FAIL')
        });

        const statusIcon = isSuccess ? '✅' : '❌';
        console.log(`  ${statusIcon} [${vp.name}] ${route} -> Overflow: ${overflow.hasOverflow ? overflow.diff + 'px FAIL' : 'None'}, Errors: ${consoleErrors.length}`);
      } catch (err) {
        console.error(`  ❌ Error testing ${route} on ${vp.name}:`, err.message);
        results.push({
          viewport: vp.name,
          route,
          width: vp.width,
          status: 'ERROR',
          error: err.message
        });
      }
    }
    await context.close();
  }

  await browser.close();

  // Summary
  console.log('\n======================================================');
  console.log('📊 TEST SUMMARY RESULTS');
  console.log('======================================================');
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status !== 'PASSED').length;

  console.log(`Total Scenarios Tested: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  fs.writeFileSync(path.join(reportDir, 'responsiveness-results.json'), JSON.stringify(results, null, 2));
  console.log(`Report saved to: ${path.join(reportDir, 'responsiveness-results.json')}`);
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
