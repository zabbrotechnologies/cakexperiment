import { chromium } from 'playwright';

const widths = [320, 360, 375, 390, 414, 600, 768, 860, 1024, 1150, 1280, 1440, 1920];

async function checkAll() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Testing navbar across widths...');

  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });

    const data = await page.evaluate(() => {
      const box = document.querySelector('.floating-navbar-box');
      const logo = document.querySelector('.floating-navbar-box > a:first-child');
      const nav = document.querySelector('.desktop-nav');
      const actions = document.querySelector('.floating-navbar-box > div:last-child');
      const mobileBtn = document.querySelector('.mobile-menu-btn');

      const bR = box ? box.getBoundingClientRect() : null;
      const lR = logo ? logo.getBoundingClientRect() : null;
      const nR = (nav && window.getComputedStyle(nav).display !== 'none') ? nav.getBoundingClientRect() : null;
      const aR = actions ? actions.getBoundingClientRect() : null;
      const mR = (mobileBtn && window.getComputedStyle(mobileBtn).display !== 'none') ? mobileBtn.getBoundingClientRect() : null;

      const windowW = window.innerWidth;

      return {
        windowW,
        box: bR ? { left: bR.left, right: bR.right, width: bR.width } : null,
        logo: lR ? { left: lR.left, right: lR.right, width: lR.width } : null,
        nav: nR ? { left: nR.left, right: nR.right, width: nR.width } : null,
        actions: aR ? { left: aR.left, right: aR.right, width: aR.width } : null,
        mobileBtn: mR ? { left: mR.left, right: mR.right, width: mR.width } : null,
        actionsOffscreen: aR ? aR.right > windowW : false,
        actionsOverflowBox: (aR && bR) ? aR.right > bR.right + 2 : false,
        navLogoCollision: (nR && lR) ? !(nR.left >= lR.right) : false,
        navActionsCollision: (nR && aR) ? !(nR.right <= aR.left) : false
      };
    });

    console.log(`\nWidth: ${w}px`);
    console.log(`  Box: [${data.box?.left.toFixed(0)}, ${data.box?.right.toFixed(0)}] (w: ${data.box?.width.toFixed(0)})`);
    console.log(`  Actions: [${data.actions?.left.toFixed(0)}, ${data.actions?.right.toFixed(0)}] (w: ${data.actions?.width.toFixed(0)})`);
    if (data.mobileBtn) {
      console.log(`  MobileBtn: [${data.mobileBtn?.left.toFixed(0)}, ${data.mobileBtn?.right.toFixed(0)}]`);
    }
    if (data.nav) {
      console.log(`  DesktopNav: [${data.nav?.left.toFixed(0)}, ${data.nav?.right.toFixed(0)}] (w: ${data.nav?.width.toFixed(0)})`);
    }
    console.log(`  Issues: actionsOffscreen=${data.actionsOffscreen}, actionsOverflowBox=${data.actionsOverflowBox}, navLogoCollision=${data.navLogoCollision}, navActionsCollision=${data.navActionsCollision}`);
  }

  await browser.close();
}

checkAll().catch(console.error);

