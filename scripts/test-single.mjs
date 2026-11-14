import { chromium } from 'playwright';

async function testSingle() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(8000);

  console.log('Navigating to http://127.0.0.1:5173/ ...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  console.log('Page loaded!');

  const info = await page.evaluate(() => {
    const box = document.querySelector('.floating-navbar-box');
    const actions = document.querySelector('.floating-navbar-box > div:last-child');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    return {
      windowWidth: window.innerWidth,
      docWidth: document.documentElement.scrollWidth,
      boxRect: box ? box.getBoundingClientRect() : null,
      actionsRect: actions ? actions.getBoundingClientRect() : null,
      mobileBtnDisplay: mobileBtn ? window.getComputedStyle(mobileBtn).display : null,
      mobileBtnRect: mobileBtn ? mobileBtn.getBoundingClientRect() : null
    };
  });
  console.log('Navbar info on 375px mobile:', JSON.stringify(info, null, 2));

  await browser.close();
  console.log('Done!');
}

testSingle().catch(console.error);

