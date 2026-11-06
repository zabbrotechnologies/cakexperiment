async function testProgress() {
  const loginRes = await fetch('http://localhost:5173/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 's.sanjay.01.03.2006@gmail.com',
      password: '101010'
    })
  });
  const { token, user } = await loginRes.json();
  console.log('Logged in user:', user.id);

  // Get classroom for course-4 to get a valid lesson ID
  const classRes = await fetch('http://localhost:5173/api/courses/course-4/classroom', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const classData = await classRes.json();
  const lesson = classData.course.modules[0].lessons[0];
  console.log('Testing with Lesson:', lesson.id, lesson.title);

  // Send progress toggle
  const progRes = await fetch('http://localhost:5173/api/user/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      courseId: 'course-4',
      lessonId: lesson.id,
      completed: true
    })
  });

  console.log('POST /api/user/progress Status:', progRes.status);
  const progData = await progRes.text();
  console.log('POST /api/user/progress Response:', progData);

  // Now check /api/user/courses
  const coursesRes = await fetch('http://localhost:5173/api/user/courses', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const coursesData = await coursesRes.json();
  const c4 = coursesData.courses.find(c => (c.course_id || c.id) === 'course-4');
  console.log('course-4 in /api/user/courses:', {
    progress: c4?.progress,
    completed_lessons: c4?.completed_lessons
  });
}

testProgress().catch(console.error);

