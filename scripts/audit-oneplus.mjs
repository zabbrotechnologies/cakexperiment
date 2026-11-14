import { chromium } from 'playwright';
import assert from 'assert';

const VIEWPORTS = [
  { name: 'Small Android', width: 320, height: 684 },
  { name: 'iPhone 12/13/SE', width: 375, height: 812 },
  { name: 'OnePlus Nord CE4 Lite', width: 393, height: 873 },
  { name: 'iPhone Plus/Max', width: 414, height: 896 },
  { name: 'iPad Portrait', width: 768, height: 1024 },
  { name: 'Small Laptop / Tablet Landscape', width: 1024, height: 768 },
  { name: 'Desktop Breakpoint Edge', width: 1240, height: 800 }
];

const PAGES_TO_TEST = [
  { url: 'http://127.0.0.1:5173/', name: 'Home' },
  { url: 'http://127.0.0.1:5173/shop', name: 'Shop' },
  { url: 'http://127.0.0.1:5173/courses', name: 'Courses' },
  { url: 'http://127.0.0.1:5173/gift-hampers', name: 'Gift Hampers' },
  { url: 'http://127.0.0.1:5173/cart', name: 'Cart' },
  { url: 'http://127.0.0.1:5173/signin', name: 'Sign In' },
  { url: 'http://127.0.0.1:5173/signup', name: 'Sign Up' }
];

async function runAudit() {
  console.log(`=============================================================`);
  console.log(`Starting Expanded Responsive Audit across 7 Viewports & 7 Routes`);
  console.log(`=============================================================\n`);

  const browser = await chromium.launch({ headless: true });
  let totalTests = 0;
  let passedTests = 0;

  for (const vp of VIEWPORTS) {
    console.log(`\n-------------------------------------------------------------`);
    console.log(`[VIEWPORT: ${vp.name} (${vp.width}x${vp.height})]`);
    console.log(`-------------------------------------------------------------`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: vp.width < 1024,
      hasTouch: vp.width < 1024
    });

    for (const pageInfo of PAGES_TO_TEST) {
      totalTests++;
      const page = await context.newPage();
      try {
        await page.goto(pageInfo.url, { waitUntil: 'load', timeout: 15000 });
        await page.waitForTimeout(300);

        const metrics = await page.evaluate(() => {
          const docW = document.documentElement.scrollWidth;
          const winW = window.innerWidth;
          const bodyW = document.body.scrollWidth;
          return {
            docW,
            winW,
            bodyW,
            hasOverflow: docW > winW || bodyW > winW
          };
        });

        const status = !metrics.hasOverflow ? 'PASS' : 'FAIL';
        if (!metrics.hasOverflow) passedTests++;

        console.log(`  [${status}] ${pageInfo.name.padEnd(12)}: scrollWidth=${metrics.docW}px, viewportWidth=${metrics.winW}px`);
        assert(!metrics.hasOverflow, `Document overflow detected on ${pageInfo.name} at ${vp.width}px!`);
      } finally {
        await page.close();
      }
    }
    await context.close();
  }

  await browser.close();

  console.log(`\n=============================================================`);
  console.log(`AUDIT COMPLETED: ${passedTests}/${totalTests} TESTS PASSED WITH ZERO OVERFLOW`);
  console.log(`=============================================================`);
}

runAudit().catch((err) => {
  console.error('\n❌ Audit failed:', err);
  process.exit(1);
});
