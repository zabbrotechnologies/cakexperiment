import { chromium } from 'playwright';

async function testModal() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log('Navigating to signin...');
  await page.goto('http://localhost:5173/signin');
  await page.waitForLoadState('networkidle');

  // Fill in admin credentials
  await page.fill('input[type="email"]', 'admin@cakexperiment.demo');
  await page.fill('input[type="password"]', 'Admin@12345');
  await page.click('button:has-text("Sign In")');

  // Wait for navigation / dashboard
  await page.waitForURL('**/admin**', { timeout: 10000 });
  console.log('Signed in successfully as Admin.');

  // Go to Admin Orders
  await page.goto('http://localhost:5173/admin/orders');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Helper to test modal centering
  const verifyModalCentering = async (scrollPos, label) => {
    console.log(`\n--- Testing ${label} (Scroll Y: ${scrollPos}) ---`);
    await page.evaluate((y) => window.scrollTo(0, y), scrollPos);
    await page.waitForTimeout(200);

    const actualScrollY = await page.evaluate(() => window.scrollY);
    console.log(`Current window.scrollY: ${actualScrollY}`);

    // Click the first "Confirm & Activate" button visible in the table
    const confirmBtn = page.locator('button:has-text("Confirm & Activate")').first();
    await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    await confirmBtn.click();

    // Check modal overlay exists and is visible
    const modalOverlay = page.locator('.modal-overlay');
    await modalOverlay.waitFor({ state: 'visible', timeout: 3000 });

    const modalContent = page.locator('.modal-content');
    const box = await modalContent.boundingBox();
    const viewport = page.viewportSize();

    if (!box || !viewport) {
      throw new Error('Could not get modal bounding box or viewport');
    }

    // Modal center in viewport coordinates
    const modalCenterY = box.y + box.height / 2;
    const viewportCenterY = viewport.height / 2;
    const diffY = Math.abs(modalCenterY - viewportCenterY);

    const modalCenterX = box.x + box.width / 2;
    const viewportCenterX = viewport.width / 2;
    const diffX = Math.abs(modalCenterX - viewportCenterX);

    console.log(`Modal bounds: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    console.log(`Viewport: ${viewport.width}x${viewport.height}`);
    console.log(`Center Y Diff: ${diffY.toFixed(1)}px (Modal Center: ${modalCenterY.toFixed(1)}, Viewport Center: ${viewportCenterY})`);
    console.log(`Center X Diff: ${diffX.toFixed(1)}px (Modal Center: ${modalCenterX.toFixed(1)}, Viewport Center: ${viewportCenterX})`);

    // Verify background scroll is locked
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    console.log(`Body overflow when open: "${bodyOverflow}" (Expected: "hidden")`);

    if (diffY > 30) {
      throw new Error(`Modal is not vertically centered in viewport! Diff: ${diffY}px`);
    }
    if (diffX > 30) {
      throw new Error(`Modal is not horizontally centered in viewport! Diff: ${diffX}px`);
    }
    if (bodyOverflow !== 'hidden') {
      throw new Error(`Body overflow should be hidden, got: ${bodyOverflow}`);
    }

    // Close with Cancel button
    const cancelBtn = modalContent.locator('button:has-text("Cancel")');
    await cancelBtn.click();
    await page.waitForTimeout(300);

    const bodyOverflowAfter = await page.evaluate(() => document.body.style.overflow);
    console.log(`Body overflow after close: "${bodyOverflowAfter}" (Expected: "" or restored)`);
  };

  // Test 1: At top (scrollY = 0)
  await verifyModalCentering(0, 'Top of Page');

  // Test 2: Halfway down (scrollY = 400)
  await verifyModalCentering(400, 'Middle of Page');

  // Test 3: At bottom
  const maxScroll = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
  await verifyModalCentering(Math.max(0, maxScroll), 'Bottom of Page');

  // Test 4: Escape key dismissal
  console.log('\n--- Testing Escape key dismissal ---');
  const confirmBtn = page.locator('button:has-text("Confirm & Activate")').first();
  await confirmBtn.click();
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const isModalVisible = await page.locator('.modal-overlay').isVisible();
  console.log(`Modal visible after Escape: ${isModalVisible} (Expected: false)`);
  if (isModalVisible) {
    throw new Error('Modal did not close on Escape key');
  }

  // Test 5: Mobile Viewport
  console.log('\n--- Testing Mobile Viewport (390x844) ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  await confirmBtn.click();
  const mobileBox = await page.locator('.modal-content').boundingBox();
  console.log(`Mobile Modal: x=${mobileBox.x}, y=${mobileBox.y}, w=${mobileBox.width}, h=${mobileBox.height}`);
  const mobileCenterY = mobileBox.y + mobileBox.height / 2;
  const mobileViewportCenterY = 844 / 2;
  console.log(`Mobile Center Y Diff: ${Math.abs(mobileCenterY - mobileViewportCenterY).toFixed(1)}px`);
  await page.keyboard.press('Escape');

  console.log('\nALL MODAL CENTERING AND SCROLL TESTS PASSED SUCCESSFULLY!');
  await browser.close();
}

testModal().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
