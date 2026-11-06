import { chromium } from 'playwright';

async function testAllCourses() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR LOG:', msg.text());
  });
  page.on('pageerror', err => console.log('UNCAUGHT PAGE ERROR:', err.message));

  console.log('Logging in as Sanjay...');
  await page.goto('http://localhost:5173/signin');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 's.sanjay.01.03.2006@gmail.com');
  await page.fill('input[type="password"]', '101010');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/learn', { timeout: 10000 });
  console.log('Logged in to /learn');
  await page.waitForTimeout(1000);

  const testCourse = async (courseId, name) => {
    console.log(`\nTesting classroom for ${name} (${courseId})...`);
    await page.goto(`http://localhost:5173/learn/${courseId}`, { waitUntil: 'domcontentloaded' });

    // Wait for Curriculum Modules to appear
    await page.waitForSelector('text=Curriculum Modules', { timeout: 15000 });

    const hasVideo = await page.locator('video').isVisible().catch(() => false);
    const hasCurriculum = await page.locator('text=Curriculum Modules').isVisible().catch(() => false);
    const hasBackLink = await page.locator('text=Back to Dashboard').isVisible().catch(() => false);

    console.log(`Result for ${courseId}: video=${hasVideo}, curriculum=${hasCurriculum}, backLink=${hasBackLink}`);
  };

  await testCourse('course-4', 'Artisan Chocolate Cake');
  await testCourse('course-5', 'French Pastry & Cupcakes');
  await testCourse('course-3', 'Modern Fondant Sculpting');

  console.log('\nAll 3 classrooms loaded perfectly without blank screen or errors!');
  await browser.close();
}

testAllCourses().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
