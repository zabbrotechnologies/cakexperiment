import { chromium } from 'playwright';

async function testClassroom() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

  console.log('Logging in as Sanjay...');
  await page.goto('http://localhost:5173/signin');
  await page.fill('input[type="email"]', 's.sanjay.01.03.2006@gmail.com');
  await page.fill('input[type="password"]', '101010');
  await page.click('button:has-text("Sign In")');

  await page.waitForURL('**/learn**', { timeout: 10000 });
  console.log('Logged in to /learn');

  console.log('Navigating to course classroom: /learn/course-5...');
  await page.goto('http://localhost:5173/learn/course-5');

  await page.waitForTimeout(3000);
  const content5 = await page.content();
  console.log('course-5 content length:', content5.length);

  console.log('Navigating to course classroom: /learn/course-4...');
  await page.goto('http://localhost:5173/learn/course-4');

  await page.waitForTimeout(3000);
  const content4 = await page.content();
  console.log('course-4 content length:', content4.length);
  
  await browser.close();
}

testClassroom().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
