export type Role = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  status: 'active' | 'suspended';
  bio?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  status: 'active' | 'inactive';
  courseCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceAttachment {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'recipe' | 'template';
  size: string;
  url: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  videoReference: string;
  duration: string; // e.g. "12:45"
  durationSeconds?: number;
  isPreview: boolean;
  status: 'published' | 'draft';
  order: number;
  resources?: ResourceAttachment[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';

export interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnail: string;
  previewMedia: string;
  categoryId: string;
  categoryName?: string;
  instructorId: string;
  instructorName: string;
  instructorAvatar: string;
  instructorBio: string;
  skillLevel: SkillLevel;
  learningOutcomes: string[];
  prerequisites: string[];
  equipmentNeeded: string[];
  price: number; // in INR
  originalPrice?: number;
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  totalDuration: string;
  moduleCount: number;
  lessonCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  modules?: Module[];
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  orderId: string;
  purchasedAt: string;
  progress: number; // 0 - 100 %
  completedLessonIds: string[];
  lastAccessedLessonId?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string;
  amount: number;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  orderStatus: 'completed' | 'processing' | 'cancelled' | 'refunded';
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  userName: string;
  courseTitle: string;
  amount: number;
  provider: 'Stripe (Simulated)' | 'Razorpay (Simulated)' | 'UPI (Simulated)';
  paymentMethod: 'Credit Card' | 'Debit Card' | 'UPI' | 'Net Banking';
  transactionReference: string;
  status: 'successful' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  courseId: string;
  courseTitle: string;
  rating: number;
  comment: string;
  studentCreationImg?: string;
  status: 'approved' | 'pending' | 'hidden';
  createdAt: string;
}

export interface AcademySettings {
  academyName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  currencySymbol: string;
  defaultCoursePrice: number;
  maintenanceMode: boolean;
}
