async function testApi() {
  const loginRes = await fetch('http://localhost:5173/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 's.sanjay.01.03.2006@gmail.com',
      password: '101010'
    })
  });
  const loginData = await loginRes.json();
  console.log('Login:', loginData.user?.email, 'Token exists:', !!loginData.token);
  const token = loginData.token;

  // 1. Get user courses
  const userCoursesRes = await fetch('http://localhost:5173/api/user/courses', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const userCourses = await userCoursesRes.json();
  console.log('User Enrolled Courses count:', userCourses.courses?.length);
  if (userCourses.courses) {
    userCourses.courses.forEach(c => {
      console.log(` - ID: ${c.course_id || c.id}, Title: ${c.title}, Slug: ${c.slug}`);
    });
  }

  // 2. Test classroom for each
  for (const c of (userCourses.courses || [])) {
    const cid = c.course_id || c.id;
    const res = await fetch(`http://localhost:5173/api/courses/${cid}/classroom`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Classroom API for ${cid}: Status ${res.status}`);
    if (res.ok) {
      const d = await res.json();
      console.log(`   Title: ${d.course?.title}, Modules: ${d.course?.modules?.length}, First lesson: ${d.course?.modules?.[0]?.lessons?.[0]?.title}`);
    } else {
      const err = await res.text();
      console.log(`   Error: ${err}`);
    }
  }
}

testApi().catch(console.error);

