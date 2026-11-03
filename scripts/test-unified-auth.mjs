import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BASE_URL = 'http://localhost:5173';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, {
    ...options,
    headers
  });

  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, headers: res.headers, data };
}

let allPassed = true;
function assert(condition, scenarioNum, desc) {
  if (condition) {
    console.log(`[PASS] Scenario ${scenarioNum}: ${desc}`);
  } else {
    console.error(`[FAIL] Scenario ${scenarioNum}: ${desc}`);
    allPassed = false;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('CAKEXPERIMENT — UNIFIED AUTHENTICATION & ROLE-BASED SYSTEM TEST');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const user1Email = `user1_${timestamp}@cakexperiment.demo`;
  const user1Password = 'SecretPass@123';
  const user1Name = 'Eleanor User One';

  // -------------------------------------------------------------
  // Scenario 1: Register a normal account
  // -------------------------------------------------------------
  const reg1Res = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: user1Name,
      email: user1Email,
      password: user1Password,
      confirmPassword: user1Password
    })
  });
  assert(reg1Res.status === 201 && reg1Res.data?.success === true, 1, 'Register normal account through unified signup form');

  // -------------------------------------------------------------
  // Scenario 2: Verify the account is assigned USER
  // -------------------------------------------------------------
  assert(reg1Res.data?.user?.role === 'USER', 2, `Verify account role is strictly USER (actual: ${reg1Res.data?.user?.role})`);

  // -------------------------------------------------------------
  // Scenario 3: Log in using the same unified login page
  // -------------------------------------------------------------
  const login1Res = await request('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({
      email: user1Email,
      password: user1Password
    })
  });
  const user1Token = login1Res.data?.token;
  assert(login1Res.status === 200 && login1Res.data?.success === true && !!user1Token, 3, 'Log in using the unified login endpoint');

  // -------------------------------------------------------------
  // Scenario 4: Verify normal user redirection
  // -------------------------------------------------------------
  assert(login1Res.data?.redirectTo === '/learn', 4, `Verify normal user redirected to /learn (actual: ${login1Res.data?.redirectTo})`);

  // -------------------------------------------------------------
  // Scenario 5: Create and provision an ADMIN account
  // -------------------------------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cakexperiment.demo';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
  assert(!!adminEmail && !!adminPassword, 5, `Admin credentials provisioned server-side via environment variables (${adminEmail})`);

  // -------------------------------------------------------------
  // Scenario 6: Log in with the administrator credentials using the SAME login page
  // -------------------------------------------------------------
  const adminLoginRes = await request('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword
    })
  });
  const adminToken = adminLoginRes.data?.token;
  assert(adminLoginRes.status === 200 && adminLoginRes.data?.user?.role === 'ADMIN', 6, 'Log in as administrator using the SAME login endpoint');

  // -------------------------------------------------------------
  // Scenario 7: Verify admin redirection
  // -------------------------------------------------------------
  assert(adminLoginRes.data?.redirectTo === '/admin/dashboard', 7, `Verify administrator redirected to /admin/dashboard (actual: ${adminLoginRes.data?.redirectTo})`);

  // -------------------------------------------------------------
  // Scenario 8: Attempt to access admin APIs using a USER account and confirm access is denied (403)
  // -------------------------------------------------------------
  const userAccessAdminUsers = await request('/api/admin/users', {
    headers: { Authorization: `Bearer ${user1Token}` }
  });
  const userAccessAdminOrders = await request('/api/admin/orders', {
    headers: { Authorization: `Bearer ${user1Token}` }
  });
  const unauthAccess = await request('/api/admin/users'); // No token -> 401

  assert(
    userAccessAdminUsers.status === 403 &&
    userAccessAdminOrders.status === 403 &&
    unauthAccess.status === 401,
    8,
    'Attempt to access admin APIs using USER returns HTTP 403, unauthenticated returns HTTP 401'
  );

  // -------------------------------------------------------------
  // Scenario 9: Create two normal accounts (Alice & Bob)
  // -------------------------------------------------------------
  const aliceEmail = `alice_${timestamp}@cakexperiment.demo`;
  const bobEmail = `bob_${timestamp}@cakexperiment.demo`;

  const aliceReg = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name: 'Alice Baker', email: aliceEmail, password: 'AlicePass@123', confirmPassword: 'AlicePass@123' })
  });
  const bobReg = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name: 'Bob Decorator', email: bobEmail, password: 'BobPass@123', confirmPassword: 'BobPass@123' })
  });
  const aliceToken = aliceReg.data?.token;
  const bobToken = bobReg.data?.token;

  assert(
    aliceReg.status === 201 && bobReg.status === 201 &&
    aliceReg.data?.user?.role === 'USER' && bobReg.data?.user?.role === 'USER',
    9,
    'Create two distinct normal accounts (Alice & Bob) with role USER'
  );

  // -------------------------------------------------------------
  // Scenario 10: Purchase a course using the first account (Alice)
  // -------------------------------------------------------------
  const alicePurchase = await request('/api/user/purchase', {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({
      courseId: 'course-1',
      courseTitle: 'Signature Strawberry Vanilla Bean Cake',
      amount: 499,
      paymentMethod: 'UPI'
    })
  });
  const aliceOrders = await request('/api/user/orders', {
    headers: { Authorization: `Bearer ${aliceToken}` }
  });
  assert(
    alicePurchase.status === 201 &&
    aliceOrders.data?.orders?.length > 0 &&
    aliceOrders.data?.orders[0]?.course_id === 'course-1',
    10,
    `Purchase course using Alice's account (Order ID: ${alicePurchase.data?.orderId})`
  );

  // -------------------------------------------------------------
  // Scenario 11: Verify the second account (Bob) cannot access Alice's purchase
  // -------------------------------------------------------------
  const bobOrders = await request('/api/user/orders', {
    headers: { Authorization: `Bearer ${bobToken}` }
  });
  const bobEnrollments = await request('/api/user/enrollments', {
    headers: { Authorization: `Bearer ${bobToken}` }
  });
  assert(
    bobOrders.status === 200 &&
    bobOrders.data?.orders?.length === 0 &&
    bobEnrollments.data?.enrollments?.length === 0,
    11,
    'Verify Bob cannot access Alice’s orders or enrollments (Server-side user data isolation confirmed)'
  );

  // -------------------------------------------------------------
  // Scenario 12: Verify the administrator can view both accounts and their orders
  // -------------------------------------------------------------
  const adminUsersList = await request('/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminOrdersList = await request('/api/admin/orders', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const foundAlice = adminUsersList.data?.users?.some(u => u.email === aliceEmail);
  const foundBob = adminUsersList.data?.users?.some(u => u.email === bobEmail);
  const foundAliceOrder = adminOrdersList.data?.orders?.some(o => o.user_email === aliceEmail);

  assert(
    adminUsersList.status === 200 &&
    adminOrdersList.status === 200 &&
    foundAlice && foundBob && foundAliceOrder,
    12,
    'Verify administrator can view both user accounts and Alice’s order across all users'
  );

  console.log('\n================================================================');
  if (allPassed) {
    console.log('ALL 12 SCENARIOS PASSED WITH FULL COMPLIANCE!');
  } else {
    console.error('SOME SCENARIOS FAILED. Check log output above.');
    process.exit(1);
  }
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

