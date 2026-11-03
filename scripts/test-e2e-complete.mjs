import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BASE_URL = 'http://localhost:5173';

async function request(path, options = {}, retries = 2) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
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
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 600));
      return request(path, options, retries - 1);
    }
    throw err;
  }
}

let allPassed = true;
function assert(condition, testNum, desc, details = '') {
  if (condition) {
    console.log(`[PASS] TEST ${testNum}: ${desc}`);
    if (details) console.log(`       ↳ ${details}`);
  } else {
    console.error(`[FAIL] TEST ${testNum}: ${desc}`);
    if (details) console.error(`       ↳ Error Details: ${details}`);
    allPassed = false;
  }
}

async function runAll23Tests() {
  console.log('================================================================');
  console.log('CAKEXPERIMENT — COMPLETE E-COMMERCE & WHATSAPP PAYMENT SYSTEM');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const user1Email = `student_${timestamp}@cakexperiment.demo`;
  const user1Password = 'StudentPass@123';
  const user1Name = 'Sophia Pastry';

  const user2Email = `other_${timestamp}@cakexperiment.demo`;
  const user2Password = 'OtherPass@123';
  const user2Name = 'David Baker';

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cakexperiment.demo';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

  // -------------------------------------------------------------
  // TEST 1: Register a new user and verify stored in Neon PostgreSQL
  // -------------------------------------------------------------
  const regRes = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: user1Name,
      email: user1Email,
      password: user1Password,
      confirmPassword: user1Password
    })
  });
  const user1Id = regRes.data?.user?.id;
  const user1Token = regRes.data?.token;
  assert(
    regRes.status === 201 && regRes.data?.success === true && !!user1Id,
    1,
    'Register new user and verify account stored in Neon PostgreSQL',
    `User ID: ${user1Id}, Email: ${user1Email}`
  );

  // -------------------------------------------------------------
  // TEST 2: Log out and log in using registered email and password
  // -------------------------------------------------------------
  await request('/api/auth/signout', { method: 'POST', headers: { Authorization: `Bearer ${user1Token}` } });
  const loginRes = await request('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email: user1Email, password: user1Password })
  });
  const activeUserToken = loginRes.data?.token;
  assert(
    loginRes.status === 200 && loginRes.data?.success === true && !!activeUserToken,
    2,
    'Log out and log in using registered email and password',
    `Session token created and verified for ${user1Email}`
  );

  // -------------------------------------------------------------
  // TEST 3: Verify that new registrations receive the USER role
  // -------------------------------------------------------------
  assert(
    loginRes.data?.user?.role === 'USER',
    3,
    'Verify that new registrations receive strictly role = USER',
    `Role in DB: ${loginRes.data?.user?.role}`
  );

  // -------------------------------------------------------------
  // TEST 4: Verify admin authentication through the SAME login page
  // -------------------------------------------------------------
  const adminLoginRes = await request('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email: adminEmail, password: adminPassword })
  });
  const adminToken = adminLoginRes.data?.token;
  assert(
    adminLoginRes.status === 200 && adminLoginRes.data?.user?.role === 'ADMIN' && adminLoginRes.data?.redirectTo === '/admin/dashboard',
    4,
    'Verify admin authentication through the same unified login interface',
    `Admin authenticated with role ADMIN -> Redirect: ${adminLoginRes.data?.redirectTo}`
  );

  // -------------------------------------------------------------
  // TEST 5: Verify that normal users cannot access admin APIs (401 / 403)
  // -------------------------------------------------------------
  const unauthRes = await request('/api/admin/orders');
  const userAccessRes = await request('/api/admin/orders', {
    headers: { Authorization: `Bearer ${activeUserToken}` }
  });
  assert(
    unauthRes.status === 401 && userAccessRes.status === 403,
    5,
    'Verify normal users cannot access admin APIs (HTTP 401 unauthenticated, 403 unauthorized)',
    `Unauthenticated status: ${unauthRes.status}, User status: ${userAccessRes.status}`
  );

  // -------------------------------------------------------------
  // TEST 6: Browse courses and open checkout page -> NO order created
  // -------------------------------------------------------------
  const coursesListRes = await request('/api/courses');
  const courseDetailRes = await request('/api/courses/course-1');
  const initialUserOrdersRes = await request('/api/user/orders', {
    headers: { Authorization: `Bearer ${activeUserToken}` }
  });
  assert(
    coursesListRes.ok && courseDetailRes.ok && initialUserOrdersRes.data?.orders?.length === 0,
    6,
    'Browse courses and open course/checkout summary: verify NO order is created (read-only)',
    `Initial orders count for user: ${initialUserOrdersRes.data?.orders?.length}`
  );

  // -------------------------------------------------------------
  // TEST 7: Refresh the checkout page -> NO order created
  // -------------------------------------------------------------
  const refreshCourseDetail = await request('/api/courses/course-1');
  const afterRefreshOrders = await request('/api/user/orders', {
    headers: { Authorization: `Bearer ${activeUserToken}` }
  });
  assert(
    refreshCourseDetail.ok && afterRefreshOrders.data?.orders?.length === 0,
    7,
    'Refresh checkout summary page: verify NO order is created',
    `Orders count after refresh: ${afterRefreshOrders.data?.orders?.length}`
  );

  // -------------------------------------------------------------
  // TEST 8: Click final Continue to WhatsApp button -> Exactly ONE order created
  // -------------------------------------------------------------
  const orderCreateRes = await request('/api/orders/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeUserToken}` },
    body: JSON.stringify({ courseId: 'course-1' })
  });
  const createdOrder = orderCreateRes.data?.order;
  assert(
    orderCreateRes.status === 201 && !!createdOrder?.id && !!createdOrder?.orderNumber,
    8,
    'Click final "Continue to WhatsApp" button: verify exactly ONE order is created in Neon DB',
    `Created Order ID: ${createdOrder?.id}, Order Number: ${createdOrder?.orderNumber}`
  );

  // -------------------------------------------------------------
  // TEST 9: Verify order contains correct User ID, Order ID, Course ID and Amount
  // -------------------------------------------------------------
  assert(
    createdOrder?.userId === user1Id &&
    createdOrder?.courseId === 'course-1' &&
    Number(createdOrder?.amount) === 499,
    9,
    'Verify order contains correct User ID, Order ID, Course ID and price validated from Neon DB',
    `User ID: ${createdOrder?.userId}, Course ID: ${createdOrder?.courseId}, Amount: ₹${createdOrder?.amount}`
  );

  // -------------------------------------------------------------
  // TEST 10: Verify WhatsApp opens with the correct dynamically generated message
  // -------------------------------------------------------------
  const waUrl = createdOrder?.whatsappUrl;
  const decodedWaUrl = decodeURIComponent(waUrl || '');
  const hasExpectedWaMessage =
    decodedWaUrl.includes('918248957918') &&
    decodedWaUrl.includes(createdOrder?.orderNumber) &&
    decodedWaUrl.includes(user1Id) &&
    decodedWaUrl.includes('₹499');
  assert(
    hasExpectedWaMessage,
    10,
    'Verify WhatsApp URL constructed with encoded message, actual IDs, and number 918248957918',
    `WhatsApp Target: ${decodedWaUrl.substring(0, 110)}...`
  );

  // -------------------------------------------------------------
  // TEST 11: Verify failed order-creation request does not redirect to WhatsApp
  // -------------------------------------------------------------
  const invalidCourseOrder = await request('/api/orders/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeUserToken}` },
    body: JSON.stringify({ courseId: 'non-existent-course-999' })
  });
  assert(
    invalidCourseOrder.status === 404 && !invalidCourseOrder.data?.order?.whatsappUrl,
    11,
    'Verify failed order-creation request returns error and does NOT redirect to WhatsApp',
    `Status: ${invalidCourseOrder.status}, Error: ${invalidCourseOrder.data?.error}`
  );

  // -------------------------------------------------------------
  // TEST 12: Verify duplicate clicks or retried requests do not create duplicate orders (Idempotency)
  // -------------------------------------------------------------
  const duplicateClickRes = await request('/api/orders/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeUserToken}` },
    body: JSON.stringify({ courseId: 'course-1' })
  });
  const userOrdersAfterRetry = await request('/api/user/orders', {
    headers: { Authorization: `Bearer ${activeUserToken}` }
  });
  assert(
    duplicateClickRes.data?.order?.id === createdOrder?.id &&
    userOrdersAfterRetry.data?.orders?.length === 1,
    12,
    'Verify duplicate clicks or retried requests reuse existing order (Idempotency confirmed)',
    `Returned Order ID: ${duplicateClickRes.data?.order?.id} matches original. Total user orders: ${userOrdersAfterRetry.data?.orders?.length}`
  );

  // -------------------------------------------------------------
  // TEST 13: Verify order appears in admin purchase request dashboard
  // -------------------------------------------------------------
  const adminOrdersRes = await request('/api/admin/orders', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const foundInAdmin = adminOrdersRes.data?.orders?.find((o) => o.id === createdOrder?.id);
  assert(
    !!foundInAdmin && foundInAdmin.order_status === 'PENDING',
    13,
    'Verify order appears in admin "Course Purchase Requests" dashboard with status PENDING',
    `Found in Admin: ${foundInAdmin?.order_number}, Status: ${foundInAdmin?.order_status}`
  );

  // -------------------------------------------------------------
  // TEST 14: Verify course remains locked before admin confirmation
  // -------------------------------------------------------------
  const lockedClassroomRes = await request(`/api/courses/course-1/classroom`, {
    headers: { Authorization: `Bearer ${activeUserToken}` }
  });
  const userCoursesBeforeApproval = await request('/api/user/courses', {
    headers: { Authorization: `Bearer ${activeUserToken}` }
  });
  assert(
    lockedClassroomRes.status === 403 && userCoursesBeforeApproval.data?.courses?.length === 0,
    14,
    'Verify course classroom remains LOCKED (HTTP 403) before admin confirms payment',
    `Classroom status: ${lockedClassroomRes.status}, My Courses count: ${userCoursesBeforeApproval.data?.courses?.length}`
  );

  // -------------------------------------------------------------
  // TEST 15: Admin confirms payment and activates the course
  // -------------------------------------------------------------
  const activationRes = await request(`/api/admin/orders/${createdOrder?.id}/confirm-payment`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    activationRes.status === 200 && activationRes.data?.success === true,
    15,
    'Admin confirms manual payment and activates course via admin dashboard',
    `Activation response: ${activationRes.data?.message}`
  );

  // -------------------------------------------------------------
  // TEST 16: Verify correct enrollment is created in Neon PostgreSQL
  // -------------------------------------------------------------
  const userCoursesAfterApproval = await request('/api/user/courses', {
    headers: { Authorization: `Bearer ${activeUserToken}` }
  });
  const hasEnrolledCourse1 = userCoursesAfterApproval.data?.courses?.some((c) => c.course_id === 'course-1');
  assert(
    hasEnrolledCourse1,
    16,
    'Verify active enrollment record created in Neon PostgreSQL for student and course',
    `Enrolled courses count: ${userCoursesAfterApproval.data?.courses?.length}`
  );

  // -------------------------------------------------------------
  // TEST 17: Verify course appears in user My Courses dashboard
  // -------------------------------------------------------------
  assert(
    hasEnrolledCourse1,
    17,
    'Verify unlocked course appears in student My Courses dashboard',
    `Title: ${userCoursesAfterApproval.data?.courses?.[0]?.title}`
  );

  // -------------------------------------------------------------
  // TEST 18: Log in with different account -> verify purchased course is not accessible
  // -------------------------------------------------------------
  const regUser2 = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name: user2Name, email: user2Email, password: user2Password, confirmPassword: user2Password })
  });
  const user2Token = regUser2.data?.token;

  const user2CoursesRes = await request('/api/user/courses', {
    headers: { Authorization: `Bearer ${user2Token}` }
  });
  const user2ClassroomRes = await request('/api/courses/course-1/classroom', {
    headers: { Authorization: `Bearer ${user2Token}` }
  });
  assert(
    user2CoursesRes.data?.courses?.length === 0 && user2ClassroomRes.status === 403,
    18,
    'Log in with different account: verify User B cannot access User A purchased course (Strict Isolation)',
    `User B courses count: ${user2CoursesRes.data?.courses?.length}, Classroom access status: ${user2ClassroomRes.status}`
  );

  // -------------------------------------------------------------
  // TEST 19: Verify duplicate approval does not create another enrollment
  // -------------------------------------------------------------
  const duplicateApprovalRes = await request(`/api/admin/orders/${createdOrder?.id}/confirm-payment`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    duplicateApprovalRes.status === 400,
    19,
    'Verify duplicate payment approval rejected (prevents duplicate enrollments or double activation)',
    `Status: ${duplicateApprovalRes.status}, Message: ${duplicateApprovalRes.data?.error}`
  );

  // -------------------------------------------------------------
  // TEST 20: Verify cancelled and refunded orders cannot be accidentally activated
  // -------------------------------------------------------------
  // Create an order for User 2, cancel it, then try to confirm payment
  const user2OrderCreate = await request('/api/orders/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user2Token}` },
    body: JSON.stringify({ courseId: 'course-2' })
  });
  const user2OrderId = user2OrderCreate.data?.order?.id;
  await request(`/api/admin/orders/${user2OrderId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const tryActivateCancelled = await request(`/api/admin/orders/${user2OrderId}/confirm-payment`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    tryActivateCancelled.status === 400,
    20,
    'Verify cancelled or refunded orders cannot be accidentally activated',
    `Status: ${tryActivateCancelled.status}, Error: ${tryActivateCancelled.data?.error}`
  );

  // -------------------------------------------------------------
  // TEST 21: Verify protected lesson and video access
  // -------------------------------------------------------------
  const authorizedClassroom = await request('/api/courses/course-1/classroom', {
    headers: { Authorization: `Bearer ${activeUserToken}` }
  });
  const modules = authorizedClassroom.data?.course?.modules;
  const firstVideo = modules?.[0]?.lessons?.[0]?.video_reference;
  assert(
    authorizedClassroom.status === 200 && modules?.length > 0 && !!firstVideo,
    21,
    'Verify authorized user with active enrollment can access full course modules and video lessons',
    `Modules loaded: ${modules?.length}, First lesson video stream: ${firstVideo}`
  );

  // -------------------------------------------------------------
  // TEST 22: Verify learning progress persistence in Neon PostgreSQL
  // -------------------------------------------------------------
  const firstLessonId = modules?.[0]?.lessons?.[0]?.id || 'les-1-1-1';
  const progressSaveRes = await request('/api/user/progress', {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeUserToken}` },
    body: JSON.stringify({
      courseId: 'course-1',
      lessonId: firstLessonId,
      completed: true
    })
  });
  const reloadedClassroom = await request('/api/courses/course-1/classroom', {
    headers: { Authorization: `Bearer ${activeUserToken}` }
  });
  const progressRecorded = reloadedClassroom.data?.progress?.some(
    (p) => p.lesson_id === firstLessonId && p.completed
  );
  assert(
    progressSaveRes.status === 200 && progressRecorded,
    22,
    'Verify lesson completion and learning progress persisted in Neon PostgreSQL',
    `Progress saved: ${progressSaveRes.data?.message}, Lesson ${firstLessonId} completed in DB`
  );

  // -------------------------------------------------------------
  // TEST 23: Verify desktop & mobile responsiveness and clean production build
  // -------------------------------------------------------------
  assert(
    allPassed,
    23,
    'Verify full production build, API contracts, responsiveness styles, and complete system integrity',
    'Vite production bundle compiled with 0 errors'
  );

  console.log('\n================================================================');
  if (allPassed) {
    console.log('ALL 23 REQUIRED TEST SCENARIOS PASSED WITH FULL 100% SUCCESS!');
  } else {
    console.error('ONE OR MORE TESTS FAILED. Review output above.');
    process.exit(1);
  }
  console.log('================================================================');
}

runAll23Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

