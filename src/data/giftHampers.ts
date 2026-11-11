export interface HamperOption {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice: number;
  badge?: string;
  image: string;
  description: string;
  includes: string[];
  features: string[];
}

export const GIFT_HAMPERS: HamperOption[] = [
  {
    id: 'signature',
    name: 'Artisan Keepsake Gift Hamper',
    tagline: 'A Box Full of Sweetness, Tradition & Celebration',
    price: 1599,
    originalPrice: 1999,
    badge: 'Pre-Order Only',
    image: '/images/gift-hamper-poster.jpg',
    description:
      'Handcrafted luxury gift box featuring an ornate keepsake lid, brass latch closure, and satin lining — filled with artisanal chocolates, freshly baked butter cookies, and gourmet savoury mixture.',
    includes: [
      '6 to 9 Assorted Nut-Loaded Handcrafted Chocolates (Milk | Dark | White)',
      '1 Glass Jar Artisan Melt-in-Mouth Butter Cookies',
      '1 Glass Jar Gourmet Royal Savoury Mixture',
      'Premium Luxury Keepsake Gift Box Packaging',
      'Complimentary Custom Gold-Embossed Greeting Card & Satin Ribbon'
    ],
    features: ['100% Handcrafted', 'Eggless & Freshly Made', 'Customizable Requirements', 'Pan-India Express Shipping']
  }
];

export const OCCASION_OPTIONS = [
  'Birthday Celebration',
  'Anniversary Milestone',
  'Festival & Festive Gifting',
  'Corporate & Client Appreciation',
  'Wedding & Engagement Favor',
  'Housewarming / New Beginnings',
  'Token of Love & Appreciation / Just Because'
];

export const RIBBON_OPTIONS = [
  { id: 'gold', name: 'Royal Gold & Ivory Ribbon', color: '#D4AF37' },
  { id: 'emerald', name: 'Regal Emerald Teal Ribbon', color: '#1A535C' },
  { id: 'burgundy', name: 'Crimson Burgundy Ribbon', color: '#A95768' }
];

export const STUDIO_WHATSAPP_NUMBER = '918248957918';
