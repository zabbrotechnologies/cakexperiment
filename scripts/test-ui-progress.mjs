import { chromium } from 'playwright';

async function testUiProgress() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', async res => {
    if (res.url().includes('/api/')) {
      console.log('API:', res.status(), res.url());
      if (res.url().includes('/api/user/courses')) {
        const json = await res.json().catch(() => null);
        console.log('Courses API response courses count:', json?.courses?.length);
      }
    }
  });

  console.log('Logging in as Sanjay...');
  await page.goto('http://localhost:5173/signin');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 's.sanjay.01.03.2006@gmail.com');
  await page.fill('input[type="password"]', '101010');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/learn', { timeout: 10000 });
  await page.waitForTimeout(1500);

  // 1. Check Student Dashboard (/learn)
  console.log('\n--- 1. Testing Student Dashboard (/learn) ---');
  const learnText = await page.evaluate(() => document.body.innerText);
  console.log('Dashboard text (first 600 chars):', learnText.substring(0, 600));

  // 2. Click My Courses tab
  console.log('\n--- 2. Testing My Courses tab ---');
  await page.click('a:has-text("My Courses"), button:has-text("My Courses")');
  await page.waitForSelector('.cake-card', { timeout: 10000 });
  const myCoursesText = await page.evaluate(() => document.body.innerText);
  console.log('My Courses text contains 100% Finished:', myCoursesText.includes('100% Finished'));
  console.log('My Courses lessons completed label:', myCoursesText.match(/\d+\s*lessons completed/i)?.[0] || 'No match');

  // 3. Click Learning Progress tab
  console.log('\n--- 3. Testing Learning Progress tab ---');
  await page.click('a:has-text("Learning Progress"), button:has-text("Learning Progress")');
  await page.waitForSelector('table', { timeout: 10000 });
  const myLearningText = await page.evaluate(() => document.body.innerText);
  console.log('Total Lessons Practiced:', myLearningText.match(/\d+\s*Total Lessons Practiced/i)?.[0] || 'No match');
  console.log('Certified Masterclasses:', myLearningText.match(/\d+\s*Certified Masterclasses/i)?.[0] || 'No match');
  console.log('Course Progress Breakdown Table contains 100%:', myLearningText.includes('100%'));

  await browser.close();
}

testUiProgress().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
