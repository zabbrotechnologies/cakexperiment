import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: 'mobile-small', width: 320, height: 640 },
  { name: 'mobile-iphone-se', width: 375, height: 667 },
  { name: 'mobile-iphone-x', width: 375, height: 812 },
  { name: 'mobile-iphone-14', width: 390, height: 844 },
  { name: 'mobile-android-large', width: 414, height: 896 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'laptop-small', width: 1150, height: 800 },
  { name: 'desktop-1240', width: 1240, height: 800 },
  { name: 'desktop-standard', width: 1280, height: 800 },
  { name: 'desktop-large', width: 1440, height: 900 }
];

const PAGES_TO_CHECK = [
  '/',
  '/shop',
  '/courses',
  '/gift-hampers',
  '/about',
  '/signin'
];

const SCREENSHOTS_DIR = path.resolve('test-results/screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('  CAKEXPERIMENT PLAYWRIGHT RESPONSIVE AUDIT & TESTS ');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ PASS: ${message}`);
    } else {
      failedTests++;
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  // TEST 1: Navbar layout & boundaries across all viewports
  console.log('\n--- 1. Testing Navbar Layout Across Viewports ---');
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
    await page.waitForTimeout(250);

    const layout = await page.evaluate(() => {
      const box = document.querySelector('.floating-navbar-box');
      const logo = document.querySelector('.navbar-brand-logo');
      const nav = document.querySelector('.desktop-nav');
      const actions = document.querySelector('.navbar-actions-container');
      const mobileBtn = document.querySelector('.mobile-menu-btn');

      const bR = box ? box.getBoundingClientRect() : null;
      const lR = logo ? logo.getBoundingClientRect() : null;
      const nR = (nav && window.getComputedStyle(nav).display !== 'none') ? nav.getBoundingClientRect() : null;
      const aR = actions ? actions.getBoundingClientRect() : null;
      const mR = (mobileBtn && window.getComputedStyle(mobileBtn).display !== 'none') ? mobileBtn.getBoundingClientRect() : null;

      const winW = window.innerWidth;

      return {
        winW,
        box: bR ? { left: bR.left, right: bR.right, width: bR.width } : null,
        logo: lR ? { left: lR.left, right: lR.right, width: lR.width } : null,
        nav: nR ? { left: nR.left, right: nR.right, width: nR.width } : null,
        actions: aR ? { left: aR.left, right: aR.right, width: aR.width } : null,
        mobileBtnVisible: !!mR,
        actionsWithinBox: aR && bR ? aR.right <= bR.right + 2 : false,
        actionsWithinScreen: aR ? aR.right <= winW : false,
        noNavActionsCollision: (nR && aR) ? nR.right <= aR.left : true,
        noNavLogoCollision: (nR && lR) ? nR.left >= lR.right : true
      };
    });

    console.log(`[Viewport: ${vp.name} (${vp.width}x${vp.height})]`);
    assert(layout.actionsWithinScreen, `Actions fit inside screen width (${vp.width}px)`);
    assert(layout.actionsWithinBox, `Actions fit inside navbar container`);
    assert(layout.noNavActionsCollision, `No collision between desktop nav and actions`);
    assert(layout.noNavLogoCollision, `No collision between desktop nav and logo`);

    if (vp.width < 1024) {
      assert(layout.mobileBtnVisible, `Hamburger button visible on mobile/tablet (${vp.width}px)`);
    } else {
      assert(!layout.mobileBtnVisible, `Hamburger button hidden on desktop (${vp.width}px)`);
    }

    const ssPath = path.join(SCREENSHOTS_DIR, `nav-${vp.name}.png`);
    await page.screenshot({ path: ssPath, fullPage: false });
  }

  // TEST 2: Targeted Verification at 375×812, 768×1024, and 1240×800
  console.log('\n--- 2. Targeted Verification (375x812, 768x1024, 1240x800) ---');

  // A. Mobile 375x812
  console.log('\n  [Target: 375x812 Mobile]');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await page.waitForTimeout(300);

  const mobileChecks = await page.evaluate(() => {
    const badge = document.querySelector('.hero-badge');
    const badgeDisplay = badge ? window.getComputedStyle(badge).display : null;
    const hero = document.querySelector('.hero-section');
    const heroH = hero ? hero.clientHeight : 0;
    const carouselVp = document.querySelector('.fixed-showcase-viewport');
    const carouselH = carouselVp ? carouselVp.clientHeight : 0;
    const founderSection = document.getElementById('about');
    return {
      heroBadgeHidden: badgeDisplay === 'none',
      heroHeight: heroH,
      carouselHeight: carouselH,
      founderExists: !!founderSection
    };
  });
  assert(mobileChecks.heroBadgeHidden, 'Hero badge hidden on mobile (≤900px)');
  assert(mobileChecks.heroHeight >= 700, `Hero adapts with 100dvh (measured: ${mobileChecks.heroHeight}px)`);
  assert(mobileChecks.carouselHeight <= 450, `Course carousel height capped on mobile (measured: ${mobileChecks.carouselHeight}px)`);

  // B. Tablet 768x1024
  console.log('\n  [Target: 768x1024 Tablet]');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await page.waitForTimeout(300);

  const tabletChecks = await page.evaluate(() => {
    const badge = document.querySelector('.hero-badge');
    const badgeDisplay = badge ? window.getComputedStyle(badge).display : null;
    const nav = document.querySelector('.desktop-nav');
    const navDisplay = nav ? window.getComputedStyle(nav).display : null;
    const mBtn = document.querySelector('.mobile-menu-btn');
    const mBtnDisplay = mBtn ? window.getComputedStyle(mBtn).display : null;
    return {
      badgeHidden: badgeDisplay === 'none',
      navHidden: navDisplay === 'none',
      mobileBtnVisible: mBtnDisplay !== 'none'
    };
  });
  assert(tabletChecks.badgeHidden, 'Hero badge hidden on tablet (768px ≤ 900px)');
  assert(tabletChecks.navHidden, 'Desktop nav hidden on tablet portrait');
  assert(tabletChecks.mobileBtnVisible, 'Mobile menu button visible on tablet portrait');

  // C. Desktop 1240x800
  console.log('\n  [Target: 1240x800 Desktop]');
  await page.setViewportSize({ width: 1240, height: 800 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await page.waitForTimeout(300);

  const desktopChecks = await page.evaluate(() => {
    const badge = document.querySelector('.hero-badge');
    const badgeDisplay = badge ? window.getComputedStyle(badge).display : null;
    const nav = document.querySelector('.desktop-nav');
    const navDisplay = nav ? window.getComputedStyle(nav).display : null;
    const mBtn = document.querySelector('.mobile-menu-btn');
    const mBtnDisplay = mBtn ? window.getComputedStyle(mBtn).display : null;
    return {
      badgeVisible: badgeDisplay !== 'none',
      navVisible: navDisplay === 'flex',
      mobileBtnHidden: mBtnDisplay === 'none'
    };
  });
  assert(desktopChecks.badgeVisible, 'Hero badge visible on desktop (1240px > 900px)');
  assert(desktopChecks.navVisible, 'Desktop nav visible as flex on 1240px');
  assert(desktopChecks.mobileBtnHidden, 'Mobile menu button hidden on 1240px');

  // TEST 3: FAQ Accordion Smooth Expansion
  console.log('\n--- 3. Testing FAQ Accordion Smooth Expansion ---');
  await page.setViewportSize({ width: 375, height: 812 });
  
  // Verify default state (first FAQ item is open)
  const faqDefaultOpen = await page.evaluate(() => {
    const openContainers = Array.from(document.querySelectorAll('div')).filter(
      d => d.style.maxHeight === '1000px' && d.style.opacity === '1'
    );
    return openContainers.length > 0 && openContainers[0].clientHeight > 0;
  });
  assert(faqDefaultOpen, 'First FAQ item is open and legible by default');

  // Click second FAQ to expand it
  const faqButtons = page.locator('section button:has-text("?")');
  if (await faqButtons.count() > 1) {
    const secondFaq = faqButtons.nth(1);
    await secondFaq.scrollIntoViewIfNeeded();
    await secondFaq.click();
    await page.waitForTimeout(400);

    const faqExpandedHeight = await page.evaluate(() => {
      const openContainers = Array.from(document.querySelectorAll('div')).filter(
        d => d.style.maxHeight === '1000px' && d.style.opacity === '1'
      );
      return openContainers.length > 0 ? openContainers[0].clientHeight : 0;
    });

    assert(faqExpandedHeight > 0, `Second FAQ expands smoothly on click without clipping (height: ${faqExpandedHeight}px)`);
  }

  // TEST 4: Trailer Modal Sizing
  console.log('\n--- 4. Testing Modal Responsive Viewport Sizing ---');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  const trailerBtn = page.locator('button:has-text("Watch Trailer"), button:has-text("Trailer")').first();
  if (await trailerBtn.count() > 0) {
    await trailerBtn.click();
    await page.waitForTimeout(400);

    const modalSizing = await page.evaluate(() => {
      const modal = document.querySelector('.modal-content');
      if (!modal) return { modalFound: false };
      const r = modal.getBoundingClientRect();
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      return {
        modalFound: true,
        width: r.width,
        height: r.height,
        fitsWidth: r.width <= winW,
        fitsHeight: r.height <= winH
      };
    });

    assert(modalSizing.modalFound, 'Trailer modal opens successfully');
    assert(modalSizing.fitsWidth, `Modal fits within viewport width (${modalSizing.width}px <= 375px)`);
    assert(modalSizing.fitsHeight, `Modal fits within viewport height`);

    // Close modal
    const closeBtn = page.locator('.modal-content button').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(200);
    }
  }

  // TEST 5: Mobile Drawer Interactions
  console.log('\n--- 5. Testing Mobile Drawer Open / Close / Backdrop ---');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });

  await page.click('.mobile-menu-btn');
  await page.waitForTimeout(300);

  const drawerStateOpen = await page.evaluate(() => {
    const drawer = document.querySelector('.mobile-nav-drawer');
    const backdrop = document.querySelector('.mobile-nav-backdrop');
    const links = drawer ? drawer.querySelectorAll('a') : [];
    return {
      drawerVisible: !!drawer,
      backdropVisible: !!backdrop,
      linksCount: links.length
    };
  });
  assert(drawerStateOpen.drawerVisible, 'Mobile drawer opened on hamburger tap');
  assert(drawerStateOpen.backdropVisible, 'Backdrop overlay is visible');
  assert(drawerStateOpen.linksCount >= 6, `Mobile drawer contains navigation links (${drawerStateOpen.linksCount} found)`);

  // Close with Escape key
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  const escapeClosed = await page.evaluate(() => !document.querySelector('.mobile-nav-drawer'));
  assert(escapeClosed, 'Mobile drawer closed on pressing Escape key');

  // TEST 6: Zero Horizontal Overflow Across Site
  console.log('\n--- 6. Testing Zero Horizontal Overflow Across Site ---');
  for (const pagePath of PAGES_TO_CHECK) {
    for (const vp of [
      { name: '320px', width: 320, height: 600 },
      { name: '375px', width: 375, height: 667 },
      { name: '768px', width: 768, height: 1024 },
      { name: '1024px', width: 1024, height: 768 },
      { name: '1240px', width: 1240, height: 800 },
      { name: '1440px', width: 1440, height: 900 }
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`http://127.0.0.1:5173${pagePath}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(200);

      const overflow = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const bodyW = document.body.scrollWidth;
        const winW = window.innerWidth;
        const maxW = Math.max(docW, bodyW);
        return {
          winW,
          maxW,
          hasOverflow: maxW > winW
        };
      });

      assert(!overflow.hasOverflow, `No overflow on ${pagePath} at ${vp.name} (scrollWidth: ${overflow.maxW}px <= ${overflow.winW}px)`);
    }
  }

  await browser.close();

  console.log('\n====================================================');
  console.log(`  FINAL RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${totalTests})`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
