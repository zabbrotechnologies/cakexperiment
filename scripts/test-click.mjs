import { chromium } from 'playwright';

async function testClick() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure().errorText));
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log('API RES:', res.status(), res.url());
    }
  });

  console.log('Logging in as Sanjay...');
  await page.goto('http://localhost:5173/signin');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 's.sanjay.01.03.2006@gmail.com');
  await page.fill('input[type="password"]', '101010');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/learn', { timeout: 10000 });
  console.log('On /learn');

  // Take screenshot of /learn
  await page.screenshot({ path: 'scripts/learn-dashboard.png' });

  // Click on "Resume Lesson" or first "Continue Learning ->"
  const resumeBtn = page.locator('button:has-text("Resume Lesson"), a:has-text("Resume Lesson")').first();
  const countResume = await resumeBtn.count();
  console.log('Resume Lesson button count:', countResume);

  if (countResume > 0) {
    console.log('Clicking Resume Lesson...');
    await resumeBtn.click();
  } else {
    const contBtn = page.locator('a:has-text("Continue Learning"), button:has-text("Continue Learning")').first();
    console.log('Clicking Continue Learning...');
    await contBtn.click();
  }

  await page.waitForTimeout(6000);
  console.log('Current URL after 6s:', page.url());
  await page.screenshot({ path: 'scripts/after-click-6s.png' });

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Body text after 6s:', bodyText.substring(0, 300));

  await browser.close();
}

testClick().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
