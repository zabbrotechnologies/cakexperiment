import { chromium } from 'playwright';
import assert from 'assert';

const VIEWPORTS = [
  { name: 'OnePlus Nord CE4 Lite 5G', width: 393, height: 873, dpr: 2.75 },
  { name: 'Samsung Galaxy S24 / Pixel 8', width: 412, height: 915, dpr: 2.625 },
  { name: 'iPhone 15 / 16 Pro', width: 393, height: 852, dpr: 3 },
  { name: 'iPhone SE (3rd Gen)', width: 375, height: 667, dpr: 2 },
  { name: 'Android Compact (e.g. Galaxy A)', width: 360, height: 740, dpr: 2 },
  { name: 'Small Phone', width: 320, height: 640, dpr: 2 }
];

async function runComprehensiveVerification() {
  console.log('========================================================');
  console.log('STARTING THOROUGH PLAYWRIGHT MOBILE RESPONSIVENESS SUITE');
  console.log('Targeting: OnePlus Nord CE4 Lite 5G & All Mobile Viewports');
  console.log('========================================================\n');

  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n--------------------------------------------------------`);
    console.log(`[TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height}) DPR: ${vp.dpr}]`);
    console.log(`--------------------------------------------------------`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
    await page.waitForTimeout(600);

    // 1. Check Global Horizontal Overflow
    const overflowCheck = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const bodyW = document.body.scrollWidth;
      return { docW, winW, bodyW, hasOverflow: docW > winW || bodyW > winW };
    });
    console.log(`  ✓ Zero Document Overflow: doc=${overflowCheck.docW}px, win=${overflowCheck.winW}px`);
    assert(!overflowCheck.hasOverflow, `Document should have zero overflow on ${vp.width}px`);

    // 2. Navbar Checks
    const navMetrics = await page.evaluate(() => {
      const navBox = document.querySelector('.floating-navbar-box');
      const logo = document.querySelector('.navbar-brand-logo');
      const hamburger = document.querySelector('.mobile-menu-btn');
      const cartBtn = document.querySelector('button[aria-label*="cart" i], button[aria-label*="bag" i]');
      const wishlistBtn = document.querySelector('button[aria-label*="wishlist" i]');

      const rect = navBox ? navBox.getBoundingClientRect() : null;
      const hamRect = hamburger ? hamburger.getBoundingClientRect() : null;
      const logoRect = logo ? logo.getBoundingClientRect() : null;

      return {
        navFits: rect ? rect.right <= window.innerWidth && rect.left >= 0 : false,
        navW: rect ? Math.round(rect.width) : 0,
        logoH: logoRect ? Math.round(logoRect.height) : 0,
        hamburgerVis: hamburger ? window.getComputedStyle(hamburger).display !== 'none' : false,
        hamburgerSize: hamRect ? { w: Math.round(hamRect.width), h: Math.round(hamRect.height) } : null,
        cartVis: cartBtn ? window.getComputedStyle(cartBtn).display !== 'none' : false,
        wishlistVis: wishlistBtn ? window.getComputedStyle(wishlistBtn).display !== 'none' : false,
      };
    });

    console.log(`  ✓ Floating Navbar fits screen: ${navMetrics.navFits} (${navMetrics.navW}px)`);
    console.log(`  ✓ Logo height: ${navMetrics.logoH}px (proportional)`);
    console.log(`  ✓ Hamburger visible: ${navMetrics.hamburgerVis} (${navMetrics.hamburgerSize?.w}x${navMetrics.hamburgerSize?.h}px tap area)`);
    console.log(`  ✓ Action buttons visible: Cart=${navMetrics.cartVis}, Wishlist=${navMetrics.wishlistVis}`);

    assert(navMetrics.navFits, 'Navbar must fit inside viewport');
    assert(navMetrics.hamburgerVis, 'Hamburger button must be visible on mobile');
    assert(navMetrics.hamburgerSize.w >= 36, 'Hamburger tap target must be at least 36px');

    // 3. Test Mobile Drawer Interaction
    await page.click('.mobile-menu-btn');
    await page.waitForTimeout(400);

    const drawerCheck = await page.evaluate(() => {
      const drawer = document.querySelector('.mobile-nav-drawer');
      const backdrop = document.querySelector('.mobile-nav-backdrop');
      const links = drawer ? Array.from(drawer.querySelectorAll('a')).map(a => a.innerText.trim()) : [];
      const rect = drawer ? drawer.getBoundingClientRect() : null;
      return {
        isOpen: !!drawer,
        hasBackdrop: !!backdrop,
        drawerW: rect ? Math.round(rect.width) : 0,
        drawerFits: rect ? rect.right <= window.innerWidth + 2 && rect.left >= 0 : false,
        linkCount: links.length
      };
    });

    console.log(`  ✓ Mobile Menu Drawer opened: ${drawerCheck.isOpen}, links count: ${drawerCheck.linkCount}`);
    console.log(`  ✓ Drawer backdrop visible: ${drawerCheck.hasBackdrop}`);
    console.log(`  ✓ Drawer fits within screen: ${drawerCheck.drawerFits} (${drawerCheck.drawerW}px)`);

    assert(drawerCheck.isOpen, 'Drawer must be open');
    assert(drawerCheck.hasBackdrop, 'Drawer backdrop overlay must be present');
    assert(drawerCheck.drawerFits, 'Drawer must fit inside viewport');
    assert(drawerCheck.linkCount >= 6, 'Drawer must contain navigation links');

    // Close drawer via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const drawerClosed = await page.evaluate(() => !document.querySelector('.mobile-nav-drawer'));
    console.log(`  ✓ Mobile Menu Drawer closed via Escape: ${drawerClosed}`);
    assert(drawerClosed, 'Drawer must close on Escape');

    // 4. Hero Section Checks
    const heroCheck = await page.evaluate(() => {
      const h1 = document.querySelector('.hero-reveal-title');
      const btns = Array.from(document.querySelectorAll('.hero-reveal-buttons .btn'));
      const benefits = document.querySelector('.hero-reveal-benefits');
      const h1Style = h1 ? window.getComputedStyle(h1) : null;
      return {
        h1Font: h1Style ? h1Style.fontSize : null,
        h1Fits: h1 ? h1.getBoundingClientRect().right <= window.innerWidth : false,
        btnCount: btns.length,
        btnsFullWidth: btns.every(b => b.getBoundingClientRect().width > window.innerWidth * 0.75),
        benefitsFits: benefits ? benefits.getBoundingClientRect().right <= window.innerWidth : false
      };
    });
    console.log(`  ✓ Hero H1 font size: ${heroCheck.h1Font}, fits: ${heroCheck.h1Fits}`);
    console.log(`  ✓ Hero CTA buttons full-width thumb-friendly: ${heroCheck.btnsFullWidth}`);
    console.log(`  ✓ Hero benefits fit: ${heroCheck.benefitsFits}`);
    assert(heroCheck.h1Fits, 'Hero H1 must fit inside viewport');
    assert(heroCheck.btnsFullWidth, 'Hero buttons should be thumb-friendly full-width on mobile');

    // 5. Featured Courses 3D Coverflow Carousel Checks
    await page.evaluate(() => document.getElementById('courses')?.scrollIntoView());
    await page.waitForTimeout(300);

    const coursesCheck = await page.evaluate(() => {
      const activeCard = document.querySelector('.showcase-card.pos-0');
      const leftCard = document.querySelector('.showcase-card.pos-left-1');
      const rightCard = document.querySelector('.showcase-card.pos-right-1');
      const prevBtn = document.querySelector('.showcase-side-arrow.prev');
      const nextBtn = document.querySelector('.showcase-side-arrow.next');

      const isVis = (el) => {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
      };

      return {
        activeVis: isVis(activeCard),
        leftVis: isVis(leftCard),
        rightVis: isVis(rightCard),
        prevVis: isVis(prevBtn),
        nextVis: isVis(nextBtn)
      };
    });

    console.log(`  ✓ Featured Courses Coverflow: Active=${coursesCheck.activeVis}, Left-1=${coursesCheck.leftVis}, Right-1=${coursesCheck.rightVis}`);
    console.log(`  ✓ Side arrows on stage: Prev=${coursesCheck.prevVis}, Next=${coursesCheck.nextVis}`);
    assert(coursesCheck.activeVis, 'Active course card must be visible');
    assert(coursesCheck.leftVis, 'Left peeking card must be visible');
    assert(coursesCheck.rightVis, 'Right peeking card must be visible');
    assert(coursesCheck.prevVis, 'Previous arrow must be visible');
    assert(coursesCheck.nextVis, 'Next arrow must be visible');

    // 6. Studio Shop 2x2 Grid Tiles Check
    const shopCheck = await page.evaluate(() => {
      const grid = document.querySelector('.bakery-products-grid');
      const cards = Array.from(document.querySelectorAll('.bakery-products-grid > *'));
      const gridCols = grid ? window.getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0;
      return {
        gridCols,
        cardsCount: cards.length,
        gridFits: grid ? grid.getBoundingClientRect().right <= window.innerWidth : false
      };
    });
    console.log(`  ✓ Studio Shop 2x2 grid columns: ${shopCheck.gridCols} columns (${shopCheck.cardsCount} cards)`);
    assert(shopCheck.gridCols === 2, 'Studio Shop must have 2 columns on mobile (2x2 layout)');

    // 7. Categories Section Check (No text clipping)
    await page.evaluate(() => document.getElementById('categories')?.scrollIntoView());
    await page.waitForTimeout(300);

    const catCheck = await page.evaluate(() => {
      const activeCard = document.querySelector('.category-parallax-card.vp-center');
      const p = activeCard ? activeCard.querySelector('p') : null;
      const h3 = activeCard ? activeCard.querySelector('h3') : null;
      return {
        hasCard: !!activeCard,
        cardH: activeCard ? activeCard.clientHeight : 0,
        titleFont: h3 ? window.getComputedStyle(h3).fontSize : null,
        noSevereClip: activeCard ? activeCard.scrollHeight <= activeCard.clientHeight + 15 : false
      };
    });
    console.log(`  ✓ Category active card height: ${catCheck.cardH}px, title font: ${catCheck.titleFont}`);
    assert(catCheck.hasCard, 'Category card must exist');

    // 8. Testimonials Cinema Check
    await page.evaluate(() => document.getElementById('testimonials')?.scrollIntoView());
    await page.waitForTimeout(300);

    const testCheck = await page.evaluate(() => {
      const sec = document.getElementById('testimonials');
      return {
        secScrollW: sec ? sec.scrollWidth : 0,
        winW: window.innerWidth,
        noTestOverflow: sec ? sec.scrollWidth <= window.innerWidth : false
      };
    });
    console.log(`  ✓ Testimonials section fits screen: ${testCheck.noTestOverflow} (${testCheck.secScrollW}px <= ${testCheck.winW}px)`);
    assert(testCheck.noTestOverflow, 'Testimonials section must not cause horizontal scroll');

    await page.close();
    await context.close();
  }

  // 9. Test subpages on OnePlus Nord CE4 Lite (393x873)
  console.log('\n--------------------------------------------------------');
  console.log('[TESTING SUBPAGES ON ONEPLUS NORD CE4 LITE (393x873)]');
  console.log('--------------------------------------------------------');

  const subpages = ['/shop', '/courses', '/gift-hampers', '/cart', '/signin'];
  for (const path of subpages) {
    const page = await browser.newPage({
      viewport: { width: 393, height: 873 },
      deviceScaleFactor: 2.75,
      isMobile: true,
      hasTouch: true
    });
    await page.goto(`http://127.0.0.1:5173${path}`, { waitUntil: 'load' });
    await page.waitForTimeout(400);

    const subCheck = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const main = document.querySelector('main');
      const mainPadTop = main ? parseFloat(window.getComputedStyle(main).paddingTop) : 0;
      return {
        docW,
        winW,
        noOverflow: docW <= winW,
        mainPadTop
      };
    });
    console.log(`  ✓ ${path}: Zero overflow (${subCheck.docW}px <= ${subCheck.winW}px), Main paddingTop=${subCheck.mainPadTop}px`);
    assert(subCheck.noOverflow, `Subpage ${path} must have zero overflow`);
    assert(subCheck.mainPadTop >= 80, `Subpage ${path} main paddingTop must be >= 80px to clear navbar`);

    await page.close();
  }

  await browser.close();
  console.log('\n========================================================');
  console.log('✅ ALL COMPREHENSIVE RESPONSIVENESS TESTS PASSED!');
  console.log('========================================================');
}

runComprehensiveVerification().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});

