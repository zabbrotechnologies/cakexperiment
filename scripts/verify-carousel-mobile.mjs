import { chromium } from 'playwright';
import assert from 'assert';

async function testMobileCarousel() {
  console.log('Testing 3D Coverflow Carousel on Mobile View...');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'iPhone SE / Small Phone', width: 375, height: 812 },
    { name: 'Android Compact', width: 360, height: 740 },
    { name: 'iPhone 14 / Standard Mobile', width: 390, height: 844 },
    { name: 'iPhone Pro Max / Large Mobile', width: 428, height: 926 },
  ];

  for (const vp of viewports) {
    console.log(`\nChecking ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
    await page.waitForSelector('.showcase-card.pos-0', { timeout: 10000 });
    await page.waitForTimeout(400);

    // Scroll to carousel section
    await page.evaluate(() => {
      const el = document.getElementById('courses');
      if (el) el.scrollIntoView();
    });
    await page.waitForTimeout(300);

    const check = await page.evaluate(() => {
      const activeCard = document.querySelector('.showcase-card.pos-0');
      const left1 = document.querySelector('.showcase-card.pos-left-1');
      const right1 = document.querySelector('.showcase-card.pos-right-1');
      const left2 = document.querySelector('.showcase-card.pos-left-2');
      const right2 = document.querySelector('.showcase-card.pos-right-2');
      const prevArrow = document.querySelector('.showcase-side-arrow.prev');
      const nextArrow = document.querySelector('.showcase-side-arrow.next');

      const isVis = (el) => {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
      };

      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;

      return {
        hasActive: !!activeCard && isVis(activeCard),
        hasLeft1: !!left1 && isVis(left1),
        hasRight1: !!right1 && isVis(right1),
        hasLeft2: !left2 || isVis(left2),
        hasRight2: !right2 || isVis(right2),
        prevArrowVis: isVis(prevArrow),
        nextArrowVis: isVis(nextArrow),
        noOverflow: docW <= winW,
        docW,
        winW
      };
    });

    console.log(`  - Active card visible: ${check.hasActive}`);
    console.log(`  - Left-1 neighbor visible: ${check.hasLeft1}`);
    console.log(`  - Right-1 neighbor visible: ${check.hasRight1}`);
    console.log(`  - Side arrow prev visible: ${check.prevArrowVis}`);
    console.log(`  - Side arrow next visible: ${check.nextArrowVis}`);
    console.log(`  - Zero horizontal overflow: ${check.noOverflow} (doc: ${check.docW}px, win: ${check.winW}px)`);

    assert(check.hasActive, 'Active card must be visible');
    assert(check.hasLeft1, 'Left neighbor card must be visible');
    assert(check.hasRight1, 'Right neighbor card must be visible');
    assert(check.prevArrowVis, 'Previous arrow must be visible');
    assert(check.nextArrowVis, 'Next arrow must be visible');
    assert(check.noOverflow, `No document overflow on ${vp.width}px`);

    if (vp.width === 375) {
      // Capture screenshot of the carousel section on 375px mobile
      const coursesElem = await page.$('#courses');
      if (coursesElem) {
        await coursesElem.screenshot({ path: 'scripts/mobile-carousel-preview.png' });
        console.log('  - Saved mobile carousel screenshot to scripts/mobile-carousel-preview.png');
      }
    }

    await page.close();
  }

  // Interactive verification on 375x812: clicking next arrow and neighbor card
  console.log('\nTesting next side arrow interaction on 375x812...');
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await page.waitForSelector('.showcase-card.pos-0');
  await page.waitForTimeout(400);

  const initialCounter = await page.evaluate(() => {
    return document.querySelector('.showcase-nav-counter')?.textContent?.trim();
  });
  console.log(`  Initial counter: ${initialCounter}`);

  await page.click('.showcase-side-arrow.next');
  await page.waitForTimeout(400);

  const nextCounter = await page.evaluate(() => {
    return document.querySelector('.showcase-nav-counter')?.textContent?.trim();
  });
  console.log(`  Counter after next click: ${nextCounter}`);
  assert(nextCounter !== initialCounter, 'Counter should advance after clicking next side arrow');

  // Also test clicking previous arrow
  await page.click('.showcase-side-arrow.prev');
  await page.waitForTimeout(400);
  const revertedCounter = await page.evaluate(() => {
    return document.querySelector('.showcase-nav-counter')?.textContent?.trim();
  });
  console.log(`  Counter after prev click: ${revertedCounter}`);
  assert(revertedCounter === initialCounter, 'Counter should revert after clicking prev side arrow');

  await page.close();
  await browser.close();
  console.log('\n✅ ALL MOBILE CAROUSEL VERIFICATIONS PASSED SUCCESSFULLY!');
}

testMobileCarousel().catch((err) => {
  console.error('\n❌ Carousel test failed:', err);
  process.exit(1);
});
