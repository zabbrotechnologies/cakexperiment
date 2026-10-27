import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { StudentLayout } from './components/layout/StudentLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { Home } from './pages/public/Home';
import { Courses } from './pages/public/Courses';
import { CourseDetail } from './pages/public/CourseDetail';
import { About } from './pages/public/About';
import { SignIn } from './pages/public/SignIn';
import { SignUp } from './pages/public/SignUp';
import { ForgotPassword } from './pages/public/ForgotPassword';
import { NotFound } from './pages/public/NotFound';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CourseClassroom } from './pages/student/CourseClassroom';
import { MyCourses } from './pages/student/MyCourses';
import { MyLearning } from './pages/student/MyLearning';
import { StudentProfile } from './pages/student/StudentProfile';
import { MyPurchases } from './pages/student/MyPurchases';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminCourseEdit } from './pages/admin/AdminCourseEdit';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminVideos } from './pages/admin/AdminVideos';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminSettings } from './pages/admin/AdminSettings';

// Public Layout Wrapper with Smooth Route Transition
const PublicLayout: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    // Only scroll to top if there is no hash in the URL
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname, location.hash]);

  const isHome = location.pathname === '/';

  return (
    <>
      <Navbar />
      <main key={location.pathname} className={`page-transition ${isHome ? 'home-main' : 'subpage-main'}`}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          
          {/* Public Web Experience */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:slug" element={<CourseDetail />} />
            <Route path="/about" element={<Navigate to="/#about" replace />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Redirect /admin/login to shared /signin as required */}
            <Route path="/admin/login" element={<Navigate to="/signin" replace />} />
          </Route>

          {/* Student Dedicated Experience (Protected) */}
          <Route
            element={
              <ProtectedRoute requireStudent>
                <PublicLayout />
              </ProtectedRoute>
            }
          >
            <Route element={<StudentLayout />}>
              <Route path="/learn" element={<StudentDashboard />} />
              <Route path="/my-courses" element={<MyCourses />} />
              <Route path="/my-learning" element={<MyLearning />} />
              <Route path="/profile" element={<StudentProfile />} />
              <Route path="/my-purchases" element={<MyPurchases />} />
              <Route path="/payment-history" element={<MyPurchases />} />
            </Route>
          </Route>

          {/* Distraction-Free Video Classroom (Protected) */}
          <Route
            path="/learn/:courseId"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <CourseClassroom />
                </>
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard & Management Portal (Admin-Only Protected) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="courses/new" element={<AdminCourseEdit />} />
            <Route path="courses/:id/edit" element={<AdminCourseEdit />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Branded 404 Route */}
          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
