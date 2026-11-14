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
import { GiftHampers } from './pages/public/GiftHampers';
import { Courses } from './pages/public/Courses';
import { CourseDetail } from './pages/public/CourseDetail';
import { Checkout } from './pages/public/Checkout';
import { Shop } from './pages/public/Shop';
import { ProductDetail } from './pages/public/ProductDetail';
import { CartPage } from './pages/public/CartPage';
import { WishlistPage } from './pages/public/WishlistPage';
import { ProductCheckout } from './pages/public/ProductCheckout';
import { OrderConfirmed } from './pages/public/OrderConfirmed';
import { OrderTrackingPage } from './pages/public/OrderTrackingPage';
import { About } from './pages/public/About';
import { SignIn } from './pages/public/SignIn';
import { SignUp } from './pages/public/SignUp';
import { ForgotPassword } from './pages/public/ForgotPassword';
import { NotFound } from './pages/public/NotFound';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CourseClassroom } from './pages/student/CourseClassroom';
import { MyCourses } from './pages/student/MyCourses';
import { MyLearning } from './pages/student/MyLearning';
import { StudentProfile } from './pages/student/StudentProfile';
import { MyPurchases } from './pages/student/MyPurchases';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminCourseEdit } from './pages/admin/AdminCourseEdit';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminVideos } from './pages/admin/AdminVideos';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminProductOrders } from './pages/admin/AdminProductOrders';
import { AdminHamperOrders } from './pages/admin/AdminHamperOrders';
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
            <Route path="/gift-hampers" element={<GiftHampers />} />
            <Route path="/gift-hampers/order" element={<GiftHampers />} />
            <Route path="/track-order/:orderNumber" element={<OrderTrackingPage />} />
            <Route path="/track-hamper/:orderNumber" element={<OrderTrackingPage />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:slug" element={<ProductDetail />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:slug" element={<ErrorBoundary><CourseDetail /></ErrorBoundary>} />
            <Route path="/checkout/:courseId" element={<Checkout />} />
            <Route path="/about" element={<Navigate to="/#about" replace />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Redirect /admin/login to shared /signin as required */}
            <Route path="/admin/login" element={<Navigate to="/signin" replace />} />
          </Route>

          {/* Student & Shopper Authenticated Commerce Routes */}
          <Route
            element={
              <ProtectedRoute requireStudent>
                <PublicLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/cart" element={<CartPage />} />
            <Route path="/product-checkout" element={<ProductCheckout />} />
            <Route path="/order-confirmed/:orderNumber" element={<OrderConfirmed />} />
            <Route path="/orders/:orderNumber/track" element={<OrderTrackingPage />} />
            <Route element={<StudentLayout />}>
              <Route path="/learn" element={<StudentDashboard />} />
              <Route path="/my-courses" element={<MyCourses />} />
              <Route path="/my-learning" element={<MyLearning />} />
              <Route path="/wishlist" element={<WishlistPage />} />
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
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="courses/new" element={<AdminCourseEdit />} />
            <Route path="courses/:id/edit" element={<AdminCourseEdit />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="product-orders" element={<AdminProductOrders />} />
            <Route path="hamper-orders" element={<AdminHamperOrders />} />
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
