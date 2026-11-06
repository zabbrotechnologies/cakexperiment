import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function runAudit() {
  console.log('=====================================================');
  console.log('   CAKEXPERIMENT PLAYWRIGHT COMPREHENSIVE AUDIT');
  console.log('=====================================================\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() =>
    chromium.launch({ headless: true })
  );
  const context = await browser.newContext();
  const page = await context.newPage();

  // Intercept WhatsApp navigations so the page stays on test origin
  await page.route(/wa\.me|whatsapp\.com/, route => route.abort());

  const auditReport = {
    profilePicturesFound: [],
    purchasedCourseIssues: [],
    checkoutCourseIssues: [],
    adminIssues: []
  };

  // Monitor console errors and API calls
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`);
    }
  });

  // -----------------------------------------------------------------
  // 1. Audit Home Page
  // -----------------------------------------------------------------
  console.log('1. Auditing Home Page...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  console.log(`   ↳ Home page loaded successfully.`);

  // -----------------------------------------------------------------
  // 2. Audit Sign In with Sanjay (Normal User)
  // -----------------------------------------------------------------
  console.log('\n2. Testing User Login with sanjay (s.sanjay.01.03.2006@gmail.com)...');
  await page.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 's.sanjay.01.03.2006@gmail.com');
  await page.fill('input[type="password"]', '101010');

  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/auth/signin')),
    page.click('button[type="submit"]')
  ]);

  await page.waitForTimeout(1500);
  console.log(`   ↳ Landed on: ${page.url()}`);

  // Check user avatar in navbar (Image 1 fix check)
  const navAvatarImgs = await page.$$eval('header button img, nav button img', imgs => imgs.map(i => i.src));
  console.log('   ↳ Navbar user avatar images detected:', navAvatarImgs);
  if (navAvatarImgs.length > 0) {
    auditReport.profilePicturesFound.push('Navbar user badge is still rendering an image instead of a user icon symbol.');
  } else {
    console.log('   ✅ Navbar correctly renders user icon symbol without any profile photo.');
  }

  // -----------------------------------------------------------------
  // 3. Audit Student Dashboard - Purchased Course Sync (Image 2 fix check)
  // -----------------------------------------------------------------
  console.log('\n3. Auditing Student Dashboard for Enrolled Courses (/learn)...');
  await page.goto(`${BASE_URL}/learn`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const dashboardText = await page.$eval('body', el => el.innerText);
  const enrolledCoursesHeader = dashboardText.includes('My Enrolled Courses (1)');
  const hasZeroEnrolled = dashboardText.includes('No Courses Enrolled Yet') || dashboardText.includes('My Enrolled Courses (0)');
  const hasFondantCourse = dashboardText.includes('Modern Fondant Sculpting');

  console.log('   ↳ Has zero enrolled banner?', hasZeroEnrolled);
  console.log('   ↳ Displays "Modern Fondant Sculpting"?', hasFondantCourse);

  if (hasZeroEnrolled || !hasFondantCourse) {
    auditReport.purchasedCourseIssues.push('Student Dashboard displays 0 enrolled courses or failed to display Neon DB enrolled course.');
  } else {
    console.log('   ✅ Student Dashboard accurately displays enrolled course from Neon DB (Modern Fondant Sculpting)!');
  }

  // Check /my-courses page
  await page.goto(`${BASE_URL}/my-courses`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const myCoursesText = await page.$eval('body', el => el.innerText);
  console.log('   ↳ /my-courses contains Modern Fondant Sculpting?', myCoursesText.includes('Modern Fondant Sculpting'));

  // Check /my-purchases page
  await page.goto(`${BASE_URL}/my-purchases`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const purchasesText = await page.$eval('body', el => el.innerText);
  console.log('   ↳ /my-purchases contains purchase orders?', !purchasesText.includes('No Purchase Records Found'));

  // Check /profile page for avatar
  await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const profileAvatarImgs = await page.$$eval('form img', imgs => imgs.map(i => i.src));
  console.log('   ↳ Profile form avatar images detected:', profileAvatarImgs);
  if (profileAvatarImgs.length > 0) {
    auditReport.profilePicturesFound.push('Student Profile is still rendering an avatar image preview.');
  } else {
    console.log('   ✅ Student Profile renders clean user icon badge.');
  }

  // -----------------------------------------------------------------
  // 4. Audit Checkout for all 6 courses (Image 3 & 4 fix check)
  // -----------------------------------------------------------------
  console.log('\n4. Auditing Checkout Flow for Courses 1 through 6 (Image 3 & 4 issue)...');
  const testCourses = ['course-1', 'course-2', 'course-3', 'course-4', 'course-5', 'course-6'];

  for (const cId of testCourses) {
    await page.goto(`${BASE_URL}/checkout/${cId}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    let errorText = '';
    const initialError = await page.$('[style*="#FFEBEE"], [style*="#C62828"]');
    if (initialError) {
      errorText = await initialError.innerText().catch(() => '');
    }

    if (!errorText) {
      const whatsappBtn = await page.$('button:has-text("Continue to WhatsApp")');
      if (whatsappBtn) {
        await page.evaluate(() => {
          window.open = () => ({ closed: false });
        });
        await whatsappBtn.click();
        await page.waitForTimeout(1000);

        const postClickError = await page.$('[style*="#FFEBEE"], [style*="#C62828"]');
        if (postClickError) {
          errorText = await postClickError.innerText().catch(() => '');
        }
      }
    }

    if (errorText && errorText.includes('Course not found')) {
      console.log(`   ❌ Checkout ${cId}: ${errorText.trim()}`);
      auditReport.checkoutCourseIssues.push(`Checkout for ${cId} failed with: "${errorText.trim()}"`);
    } else {
      console.log(`   ✅ Checkout ${cId}: Successfully processed without "Course not found"`);
    }
  }

  // -----------------------------------------------------------------
  // 5. Audit Admin Portal & Admin Avatar (admin@cakexperiment.demo)
  // -----------------------------------------------------------------
  console.log('\n5. Auditing Admin Dashboard & Avatar Usage (admin@cakexperiment.demo)...');
  await page.evaluate(() => localStorage.clear());
  await context.clearCookies();

  await page.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@cakexperiment.demo');
  await page.fill('input[type="password"]', 'Admin@12345');

  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/auth/signin')),
    page.click('button[type="submit"]')
  ]);

  await page.waitForTimeout(2000);
  console.log(`   ↳ Admin Landed on: ${page.url()}`);

  // Check Admin topbar for avatar
  const adminTopbarImgs = await page.$$eval('.admin-user-info img, header img', imgs => imgs.map(i => i.src));
  console.log('   ↳ Admin topbar images:', adminTopbarImgs);
  if (adminTopbarImgs.length > 0) {
    auditReport.profilePicturesFound.push('Admin Layout topbar displays profile picture photo.');
  } else {
    console.log('   ✅ Admin Topbar renders clean user symbol without photos.');
  }

  // Check Admin Users table for avatars
  await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const adminUsersTableImgs = await page.$$eval('table img', imgs => imgs.map(i => i.src));
  console.log(`   ↳ Admin users table avatars count: ${adminUsersTableImgs.length}`);
  if (adminUsersTableImgs.length > 0) {
    auditReport.profilePicturesFound.push(`Admin Students table displays ${adminUsersTableImgs.length} profile picture photos.`);
  } else {
    console.log('   ✅ Admin Students table uses user icon badges for all users.');
  }

  // Check Admin Courses table
  await page.goto(`${BASE_URL}/admin/courses`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const adminCourseRows = await page.$$eval('tbody tr', trs => trs.length);
  console.log(`   ↳ Admin courses table count: ${adminCourseRows}`);

  if (adminCourseRows < 6) {
    auditReport.adminIssues.push(`Admin courses table has only ${adminCourseRows} courses (expected >= 6).`);
  } else {
    console.log(`   ✅ Admin courses table successfully lists all ${adminCourseRows} courses from Neon DB!`);
  }

  await browser.close();

  console.log('\n=====================================================');
  console.log('                PLAYWRIGHT AUDIT SUMMARY');
  console.log('=====================================================');
  console.log(JSON.stringify(auditReport, null, 2));

  const totalIssues =
    auditReport.profilePicturesFound.length +
    auditReport.purchasedCourseIssues.length +
    auditReport.checkoutCourseIssues.length +
    auditReport.adminIssues.length;

  if (totalIssues === 0) {
    console.log('\n🎉 ALL CHECKS PASSED WITH 0 ISSUES! PERFECT AUDIT RESULT!');
  } else {
    console.log(`\n⚠️ Audit found ${totalIssues} issue(s) remaining.`);
  }
}

runAudit().catch(console.error);
