import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const viewports = [
  { name: 'mobile-small', width: 320, height: 640 },
  { name: 'mobile-iphone-se', width: 375, height: 667 },
  { name: 'mobile-iphone-14', width: 390, height: 844 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'desktop-small', width: 1150, height: 800 },
  { name: 'desktop-standard', width: 1280, height: 800 },
  { name: 'desktop-wide', width: 1440, height: 900 },
  { name: 'desktop-fhd', width: 1920, height: 1080 }
];

const routes = [
  '/',
  '/shop',
  '/courses',
  '/gift-hampers',
  '/signin'
];

const screenshotsDir = path.resolve('test-results/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('--- STARTING PLAYWRIGHT RESPONSIVE AUDIT ---');

  const report = [];

  for (const vp of viewports) {
    console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})`);
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const route of routes) {
      const url = `http://127.0.0.1:5173${route}`;
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      // Check document horizontal overflow
      const pageOverflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const bodyWidth = document.body.scrollWidth;
        const hasHorizontalScroll = docWidth > winWidth || bodyWidth > winWidth;
        return {
          winWidth,
          docWidth,
          bodyWidth,
          diff: Math.max(docWidth, bodyWidth) - winWidth,
          hasHorizontalScroll
        };
      });

      // Check navbar specifics on Home route
      let navbarAnalysis = null;
      if (route === '/') {
        navbarAnalysis = await page.evaluate(() => {
          const wrapper = document.querySelector('.floating-navbar-wrapper');
          const box = document.querySelector('.floating-navbar-box');
          const logo = document.querySelector('.floating-navbar-box a:first-child');
          const desktopNav = document.querySelector('.desktop-nav');
          const actions = document.querySelector('.floating-navbar-box > div:last-child');
          const mobileBtn = document.querySelector('.mobile-menu-btn');

          if (!wrapper || !box) return { error: 'Navbar elements missing' };

          const boxRect = box.getBoundingClientRect();
          const logoRect = logo ? logo.getBoundingClientRect() : null;
          const desktopNavRect = (desktopNav && window.getComputedStyle(desktopNav).display !== 'none') 
            ? desktopNav.getBoundingClientRect() 
            : null;
          const actionsRect = actions ? actions.getBoundingClientRect() : null;
          const mobileBtnVisible = mobileBtn && window.getComputedStyle(mobileBtn).display !== 'none';

          // Check if actions overflow the navbar box
          const actionsOverflowRight = actionsRect ? actionsRect.right > boxRect.right + 2 : false;

          // Check overlap between desktopNav and logo
          let navLogoOverlap = false;
          if (desktopNavRect && logoRect) {
            navLogoOverlap = !(desktopNavRect.left >= logoRect.right || desktopNavRect.right <= logoRect.left);
          }

          // Check overlap between desktopNav and actions
          let navActionsOverlap = false;
          if (desktopNavRect && actionsRect) {
            navActionsOverlap = !(desktopNavRect.right <= actionsRect.left || desktopNavRect.left >= actionsRect.right);
          }

          return {
            boxWidth: boxRect.width,
            logoRight: logoRect?.right,
            desktopNavVisible: !!desktopNavRect,
            desktopNavRect: desktopNavRect ? { left: desktopNavRect.left, right: desktopNavRect.right, width: desktopNavRect.width } : null,
            actionsRect: actionsRect ? { left: actionsRect.left, right: actionsRect.right, width: actionsRect.width } : null,
            mobileBtnVisible,
            actionsOverflowRight,
            navLogoOverlap,
            navActionsOverlap
          };
        });

        // Test mobile menu click if mobileBtn is visible
        if (navbarAnalysis?.mobileBtnVisible) {
          try {
            await page.click('.mobile-menu-btn');
            await page.waitForTimeout(300);
            const menuOpen = await page.evaluate(() => {
              const links = document.querySelectorAll('.floating-navbar-wrapper a');
              return links.length > 5;
            });
            navbarAnalysis.mobileMenuOpened = menuOpen;
            // close it
            await page.click('.mobile-menu-btn');
            await page.waitForTimeout(200);
          } catch (err) {
            navbarAnalysis.mobileMenuOpened = false;
            navbarAnalysis.mobileMenuError = err.message;
          }
        }

        const screenshotPath = path.join(screenshotsDir, `${vp.name}-home.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
      }

      report.push({
        viewport: vp.name,
        width: vp.width,
        route,
        pageOverflow,
        navbarAnalysis
      });
    }
  }

  await browser.close();

  fs.writeFileSync('test-results/audit-report.json', JSON.stringify(report, null, 2));
  console.log('\n--- AUDIT COMPLETE ---');
  console.log('Results written to test-results/audit-report.json');

  // Print summary of issues found
  console.log('\n=== SUMMARY OF ISSUES FOUND ===');
  let issueCount = 0;
  for (const r of report) {
    if (r.pageOverflow.hasHorizontalScroll) {
      console.log(`[OVERFLOW] ${r.viewport} (${r.width}px) on ${r.route}: document width ${r.pageOverflow.docWidth}px exceeds window ${r.pageOverflow.winWidth}px by ${r.pageOverflow.diff}px`);
      issueCount++;
    }
    if (r.navbarAnalysis) {
      const nb = r.navbarAnalysis;
      if (nb.actionsOverflowRight) {
        console.log(`[NAVBAR BOX OVERFLOW] ${r.viewport} (${r.width}px): navbar action buttons overflow the navbar box on the right!`);
        issueCount++;
      }
      if (nb.navLogoOverlap) {
        console.log(`[NAVBAR OVERLAP] ${r.viewport} (${r.width}px): desktop nav overlaps with brand logo!`);
        issueCount++;
      }
      if (nb.navActionsOverlap) {
        console.log(`[NAVBAR OVERLAP] ${r.viewport} (${r.width}px): desktop nav overlaps with action buttons!`);
        issueCount++;
      }
    }
  }
  if (issueCount === 0) {
    console.log('No layout issues detected.');
  }
}

run().catch(console.error);

