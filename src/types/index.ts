export type Role = 'USER' | 'ADMIN' | 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  status?: 'active' | 'suspended';
  emailVerified?: boolean;
  bio?: string;
  createdAt?: string;
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
  short_description?: string;
  description: string;
  thumbnail: string;
  image?: string;
  previewMedia: string;
  preview_media?: string;
  categoryId: string;
  categoryName?: string;
  category_id?: string;
  category_name?: string;
  instructorId: string;
  instructorName: string;
  instructor_name?: string;
  instructorAvatar: string;
  instructor_avatar?: string;
  instructorBio: string;
  instructor_bio?: string;
  skillLevel: SkillLevel;
  skill_level?: SkillLevel;
  learningOutcomes: string[];
  prerequisites: string[];
  equipmentNeeded: string[];
  price: number; // in INR
  originalPrice?: number;
  original_price?: number;
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  totalDuration: string;
  total_duration?: string;
  moduleCount: number;
  modulesCount?: number;
  modules_count?: number;
  lessonCount: number;
  lessonsCount?: number;
  lessons_count?: number;
  rating: number;
  reviewCount: number;
  reviewsCount?: number;
  reviews_count?: number;
  createdAt: string;
  updatedAt: string;
  modules?: Module[];
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  orderId?: string;
  purchasedAt?: string;
  activatedAt?: string;
  status?: 'ACTIVE' | 'REVOKED' | 'active';
  progress: number; // 0 - 100 %
  completedLessonIds?: string[];
  lastAccessedLessonId?: string;
  title?: string;
  slug?: string;
  tag?: string;
  thumbnail?: string;
  image?: string;
  instructorName?: string;
  totalDuration?: string;
  modulesCount?: number;
  lessonsCount?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  courseId?: string;
  courseTitle?: string;
  courseName?: string;
  courseThumbnail?: string;
  amount: number;
  totalAmount?: number;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded' | 'AWAITING_CONFIRMATION' | 'CONFIRMED' | 'NOT_CONFIRMED';
  orderStatus: 'completed' | 'processing' | 'cancelled' | 'refunded' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  courseAccessStatus?: 'LOCKED' | 'ACTIVE' | 'UNLOCKED';
  paymentMethod?: string;
  whatsappUrl?: string;
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
  provider?: string;
  paymentMethod: string;
  transactionReference: string;
  status: 'successful' | 'pending' | 'failed' | 'refunded' | 'AWAITING_CONFIRMATION' | 'CONFIRMED' | 'NOT_CONFIRMED';
  confirmedBy?: string;
  confirmedAt?: string;
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

// ==========================================
// E-COMMERCE BAKERY PRODUCTS & ORDER TRACKING
// ==========================================

export type ProductTrackingStatus =
  | 'ORDER_RECEIVED'
  | 'IN_KITCHEN'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface BakeryProduct {
  id: string;
  name: string;
  slug: string;
  category: 'Cakes' | 'Cupcakes' | 'Pastries' | 'Brownies' | 'Cheesecakes' | 'Tarts' | 'Desserts';
  price: number;
  originalPrice?: number;
  weight?: string; // e.g. "500g", "1 Kg", "Box of 6"
  description: string;
  image: string;
  isEggless: boolean;
  featured?: boolean;
  inStock: boolean;
  rating?: number;
  badge?: string; // e.g. "Bestseller", "Chef Special", "Fresh Today", "Trending"
  createdAt?: string;
}

export interface BakeryOrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  weight?: string;
  isEggless?: boolean;
}

export interface BakeryOrder {
  id: string;
  orderNumber: string; // e.g. "CK-BK-7492"
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryDate?: string;
  messageOnCake?: string;
  specialInstructions?: string;
  items: BakeryOrderItem[];
  totalAmount: number;
  paymentMethod: 'ONLINE' | 'COD' | 'WHATSAPP_UPI';
  paymentStatus: 'PAID' | 'PENDING';
  trackingStatus: ProductTrackingStatus;
  statusHistory?: {
    status: ProductTrackingStatus;
    timestamp: string;
    note?: string;
  }[];
  whatsappUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

