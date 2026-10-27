# Cakexperiment — Premium Cake-Baking Academy & Masterclasses

A production-quality frontend application for **Cakexperiment**, an elegant online cake-baking academy where users can discover, purchase, and master baking and cake decorating crafts through structured video lessons.

---

## Brand Aesthetic — Strawberry Cream

- **Cream (`#FFF8F5`)**: Primary backgrounds and clean surfaces.
- **Blush (`#F4DDE0`)**: Secondary sections, cards, and subtle accents.
- **Rose (`#DCA5AF`)**: Decorative dividers and border highlights.
- **Berry (`#A95768`)**: Primary action buttons, active states, and emphasis badges.
- **Plum (`#57333A`)**: Refined typography, brand headlines, and dark luxury surfaces.

### Typography
- **Display Headlines**: *Cormorant Garamond* (Weights 500, 600, 700)
- **Body & Interface**: *DM Sans* (Weights 400, 500, 600, 700)
- **Calligraphic Accents**: *Allura* (Refined script highlights)

---

## Unified Authentication & Demo Credentials

The platform features a **single unified authentication entry point** at `/signin` and registration at `/signup`. Role detection is automatic:

### 1. Administrator Account
- **Email:** `admin@cakexperiment.demo`
- **Password:** `Admin@12345`
- **Role:** `admin`
- **Redirects To:** `/admin` (Admin Operations Portal)

### 2. Normal Student Account
- **Email:** `student@cakexperiment.demo`
- **Password:** `Student@12345`
- **Role:** `student`
- **Redirects To:** `/learn` (Student Classroom Dashboard)

*(Quick 1-click credential fill buttons are provided on the `/signin` screen for rapid testing.)*

---

## Application Architecture & Routing

### A. Public Website
- `/` — Homepage featuring all 10 required sections:
  1. Hero Section (with `Strawberry Blush Cake Still Life.png` artwork, Cormorant serif headline, Allura script, 4 benefit pill badges, Watch Trailer modal, and Explore CTA)
  2. About Us — Studio philosophy & brand narrative
  3. Featured Courses — Luxury masterclasses with ₹499 INR default pricing
  4. What You'll Learn — 4 culinary pillars
  5. Meet the Instructor — Chef Camille Laurent biography & philosophy
  6. Student Testimonials — Real student feedback and cake outcomes
  7. The Learning Experience — 4-step progressive timeline
  8. FAQ — Accessible interactive accordion
  9. Final CTA — "Your Next Beautiful Creation Starts Here"
  10. Footer — Complete brand directory, links & studio concierge contacts
- `/courses` — Comprehensive Course Marketplace with live search, dynamic category pills, multi-criteria filters (price, skill level, duration, enrolled status), and functional sorting.
- `/courses/:slug` — Coursera-inspired structured course detail page with expandable modules, preview lessons, instructor profile, and simulated instant checkout modal.
- `/about` — Dedicated studio story and heritage page.
- `/signin` — Unified sign-in page with demo credentials helper.
- `/signup` — Unified registration (automatically creates student role).
- `/forgot-password` — Password recovery flow.

### B. Student Experience (`/learn`)
- `/learn` — Student Dashboard with enrollment progress, resume lesson shortcut, and metrics.
- `/learn/:courseId` — Interactive Classroom with HTML5 video player, module & lesson sidebar, lesson completion checkboxes, and downloadable recipe cards.
- `/my-courses` — Enrolled courses cards and progress tracking.
- `/my-learning` — Detailed progress statistics and completed diplomas.
- `/profile` — Student profile and notification preferences.
- `/my-purchases` & `/payment-history` — Digital invoices, receipts, and order ledger.

### C. Admin Dashboard (`/admin`)
- `/admin` — High-level KPI overview (derived from demo data: Revenue ₹, Orders, Students, Courses).
- `/admin/courses` — Course CRUD table with search, publish toggles, and deletion.
- `/admin/courses/new` & `/admin/courses/:id/edit` — Comprehensive masterclass editor with **default ₹499 INR pricing** and an interactive curriculum builder (add/remove modules & lessons).
- `/admin/categories` — Taxonomy management with name, slug, description, image, and modal editor.
- `/admin/videos` — Video streams library and duration registry.
- `/admin/users` — Student accounts list with suspension/activation toggles.
- `/admin/orders` — Real-time order ledger.
- `/admin/payments` — Transaction ledger with simulated refund capabilities.
- `/admin/reviews` — Testimonial moderation (Approve, Hide, Delete).
- `/admin/settings` — Platform parameters, store currency, and contact info.

---

## Local Development & Build

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Compile production bundle
npm run build
```

---

## Data Persistence

All demo accounts, courses, categories, enrollments, simulated orders, and payments are managed through a centralized local storage service (`src/services/storage.ts`) and persist seamlessly across browser refreshes.
