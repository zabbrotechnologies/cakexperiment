import {
  User,
  Category,
  Course,
  Module,
  Lesson,
  Enrollment,
  Order,
  Payment,
  Review,
  AcademySettings
} from '../types';

// Predefined Demo Credentials
export const DEMO_ADMIN = {
  email: 'admin@cakexperiment.demo',
  password: 'Admin@12345',
  role: 'admin' as const
};

export const DEMO_STUDENT = {
  email: 'student@cakexperiment.demo',
  password: 'Student@12345',
  role: 'student' as const
};

const STORAGE_KEYS = {
  USERS: 'cakexperiment_users',
  CATEGORIES: 'cakexperiment_categories',
  COURSES: 'cakexperiment_courses',
  MODULES: 'cakexperiment_modules',
  ENROLLMENTS: 'cakexperiment_enrollments',
  ORDERS: 'cakexperiment_orders',
  PAYMENTS: 'cakexperiment_payments',
  REVIEWS: 'cakexperiment_reviews',
  SETTINGS: 'cakexperiment_settings',
  SESSION: 'cakexperiment_session'
};

// Seed Categories
const initialCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Cake Baking',
    slug: 'cake-baking',
    description: 'Master sponge science, moisture retention, crumb structure, and temperature control.',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    courseCount: 3,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'cat-2',
    name: 'Cake Decorating',
    slug: 'cake-decorating',
    description: 'Piping mastery, palette knife floral textures, smooth buttercream finishes, and rosettes.',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    courseCount: 4,
    createdAt: '2026-01-11T10:00:00Z',
    updatedAt: '2026-01-11T10:00:00Z'
  },
  {
    id: 'cat-3',
    name: 'Fondant Art',
    slug: 'fondant-art',
    description: 'Sculpting, sharp edge finishing, sugar flowers, and tiered cake architecture.',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    courseCount: 2,
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-12T10:00:00Z'
  },
  {
    id: 'cat-4',
    name: 'Chocolate Techniques',
    slug: 'chocolate-techniques',
    description: 'Tempering, drip consistency, mirror glazes, chocolate curls, and rich ganache alchemy.',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    courseCount: 2,
    createdAt: '2026-01-13T10:00:00Z',
    updatedAt: '2026-01-13T10:00:00Z'
  },
  {
    id: 'cat-5',
    name: 'Cupcakes & Mini Desserts',
    slug: 'cupcakes-and-desserts',
    description: 'Petite treats, filled centers, Swiss meringue swirls, and display aesthetics.',
    image: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    courseCount: 2,
    createdAt: '2026-01-14T10:00:00Z',
    updatedAt: '2026-01-14T10:00:00Z'
  },
  {
    id: 'cat-6',
    name: 'Modern Celebration Cakes',
    slug: 'celebration-cakes',
    description: 'High-end birthday, baby shower, and wedding centerpiece designs with modern artistic flair.',
    image: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    courseCount: 3,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z'
  }
];

// Modules for course-1 (Buttercream Decoration Masterclass as described in prompt)
const course1Modules: Module[] = [
  {
    id: 'mod-1-1',
    courseId: 'course-1',
    title: 'Module 1: Tools and Preparation',
    description: 'Get familiar with professional equipment, temperature control, and base preparation.',
    order: 1,
    lessons: [
      {
        id: 'les-1-1-1',
        moduleId: 'mod-1-1',
        title: 'Lesson 1: Understanding Piping Tools & Nozzles',
        description: 'Explore Russian piping tips, star nozzles, flower nails, and reusable silicone bags.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: '14:20',
        durationSeconds: 860,
        isPreview: true,
        status: 'published',
        order: 1,
        resources: [
          { id: 'res-1', title: 'Piping Tip Guide & Chart (PDF)', type: 'pdf', size: '2.4 MB', url: '#' },
          { id: 'res-2', title: 'Tool Sourcing Checklist', type: 'recipe', size: '1.1 MB', url: '#' }
        ]
      },
      {
        id: 'les-1-1-2',
        moduleId: 'mod-1-1',
        title: 'Lesson 2: Preparing Silky Swiss Meringue Buttercream',
        description: 'The golden ratio of egg whites, sugar, and European butter for a smooth, stable frosting.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        duration: '18:45',
        durationSeconds: 1125,
        isPreview: false,
        status: 'published',
        order: 2,
        resources: [
          { id: 'res-3', title: 'Master Buttercream Formula & Scale Calculator', type: 'recipe', size: '850 KB', url: '#' }
        ]
      },
      {
        id: 'les-1-1-3',
        moduleId: 'mod-1-1',
        title: 'Lesson 3: Choosing the Right Consistency & Color Theory',
        description: 'Stiff vs medium vs soft piping textures, and formulating muted dusty rose and blush tones.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        duration: '16:10',
        durationSeconds: 970,
        isPreview: false,
        status: 'published',
        order: 3
      }
    ]
  },
  {
    id: 'mod-1-2',
    courseId: 'course-1',
    title: 'Module 2: Essential Techniques',
    description: 'Learn foundational piping movements, petal angles, and continuous borders.',
    order: 2,
    lessons: [
      {
        id: 'les-1-2-1',
        moduleId: 'mod-1-2',
        title: 'Lesson 1: Basic Piping Techniques & Hand Posture',
        description: 'Master wrist pressure, rotation speed on the turntable, and sharp tail cut-offs.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        duration: '21:30',
        durationSeconds: 1290,
        isPreview: false,
        status: 'published',
        order: 1
      },
      {
        id: 'les-1-2-2',
        moduleId: 'mod-1-2',
        title: 'Lesson 2: Creating Dimensional Rosettes & Ruffles',
        description: 'Piping open star rosettes, overlapping petals, and delicate buttercream fabric ruffles.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        duration: '19:15',
        durationSeconds: 1155,
        isPreview: false,
        status: 'published',
        order: 2
      },
      {
        id: 'les-1-2-3',
        moduleId: 'mod-1-2',
        title: 'Lesson 3: Borders, Shells, and Base Finishing',
        description: 'Clean border transitions that ground your cake design and eliminate visible gaps.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: '15:40',
        durationSeconds: 940,
        isPreview: false,
        status: 'published',
        order: 3
      }
    ]
  },
  {
    id: 'mod-1-3',
    courseId: 'course-1',
    title: 'Module 3: Professional Finishing',
    description: 'Achieve razor-sharp cake edges, flawless tier assembly, and photogenic presentation.',
    order: 3,
    lessons: [
      {
        id: 'les-1-3-1',
        moduleId: 'mod-1-3',
        title: 'Lesson 1: Layering, Crumb Coating & Acrylic Disk Smoothing',
        description: 'Learn the secret method used by high-end luxury bakeries for 90-degree crisp corners.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        duration: '24:05',
        durationSeconds: 1445,
        isPreview: false,
        status: 'published',
        order: 1
      },
      {
        id: 'les-1-3-2',
        moduleId: 'mod-1-3',
        title: 'Lesson 2: Combining Floral Decorations with Fresh Berries',
        description: 'Food-safe floral arrangement, stem sealing, and strawberry placement composition.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
        duration: '17:50',
        durationSeconds: 1070,
        isPreview: false,
        status: 'published',
        order: 2
      },
      {
        id: 'les-1-3-3',
        moduleId: 'mod-1-3',
        title: 'Lesson 3: Final Cake Presentation, Photography & Storage',
        description: 'Chilling, transportation guidelines, cutting etiquette, and styling for client delivery.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '12:30',
        durationSeconds: 750,
        isPreview: false,
        status: 'published',
        order: 3
      }
    ]
  }
];

// Modules for course-2
const course2Modules: Module[] = [
  {
    id: 'mod-2-1',
    courseId: 'course-2',
    title: 'Module 1: Sponge Chemistry & Flour Types',
    description: 'Understanding gluten development, fat percentages, and leavening agents.',
    order: 1,
    lessons: [
      {
        id: 'les-2-1-1',
        moduleId: 'mod-2-1',
        title: 'Lesson 1: Flour Proteins & Starch Gelatinization',
        description: 'Why cake flour yields delicate crumb structures that never sink.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: '16:00',
        durationSeconds: 960,
        isPreview: true,
        status: 'published',
        order: 1
      },
      {
        id: 'les-2-1-2',
        moduleId: 'mod-2-1',
        title: 'Lesson 2: The Reverse Creaming Method',
        description: 'The fail-safe technique for ultra-velvety, flat-top cake layers without doming.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        duration: '22:15',
        durationSeconds: 1335,
        isPreview: false,
        status: 'published',
        order: 2
      }
    ]
  },
  {
    id: 'mod-2-2',
    courseId: 'course-2',
    title: 'Module 2: Syrups, Fillings & Moist Assembly',
    description: 'Simple syrups, fruit curds, and structural stability.',
    order: 2,
    lessons: [
      {
        id: 'les-2-2-1',
        moduleId: 'mod-2-2',
        title: 'Lesson 1: Infused Syrups & Moisture Retention',
        description: 'How to soak sponges without turning them soggy or mushy.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        duration: '15:20',
        durationSeconds: 920,
        isPreview: false,
        status: 'published',
        order: 1
      }
    ]
  }
];

// Modules for course-3
const course3Modules: Module[] = [
  {
    id: 'mod-3-1',
    courseId: 'course-3',
    title: 'Module 1: Wafer Paper Architecture & Sails',
    description: 'Learn moisture treatment, shaping, and structural anchoring for gravity-defying sails.',
    order: 1,
    lessons: [
      {
        id: 'les-3-1-1',
        moduleId: 'mod-3-1',
        title: 'Conditioning Wafer Paper & Botanical Steaming',
        description: 'How to hydrate Grade AD wafer paper to achieve flexible fabric-like drape.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        duration: '18:15',
        durationSeconds: 1095,
        isPreview: true,
        status: 'published',
        order: 1
      },
      {
        id: 'les-3-1-2',
        moduleId: 'mod-3-1',
        title: 'Fabricating Translucent Sails & Floating Butterflies',
        description: 'Pinching, pleating, wire-mounting, and airbrushing subtle pastel tints.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        duration: '22:40',
        durationSeconds: 1360,
        isPreview: false,
        status: 'published',
        order: 2
      }
    ]
  },
  {
    id: 'mod-3-2',
    courseId: 'course-3',
    title: 'Module 2: 24k Edible Gold Leaf & Palette Art',
    description: 'Adhering delicate precious metal leaf and painting contemporary textured strokes.',
    order: 2,
    lessons: [
      {
        id: 'les-3-2-1',
        moduleId: 'mod-3-2',
        title: 'Surface Adhesion Chemistry & Leaf Placement',
        description: 'Technique to transfer real gold foil without static tearing or dull fingerprints.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        duration: '14:30',
        durationSeconds: 870,
        isPreview: false,
        status: 'published',
        order: 1
      },
      {
        id: 'les-3-2-2',
        moduleId: 'mod-3-2',
        title: 'Abstract Palette Knife Floral Impressions',
        description: 'Sculpting heavy-body buttercream petal textures directly onto chilled cakes.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '25:10',
        durationSeconds: 1510,
        isPreview: false,
        status: 'published',
        order: 2
      }
    ]
  }
];

// Modules for course-4
const course4Modules: Module[] = [
  {
    id: 'mod-4-1',
    courseId: 'course-4',
    title: 'Module 1: Cocoa Science & Ganache Formulation',
    description: 'Understanding chocolate crystallization, fat curves, and emulsion stability.',
    order: 1,
    lessons: [
      {
        id: 'les-4-1-1',
        moduleId: 'mod-4-1',
        title: 'Couverture Percentages & Emulsion Ratios',
        description: 'Why 70% dark chocolate behaves differently and how to prevent split ganache.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: '19:40',
        durationSeconds: 1180,
        isPreview: true,
        status: 'published',
        order: 1
      },
      {
        id: 'les-4-1-2',
        moduleId: 'mod-4-1',
        title: 'Mirror Glaze Pouring at Precise Viscosity',
        description: 'Reaching bubble-free reflection with gelatin bloom and immersion blender technique.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        duration: '23:15',
        durationSeconds: 1395,
        isPreview: false,
        status: 'published',
        order: 2
      }
    ]
  },
  {
    id: 'mod-4-2',
    courseId: 'course-4',
    title: 'Module 2: Architectural Chocolate Accents',
    description: 'Crafting curls, collars, tempered geometric shards, and velvet spray coats.',
    order: 2,
    lessons: [
      {
        id: 'les-4-2-1',
        moduleId: 'mod-4-2',
        title: 'Acetate Collar Draping & Tempered Curls',
        description: 'Seeding method for dark chocolate to ensure glossy snap and release from plastic.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        duration: '20:00',
        durationSeconds: 1200,
        isPreview: false,
        status: 'published',
        order: 1
      }
    ]
  }
];

// Modules for course-5
const course5Modules: Module[] = [
  {
    id: 'mod-5-1',
    courseId: 'course-5',
    title: 'Module 1: Sponge Chemistry & Center Injections',
    description: 'Baking dome-free delicate cupcakes and infusing artisanal curds.',
    order: 1,
    lessons: [
      {
        id: 'les-5-1-1',
        moduleId: 'mod-5-1',
        title: 'Baking Flat Tops Without Liner Peeling',
        description: 'The science behind oven humidity, butter emulsion, and liner adhesion.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        duration: '15:20',
        durationSeconds: 920,
        isPreview: true,
        status: 'published',
        order: 1
      },
      {
        id: 'les-5-1-2',
        moduleId: 'mod-5-1',
        title: 'Salted Caramel & Passionfruit Curd Core Injection',
        description: 'Using corer cylinders and squeeze bottles to fill moist sponge centers evenly.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        duration: '16:50',
        durationSeconds: 1010,
        isPreview: false,
        status: 'published',
        order: 2
      }
    ]
  },
  {
    id: 'mod-5-2',
    courseId: 'course-5',
    title: 'Module 2: Boutique Frosting Swirls & Torch Art',
    description: 'Swiss meringue high towers, dual-tone striping, and caramelized finishes.',
    order: 2,
    lessons: [
      {
        id: 'les-5-2-1',
        moduleId: 'mod-5-2',
        title: 'High-Gloss Meringue Swirls & Culinary Torch Caramelization',
        description: 'Piping tall Parisian bakery swirls and applying golden torch highlights.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        duration: '18:10',
        durationSeconds: 1090,
        isPreview: false,
        status: 'published',
        order: 1
      }
    ]
  }
];

// Modules for course-6
const course6Modules: Module[] = [
  {
    id: 'mod-6-1',
    courseId: 'course-6',
    title: 'Module 1: Pliable Sugarpaste Handling & Sharp Edges',
    description: 'Conditioning fondant for humid climates and sharp 90-degree corner draping.',
    order: 1,
    lessons: [
      {
        id: 'les-6-1-1',
        moduleId: 'mod-6-1',
        title: 'Sugarpaste Conditioning for Humidity Resistance',
        description: 'Kneading Tylose CMC powder, rolling thickness control, and preventing tearing.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
        duration: '21:00',
        durationSeconds: 1260,
        isPreview: true,
        status: 'published',
        order: 1
      },
      {
        id: 'les-6-1-2',
        moduleId: 'mod-6-1',
        title: 'The Upside-Down Pan Smoothing Method',
        description: 'How to achieve razor-sharp edges and eliminate rounded shoulders on tall tiers.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '24:30',
        durationSeconds: 1470,
        isPreview: false,
        status: 'published',
        order: 2
      }
    ]
  },
  {
    id: 'mod-6-2',
    courseId: 'course-6',
    title: 'Module 2: Sugar Peony Floristry & Veining',
    description: 'Crafting lifelike botanically accurate sugar blooms, wired petals, and dusting.',
    order: 2,
    lessons: [
      {
        id: 'les-6-2-1',
        moduleId: 'mod-6-2',
        title: 'Wire Cutting, Silicone Veining & Petal Ruffling',
        description: 'Thinning petal edges with ball tools to create delicate translucent ruffles.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        duration: '27:15',
        durationSeconds: 1635,
        isPreview: false,
        status: 'published',
        order: 1
      },
      {
        id: 'les-6-2-2',
        moduleId: 'mod-6-2',
        title: 'Steaming & Dusting Botanical Luster Gradients',
        description: 'Blending soft plum and dusty rose petal dusts for true botanic realism.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: '18:40',
        durationSeconds: 1120,
        isPreview: false,
        status: 'published',
        order: 2
      }
    ]
  }
];

// Seed Courses
const initialCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Buttercream Decoration Masterclass',
    slug: 'buttercream-decoration-masterclass',
    shortDescription: 'Master the art of silky Swiss meringue buttercream, crisp palette knife textures, and breathtaking floral rosettes.',
    description: 'Step inside the professional studio of Cakexperiment to elevate your cake decorating from amateur to artisanal luxury. In this masterclass, you will learn the exact chemistry of fail-safe Swiss meringue buttercream, understand nozzle dynamics, construct flawless smooth side walls with acrylic disks, and pipe romantic floral rosettes inspired by classic Parisian patisseries.',
    thumbnail: '/images/hero-cake.png', // The stunning reference cake image
    previewMedia: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    categoryId: 'cat-2',
    categoryName: 'Cake Decorating',
    instructorId: 'inst-1',
    instructorName: 'Chef Camille Laurent',
    instructorAvatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
    instructorBio: 'Former executive pastry chef at L\'Étoile Paris with over 14 years of bespoke wedding cake design experience.',
    skillLevel: 'All Levels',
    learningOutcomes: [
      'Master the Swiss meringue buttercream formula for all weather climates',
      'Achieve razor-sharp 90-degree cake edges using acrylic disks and bench scrapers',
      'Pipe intricate rosettes, dimensional petals, and delicate borders effortlessly',
      'Harmonize delicate botanical color palettes using professional gel color theory',
      'Safely assemble, transport, and photograph multi-tiered celebration cakes'
    ],
    prerequisites: [
      'Basic enthusiasm for baking and cake art',
      'No advanced professional equipment required to begin'
    ],
    equipmentNeeded: [
      'Rotating cake turntable',
      'Offset spatula & metal bench scraper',
      'Piping bags and star tip nozzles (#1M, #2D)',
      'Stand mixer or electric hand whisk',
      'Cake board & 8-inch chilled cake layers'
    ],
    price: 499, // ₹499 default
    originalPrice: 1499,
    status: 'published',
    featured: true,
    totalDuration: '2h 45m',
    moduleCount: 3,
    lessonCount: 9,
    rating: 4.95,
    reviewCount: 142,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-02-15T14:30:00Z',
    modules: course1Modules
  },
  {
    id: 'course-2',
    title: 'Classic Cake Baking & Sponge Perfection',
    slug: 'classic-cake-baking-sponge-perfection',
    shortDescription: 'Understand the science of moisture, crumb structure, oven heat distribution, and fool-proof sponge recipes.',
    description: 'Transform your baking from guesswork into consistent, bakery-quality mastery. Discover why cakes sink, dome, or dry out, and learn how temperature, flour protein, and emulsion methods dictate the final texture of vanilla, chocolate, red velvet, and chiffon cakes.',
    thumbnail: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    previewMedia: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    categoryId: 'cat-1',
    categoryName: 'Cake Baking',
    instructorId: 'inst-1',
    instructorName: 'Chef Camille Laurent',
    instructorAvatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
    instructorBio: 'Former executive pastry chef at L\'Étoile Paris with over 14 years of bespoke wedding cake design experience.',
    skillLevel: 'Beginner',
    learningOutcomes: [
      'Understand the chemical interaction of leavening agents and flours',
      'Master reverse-creaming to achieve flat, moist layers ready for stacking',
      'Bake 4 versatile signature sponge formulas (Vanilla Bean, Rich Devil\'s Food, Lemon Chiffon, Almond Genoise)',
      'Accurately scale recipes for 6, 8, and 10-inch cake tins'
    ],
    prerequisites: [
      'Standard domestic oven and standard cake tins'
    ],
    equipmentNeeded: [
      'Digital kitchen scale',
      'Round 8-inch aluminium cake tins',
      'Parchment paper liners',
      'Oven thermometer'
    ],
    price: 499,
    originalPrice: 1299,
    status: 'published',
    featured: true,
    totalDuration: '1h 50m',
    moduleCount: 2,
    lessonCount: 3,
    rating: 4.88,
    reviewCount: 98,
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-02-10T12:00:00Z',
    modules: course2Modules
  },
  {
    id: 'course-3',
    title: 'Modern Celebration Cakes & Sugar Art',
    slug: 'modern-celebration-cakes-sugar-art',
    shortDescription: 'Design bespoke tiered cakes featuring wafer paper sails, 24k edible gold leaf, and abstract palette knife painting.',
    description: 'Bespoke event cakes require more than good baking—they require an architectural sense of balance and contemporary visual artistry. Learn how to compose delicate wafer paper sails, apply genuine edible gold accents, and craft abstract botanical impressions directly onto chilled buttercream.',
    thumbnail: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=800&q=80',
    previewMedia: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    categoryId: 'cat-6',
    categoryName: 'Modern Celebration Cakes',
    instructorId: 'inst-2',
    instructorName: 'Elena Rostova',
    instructorAvatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=80',
    instructorBio: 'International cake sculptor and gold medal recipient at the London Cake Masters Expo.',
    skillLevel: 'Intermediate',
    learningOutcomes: [
      'Construct wafer paper sails and delicate translucent butterflies',
      'Apply 24k edible gold leaf without crinkling or tearing',
      'Design modern textured buttercream stone finishes',
      'Engineer internal dowels for secure 2-tier and 3-tier delivery'
    ],
    prerequisites: [
      'Experience baking base sponge cakes and basic crumb coating'
    ],
    equipmentNeeded: [
      'Wafer paper (Grade AD / 0.3mm)',
      'Edible gold leaf sheets',
      'Food artist paint brushes',
      'Wooden and plastic dowel rods'
    ],
    price: 499,
    originalPrice: 1799,
    status: 'published',
    featured: true,
    totalDuration: '1h 20m',
    moduleCount: 2,
    lessonCount: 4,
    rating: 4.97,
    reviewCount: 84,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-18T16:00:00Z',
    modules: course3Modules
  },
  {
    id: 'course-4',
    title: 'Artisan Chocolate Cake & Ganache Alchemy',
    slug: 'artisan-chocolate-cake-ganache-alchemy',
    shortDescription: 'Unlock the secret to mirror glazes, drip ratios, chocolate curls, and silky dark Belgian ganache.',
    description: 'Chocolate is both the most requested cake flavor and the most temperamental to work with. Master emulsion science, formulate the perfect glossy drip that never slides off the cake board, and achieve velvet spray textures using simple household tools.',
    thumbnail: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    previewMedia: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    categoryId: 'cat-4',
    categoryName: 'Chocolate Techniques',
    instructorId: 'inst-1',
    instructorName: 'Chef Camille Laurent',
    instructorAvatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
    instructorBio: 'Former executive pastry chef at L\'Étoile Paris with over 14 years of bespoke wedding cake design experience.',
    skillLevel: 'Intermediate',
    learningOutcomes: [
      'Master 1:1, 2:1 and 3:1 chocolate-to-cream ratios for every climate',
      'Pour mirror glazes at precise temperatures for bubble-free shine',
      'Carve and temper chocolate collar wraps and architectural curls',
      'Balance dark 70% cocoa intensity with sea salt caramel fillings'
    ],
    prerequisites: ['Basic kitchen comfort and access to microwave or double boiler'],
    equipmentNeeded: ['Infrared digital thermometer', 'Acetate rolls', 'High-percentage couverture chocolate'],
    price: 499,
    originalPrice: 1599,
    status: 'published',
    featured: true,
    totalDuration: '1h 03m',
    moduleCount: 2,
    lessonCount: 3,
    rating: 4.92,
    reviewCount: 110,
    createdAt: '2026-01-18T10:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
    modules: course4Modules
  },
  {
    id: 'course-5',
    title: 'French Pastry & Gourmet Cupcake Collection',
    slug: 'french-pastry-gourmet-cupcake-collection',
    shortDescription: 'Petite bakes with gourmet fillings, marshmallow frosting swirls, and delicate fruit reductions.',
    description: 'Learn how to elevate cupcakes into luxury dessert boutique staples. From French choux puffs and tartlet shells to injected salted caramel cupcakes topped with toasted meringue torch finishes.',
    thumbnail: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=800&q=80',
    previewMedia: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    categoryId: 'cat-5',
    categoryName: 'Cupcakes & Mini Desserts',
    instructorId: 'inst-2',
    instructorName: 'Elena Rostova',
    instructorAvatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=80',
    instructorBio: 'International cake sculptor and gold medal recipient at the London Cake Masters Expo.',
    skillLevel: 'Beginner',
    learningOutcomes: [
      'Core cupcake sponge baking without greasy liner peel',
      'Curd and compote center injections with squeeze bottles',
      'Dual-tone Swiss swirl piping for high-end boutique appeal',
      'Culinary torch caramelization technique'
    ],
    prerequisites: ['No prior experience needed'],
    equipmentNeeded: ['12-cup muffin tin', 'Cupcake corer tool', 'Chef piping tips'],
    price: 499,
    originalPrice: 1199,
    status: 'published',
    featured: false,
    totalDuration: '50m',
    moduleCount: 2,
    lessonCount: 3,
    rating: 4.85,
    reviewCount: 62,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-02-22T11:00:00Z',
    modules: course5Modules
  },
  {
    id: 'course-6',
    title: 'Fondant Art, Sculpting & Wedding Architecture',
    slug: 'fondant-art-sculpting-wedding-architecture',
    shortDescription: 'Pliable sugarpaste handling, sharp ganache undercoats, lifelike peony flowers, and seamless draping.',
    description: 'Achieve flawless fondant drape without elephant skin or tears. Learn how to hand-sculpt botanically accurate peonies with edible dust veining, construct delicate sugar lace, and secure tall wedding tiers.',
    thumbnail: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80',
    previewMedia: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    categoryId: 'cat-3',
    categoryName: 'Fondant Art',
    instructorId: 'inst-2',
    instructorName: 'Elena Rostova',
    instructorAvatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=80',
    instructorBio: 'International cake sculptor and gold medal recipient at the London Cake Masters Expo.',
    skillLevel: 'Advanced',
    learningOutcomes: [
      'Knead and condition sugarpaste for tropical humidity tolerance',
      'Drape tall barrel tiers with the upside-down smoothing method',
      'Craft multi-petal sugar peonies with wire and floral tape',
      'Airbrush subtle gradients and shadows with edible luster dust'
    ],
    prerequisites: ['Prior experience covering cakes with ganache or firm buttercream'],
    equipmentNeeded: ['Fondant smoothers (pair)', 'Floral cutters & silicone veiners', 'Edible petal dusts'],
    price: 499,
    originalPrice: 2199,
    status: 'published',
    featured: false,
    totalDuration: '1h 31m',
    moduleCount: 2,
    lessonCount: 4,
    rating: 4.96,
    reviewCount: 75,
    createdAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-02-25T15:00:00Z',
    modules: course6Modules
  }
];

// Seed Users
const initialUsers: User[] = [
  {
    id: 'user-admin',
    name: 'Administrator',
    email: DEMO_ADMIN.email,
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    bio: 'Platform director and academy operations manager at Cakexperiment.',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-student',
    name: 'Aria Montgomery',
    email: DEMO_STUDENT.email,
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    bio: 'Passionate home baker dreaming of launching a boutique bakery studio.',
    createdAt: '2026-02-01T12:00:00Z'
  },
  {
    id: 'user-3',
    name: 'David Sterling',
    email: 'david.sterling@example.com',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    bio: 'Hobbyist pastry enthusiast perfecting celebratory cakes for family.',
    createdAt: '2026-02-05T14:20:00Z'
  },
  {
    id: 'user-4',
    name: 'Sophie Moreau',
    email: 'sophie.m@example.com',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    bio: 'Catering chef expanding dessert menu offerings.',
    createdAt: '2026-02-12T09:15:00Z'
  }
];

// Seed Orders & Payments
const initialOrders: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-2026-8841',
    userId: 'user-student',
    userName: 'Aria Montgomery',
    userEmail: DEMO_STUDENT.email,
    courseId: 'course-1',
    courseTitle: 'Buttercream Decoration Masterclass',
    courseThumbnail: '/images/hero-cake.png',
    amount: 499,
    paymentStatus: 'paid',
    orderStatus: 'completed',
    createdAt: '2026-02-02T10:15:00Z'
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-2026-8842',
    userId: 'user-3',
    userName: 'David Sterling',
    userEmail: 'david.sterling@example.com',
    courseId: 'course-2',
    courseTitle: 'Classic Cake Baking & Sponge Perfection',
    courseThumbnail: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    amount: 499,
    paymentStatus: 'paid',
    orderStatus: 'completed',
    createdAt: '2026-02-06T11:30:00Z'
  },
  {
    id: 'ord-103',
    orderNumber: 'ORD-2026-8843',
    userId: 'user-4',
    userName: 'Sophie Moreau',
    userEmail: 'sophie.m@example.com',
    courseId: 'course-3',
    courseTitle: 'Modern Celebration Cakes & Sugar Art',
    courseThumbnail: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=800&q=80',
    amount: 499,
    paymentStatus: 'paid',
    orderStatus: 'completed',
    createdAt: '2026-02-13T16:45:00Z'
  }
];

const initialPayments: Payment[] = [
  {
    id: 'pay-201',
    orderId: 'ord-101',
    orderNumber: 'ORD-2026-8841',
    userId: 'user-student',
    userName: 'Aria Montgomery',
    courseTitle: 'Buttercream Decoration Masterclass',
    amount: 499,
    provider: 'Stripe (Simulated)',
    paymentMethod: 'Credit Card',
    transactionReference: 'txn_sim_94827591823',
    status: 'successful',
    createdAt: '2026-02-02T10:15:22Z'
  },
  {
    id: 'pay-202',
    orderId: 'ord-102',
    orderNumber: 'ORD-2026-8842',
    userId: 'user-3',
    userName: 'David Sterling',
    courseTitle: 'Classic Cake Baking & Sponge Perfection',
    amount: 499,
    provider: 'Razorpay (Simulated)',
    paymentMethod: 'UPI',
    transactionReference: 'txn_sim_39105820491',
    status: 'successful',
    createdAt: '2026-02-06T11:30:45Z'
  },
  {
    id: 'pay-203',
    orderId: 'ord-103',
    orderNumber: 'ORD-2026-8843',
    userId: 'user-4',
    userName: 'Sophie Moreau',
    courseTitle: 'Modern Celebration Cakes & Sugar Art',
    amount: 499,
    provider: 'Stripe (Simulated)',
    paymentMethod: 'Debit Card',
    transactionReference: 'txn_sim_82746194726',
    status: 'successful',
    createdAt: '2026-02-13T16:46:10Z'
  }
];

// Seed Enrollment for Aria Montgomery
const initialEnrollments: Enrollment[] = [
  {
    id: 'enr-301',
    userId: 'user-student',
    courseId: 'course-1',
    orderId: 'ord-101',
    purchasedAt: '2026-02-02T10:15:00Z',
    progress: 33,
    completedLessonIds: ['les-1-1-1', 'les-1-1-2', 'les-1-1-3'],
    lastAccessedLessonId: 'les-1-2-1'
  }
];

// Seed Reviews
const initialReviews: Review[] = [
  {
    id: 'rev-401',
    userId: 'user-student',
    userName: 'Aria Montgomery',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    courseId: 'course-1',
    courseTitle: 'Buttercream Decoration Masterclass',
    rating: 5,
    comment: 'The Swiss meringue buttercream formula transformed my cakes overnight. No doming, no greasy texture, just pure silky luxury. Chef Camille explains the subtle tactile cues that books never mention!',
    studentCreationImg: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    status: 'approved',
    createdAt: '2026-02-10T14:00:00Z'
  },
  {
    id: 'rev-402',
    userId: 'user-3',
    userName: 'David Sterling',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    courseId: 'course-2',
    courseTitle: 'Classic Cake Baking & Sponge Perfection',
    rating: 5,
    comment: 'Finally understood reverse creaming! My sponge baked completely flat across all three 8-inch tins without a single knife trim needed. Worth tenfold the modest ₹499 price.',
    studentCreationImg: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    status: 'approved',
    createdAt: '2026-02-15T09:30:00Z'
  },
  {
    id: 'rev-403',
    userId: 'user-4',
    userName: 'Sophie Moreau',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    courseId: 'course-3',
    courseTitle: 'Modern Celebration Cakes & Sugar Art',
    rating: 5,
    comment: 'The wafer paper sails lesson gave my boutique creations an editorial, magazine-ready aesthetic. The step-by-step video quality and ingredient breakdowns are exceptionally detailed.',
    studentCreationImg: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80',
    status: 'approved',
    createdAt: '2026-02-20T18:15:00Z'
  },
  {
    id: 'rev-404',
    userId: 'user-5',
    userName: 'Elena Rostova',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    courseId: 'course-4',
    courseTitle: 'Boutique Cupcakes & High-Tea Treats',
    rating: 5,
    comment: 'The fruit curd inject core technique blew my customers away at our spring high-tea popup. Sold out within two hours! Camille makes complex French patisserie feel effortless.',
    studentCreationImg: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=600&q=80',
    status: 'approved',
    createdAt: '2026-02-22T11:20:00Z'
  },
  {
    id: 'rev-405',
    userId: 'user-6',
    userName: 'Marcus Chen',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    courseId: 'course-1',
    courseTitle: 'Wedding Cake Architecture & Tier Assembly',
    rating: 5,
    comment: 'Transported my very first 3-tier wedding cake 45 kilometers with zero shifting or cracking! The doweling and acrylic disk guide gave me absolute structural confidence.',
    studentCreationImg: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=600&q=80',
    status: 'approved',
    createdAt: '2026-02-24T15:40:00Z'
  },
  {
    id: 'rev-406',
    userId: 'user-7',
    userName: 'Clara Delacroix',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    courseId: 'course-2',
    courseTitle: 'Chocolate Mirror Glaze & Ganache Alchemy',
    rating: 5,
    comment: 'No bubbles, mirror-like reflection, and exact 32°C pour viscosity. My family could not believe I made this in my regular kitchen oven. Truly world-class instruction.',
    studentCreationImg: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    status: 'approved',
    createdAt: '2026-02-26T19:10:00Z'
  }
];

const initialSettings: AcademySettings = {
  academyName: 'Cakexperiment',
  tagline: 'Artisanal Cake Academy & Digital Masterclasses',
  supportEmail: 'bonjour@cakexperiment.com',
  supportPhone: '+91 (0) 98765 43210',
  currency: 'INR',
  currencySymbol: '₹',
  defaultCoursePrice: 499,
  maintenanceMode: false
};

// LocalStorage Helper with fallback
class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        this.set(key, defaultValue);
        return defaultValue;
      }
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  public init() {
    if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
      this.set(STORAGE_KEYS.CATEGORIES, initialCategories);
      this.set(STORAGE_KEYS.COURSES, initialCourses);
      this.set(STORAGE_KEYS.USERS, initialUsers);
      this.set(STORAGE_KEYS.ORDERS, initialOrders);
      this.set(STORAGE_KEYS.PAYMENTS, initialPayments);
      this.set(STORAGE_KEYS.ENROLLMENTS, initialEnrollments);
      this.set(STORAGE_KEYS.REVIEWS, initialReviews);
      this.set(STORAGE_KEYS.SETTINGS, initialSettings);
    }
  }

  // --- Auth & Session ---
  public getCurrentUser(): User | null {
    return this.get<User | null>(STORAGE_KEYS.SESSION, null);
  }

  public signIn(email: string, pass: string): { success: boolean; user?: User; message?: string } {
    this.init();
    const cleanEmail = email.trim().toLowerCase();
    
    // Check Admin demo credentials
    if (cleanEmail === DEMO_ADMIN.email.toLowerCase()) {
      if (pass === DEMO_ADMIN.password) {
        const adminUser = this.getUsers().find(u => u.role === 'admin') || initialUsers[0];
        this.set(STORAGE_KEYS.SESSION, adminUser);
        return { success: true, user: adminUser };
      }
      return { success: false, message: 'Invalid administrator password.' };
    }

    // Check Student demo credentials
    if (cleanEmail === DEMO_STUDENT.email.toLowerCase()) {
      if (pass === DEMO_STUDENT.password) {
        const studentUser = this.getUsers().find(u => u.email.toLowerCase() === DEMO_STUDENT.email.toLowerCase()) || initialUsers[1];
        this.set(STORAGE_KEYS.SESSION, studentUser);
        return { success: true, user: studentUser };
      }
      return { success: false, message: 'Invalid student password.' };
    }

    // Check any newly registered user in local storage
    const existing = this.getUsers().find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      // In this frontend demo adapter, accept their chosen password
      this.set(STORAGE_KEYS.SESSION, existing);
      return { success: true, user: existing };
    }

    return { success: false, message: 'No registered demo account found for this email address.' };
  }

  public signUp(name: string, email: string, _pass: string): { success: boolean; user?: User; message?: string } {
    this.init();
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'An account with this email already exists in demo storage.' };
    }

    // New accounts ALWAYS receive student role
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      role: 'student',
      avatar: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
      ][Math.floor(Math.random() * 4)],
      status: 'active',
      bio: 'Enthusiastic baker learning with Cakexperiment.',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.set(STORAGE_KEYS.USERS, users);
    this.set(STORAGE_KEYS.SESSION, newUser);

    return { success: true, user: newUser };
  }

  public signOut(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, initialUsers);
  }

  public updateUserStatus(userId: string, status: 'active' | 'suspended'): void {
    const users = this.getUsers().map(u => (u.id === userId ? { ...u, status } : u));
    this.set(STORAGE_KEYS.USERS, users);
  }

  // --- Categories ---
  public getCategories(): Category[] {
    return this.get<Category[]>(STORAGE_KEYS.CATEGORIES, initialCategories);
  }

  public saveCategory(cat: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Category {
    const categories = this.getCategories();
    const now = new Date().toISOString();
    if (cat.id) {
      const idx = categories.findIndex(c => c.id === cat.id);
      if (idx !== -1) {
        categories[idx] = { ...categories[idx], ...cat, updatedAt: now };
        this.set(STORAGE_KEYS.CATEGORIES, categories);
        return categories[idx];
      }
    }
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
      courseCount: 0,
      createdAt: now,
      updatedAt: now
    };
    categories.push(newCat);
    this.set(STORAGE_KEYS.CATEGORIES, categories);
    return newCat;
  }

  public deleteCategory(catId: string): boolean {
    const categories = this.getCategories().filter(c => c.id !== catId);
    this.set(STORAGE_KEYS.CATEGORIES, categories);
    return true;
  }

  // --- Courses ---
  public getCourses(): Course[] {
    const courses = this.get<Course[]>(STORAGE_KEYS.COURSES, initialCourses);
    return courses.map(c => {
      let mods = c.modules;
      if (!mods || mods.length === 0) {
        const seed = initialCourses.find(sc => sc.id === c.id);
        if (seed && seed.modules && seed.modules.length > 0) {
          mods = seed.modules;
        } else {
          mods = [];
        }
      }
      return {
        ...c,
        modules: mods
      };
    });
  }

  public getCourseBySlug(slug: string): Course | undefined {
    return this.getCourses().find(c => c.slug === slug || c.id === slug);
  }

  public getCourseById(id: string): Course | undefined {
    return this.getCourses().find(c => c.id === id);
  }

  public saveCourse(courseData: Partial<Course> & { title: string }): Course {
    const courses = this.getCourses();
    const now = new Date().toISOString();
    const slug = courseData.slug || courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (courseData.id) {
      const idx = courses.findIndex(c => c.id === courseData.id);
      if (idx !== -1) {
        courses[idx] = {
          ...courses[idx],
          ...courseData,
          slug,
          updatedAt: now
        } as Course;
        this.set(STORAGE_KEYS.COURSES, courses);
        return courses[idx];
      }
    }

    // Newly created course: default price ₹499
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title: courseData.title,
      slug,
      shortDescription: courseData.shortDescription || 'Discover professional techniques with Cakexperiment.',
      description: courseData.description || 'Comprehensive step-by-step masterclass covering essential to advanced baking art.',
      thumbnail: courseData.thumbnail || '/images/hero-cake.png',
      previewMedia: courseData.previewMedia || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      categoryId: courseData.categoryId || 'cat-1',
      categoryName: courseData.categoryName || 'Cake Baking',
      instructorId: 'inst-1',
      instructorName: courseData.instructorName || 'Chef Camille Laurent',
      instructorAvatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
      instructorBio: 'Bespoke wedding cake specialist and executive pastry instructor.',
      skillLevel: courseData.skillLevel || 'All Levels',
      learningOutcomes: courseData.learningOutcomes || ['Master core culinary techniques', 'Create presentation-ready celebration cakes'],
      prerequisites: courseData.prerequisites || ['Basic kitchen enthusiasm'],
      equipmentNeeded: courseData.equipmentNeeded || ['Standard baking pans and whisk'],
      price: typeof courseData.price === 'number' ? courseData.price : 499,
      originalPrice: courseData.originalPrice || 1299,
      status: courseData.status || 'published',
      featured: courseData.featured ?? false,
      totalDuration: courseData.totalDuration || '2h 15m',
      moduleCount: courseData.modules ? courseData.modules.length : 1,
      lessonCount: courseData.modules ? courseData.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) : 3,
      rating: 5.0,
      reviewCount: 1,
      createdAt: now,
      updatedAt: now,
      modules: courseData.modules || [
        {
          id: `mod-${Date.now()}-1`,
          courseId: `course-${Date.now()}`,
          title: 'Module 1: Foundations & Preparation',
          description: 'Essential equipment, base prep and recipe chemistry.',
          order: 1,
          lessons: [
            {
              id: `les-${Date.now()}-1`,
              moduleId: `mod-${Date.now()}-1`,
              title: 'Lesson 1: Introduction and Mise en Place',
              description: 'Setting up your workstation and balancing ingredients.',
              videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
              duration: '15:00',
              durationSeconds: 900,
              isPreview: true,
              status: 'published',
              order: 1
            }
          ]
        }
      ]
    };

    courses.unshift(newCourse);
    this.set(STORAGE_KEYS.COURSES, courses);
    return newCourse;
  }

  public deleteCourse(courseId: string): boolean {
    const courses = this.getCourses().filter(c => c.id !== courseId);
    this.set(STORAGE_KEYS.COURSES, courses);
    return true;
  }

  public calculateCourseDuration(modules?: Module[]): { totalDuration: string; lessonCount: number; moduleCount: number } {
    if (!modules || modules.length === 0) {
      return { totalDuration: '0m', lessonCount: 0, moduleCount: 0 };
    }
    let totalSeconds = 0;
    let totalLessons = 0;

    modules.forEach(m => {
      (m.lessons || []).forEach(l => {
        totalLessons += 1;
        if (l.durationSeconds) {
          totalSeconds += l.durationSeconds;
        } else if (l.duration) {
          const parts = l.duration.split(':').map(Number);
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            totalSeconds += parts[0] * 60 + parts[1];
          } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
            totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        }
      });
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const totalDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return { totalDuration, lessonCount: totalLessons, moduleCount: modules.length };
  }

  public saveLesson(
    courseId: string,
    moduleId: string,
    lessonData: Partial<Lesson> & { title: string }
  ): { course: Course; lesson: Lesson } {
    const courses = this.getCourses();
    const courseIdx = courses.findIndex(c => c.id === courseId);
    if (courseIdx === -1) throw new Error(`Course ${courseId} not found`);

    const course = courses[courseIdx];
    if (!course.modules) course.modules = [];

    // Find target module
    let targetModule = course.modules.find(m => m.id === moduleId);
    if (!targetModule) {
      targetModule = {
        id: moduleId || `mod-${Date.now()}`,
        courseId,
        title: 'Module 1: General Curriculum',
        description: '',
        order: course.modules.length + 1,
        lessons: []
      };
      course.modules.push(targetModule);
    }

    // Parse duration seconds if given
    let durationSeconds = lessonData.durationSeconds;
    if (!durationSeconds && lessonData.duration) {
      const parts = lessonData.duration.split(':').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        durationSeconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }

    // Remove from any other module if it was moved
    let existingLesson: Lesson | undefined;
    course.modules.forEach(m => {
      const lIdx = (m.lessons || []).findIndex(l => l.id === lessonData.id);
      if (lIdx !== -1) {
        existingLesson = m.lessons[lIdx];
        if (m.id !== moduleId) {
          m.lessons.splice(lIdx, 1);
          m.lessons.forEach((l, i) => { l.order = i + 1; });
        }
      }
    });

    const lessonId = lessonData.id || existingLesson?.id || `les-${Date.now()}`;
    const targetLessons = targetModule.lessons || (targetModule.lessons = []);
    const existingIdxInTarget = targetLessons.findIndex(l => l.id === lessonId);

    const updatedLesson: Lesson = {
      id: lessonId,
      moduleId: targetModule.id,
      title: lessonData.title.trim(),
      description: lessonData.description?.trim() || '',
      videoReference: lessonData.videoReference?.trim() || '',
      duration: lessonData.duration?.trim() || (durationSeconds ? `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, '0')}` : '10:00'),
      durationSeconds: durationSeconds || 600,
      isPreview: lessonData.isPreview ?? false,
      status: lessonData.status || 'published',
      order: lessonData.order || (existingIdxInTarget !== -1 ? targetLessons[existingIdxInTarget].order : targetLessons.length + 1),
      resources: lessonData.resources || existingLesson?.resources || []
    };

    if (existingIdxInTarget !== -1) {
      targetLessons[existingIdxInTarget] = updatedLesson;
    } else {
      targetLessons.push(updatedLesson);
    }

    // Normalize ordering in target module
    targetLessons.forEach((l, i) => { l.order = i + 1; });

    // Recalculate stats
    const stats = this.calculateCourseDuration(course.modules);
    course.lessonCount = stats.lessonCount;
    course.moduleCount = stats.moduleCount;
    course.totalDuration = stats.totalDuration;
    course.updatedAt = new Date().toISOString();

    courses[courseIdx] = course;
    this.set(STORAGE_KEYS.COURSES, courses);

    return { course, lesson: updatedLesson };
  }

  public deleteLesson(courseId: string, moduleId: string, lessonId: string): boolean {
    const courses = this.getCourses();
    const courseIdx = courses.findIndex(c => c.id === courseId);
    if (courseIdx === -1) return false;

    const course = courses[courseIdx];
    if (!course.modules) return false;

    const module = course.modules.find(m => m.id === moduleId);
    if (!module || !module.lessons) return false;

    const lIdx = module.lessons.findIndex(l => l.id === lessonId);
    if (lIdx === -1) return false;

    module.lessons.splice(lIdx, 1);
    module.lessons.forEach((l, i) => { l.order = i + 1; });

    const stats = this.calculateCourseDuration(course.modules);
    course.lessonCount = stats.lessonCount;
    course.moduleCount = stats.moduleCount;
    course.totalDuration = stats.totalDuration;
    course.updatedAt = new Date().toISOString();

    courses[courseIdx] = course;
    this.set(STORAGE_KEYS.COURSES, courses);
    return true;
  }

  public reorderLesson(courseId: string, moduleId: string, lessonId: string, direction: 'up' | 'down'): boolean {
    const courses = this.getCourses();
    const courseIdx = courses.findIndex(c => c.id === courseId);
    if (courseIdx === -1) return false;

    const course = courses[courseIdx];
    if (!course.modules) return false;

    const module = course.modules.find(m => m.id === moduleId);
    if (!module || !module.lessons || module.lessons.length < 2) return false;

    const idx = module.lessons.findIndex(l => l.id === lessonId);
    if (idx === -1) return false;

    if (direction === 'up' && idx > 0) {
      const temp = module.lessons[idx];
      module.lessons[idx] = module.lessons[idx - 1];
      module.lessons[idx - 1] = temp;
    } else if (direction === 'down' && idx < module.lessons.length - 1) {
      const temp = module.lessons[idx];
      module.lessons[idx] = module.lessons[idx + 1];
      module.lessons[idx + 1] = temp;
    } else {
      return false;
    }

    module.lessons.forEach((l, i) => { l.order = i + 1; });
    courses[courseIdx] = course;
    this.set(STORAGE_KEYS.COURSES, courses);
    return true;
  }

  public addModule(courseId: string, title: string, description?: string): Module | null {
    const courses = this.getCourses();
    const courseIdx = courses.findIndex(c => c.id === courseId);
    if (courseIdx === -1) return null;

    const course = courses[courseIdx];
    if (!course.modules) course.modules = [];

    const newModule: Module = {
      id: `mod-${Date.now()}-${course.modules.length + 1}`,
      courseId,
      title: title.trim(),
      description: description?.trim() || '',
      order: course.modules.length + 1,
      lessons: []
    };

    course.modules.push(newModule);
    course.moduleCount = course.modules.length;
    courses[courseIdx] = course;
    this.set(STORAGE_KEYS.COURSES, courses);
    return newModule;
  }

  // --- Enrollments & Learning Access ---
  public getEnrollments(): Enrollment[] {
    return this.get<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, initialEnrollments);
  }

  public getStudentEnrollments(userId: string): Enrollment[] {
    return this.getEnrollments().filter(e => e.userId === userId);
  }

  public isEnrolled(userId: string, courseId: string): boolean {
    return this.getEnrollments().some(e => e.userId === userId && e.courseId === courseId);
  }

  public toggleLessonCompleted(userId: string, courseId: string, lessonId: string): Enrollment | null {
    const enrollments = this.getEnrollments();
    const idx = enrollments.findIndex(e => e.userId === userId && e.courseId === courseId);
    if (idx === -1) return null;

    const course = this.getCourseById(courseId);
    const totalLessons = course ? (course.lessonCount || 6) : 6;
    const current = enrollments[idx];
    const completed = new Set(current.completedLessonIds || []);

    if (completed.has(lessonId)) {
      completed.delete(lessonId);
    } else {
      completed.add(lessonId);
    }

    const updatedCompleted = Array.from(completed);
    const progress = Math.min(100, Math.round((updatedCompleted.length / totalLessons) * 100));

    enrollments[idx] = {
      ...current,
      completedLessonIds: updatedCompleted,
      progress,
      lastAccessedLessonId: lessonId
    };

    this.set(STORAGE_KEYS.ENROLLMENTS, enrollments);
    return enrollments[idx];
  }

  // --- Orders & Simulated Purchase Flow ---
  public getOrders(): Order[] {
    return this.get<Order[]>(STORAGE_KEYS.ORDERS, initialOrders);
  }

  public getPayments(): Payment[] {
    return this.get<Payment[]>(STORAGE_KEYS.PAYMENTS, initialPayments);
  }

  public processSimulatedPurchase(
    user: User,
    course: Course,
    paymentMethod: 'Credit Card' | 'Debit Card' | 'UPI' | 'Net Banking' = 'Credit Card'
  ): { success: boolean; order: Order; payment: Payment; enrollment: Enrollment } {
    const now = new Date().toISOString();
    const orderId = `ord-${Date.now()}`;
    const orderNumber = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Create Order
    const newOrder: Order = {
      id: orderId,
      orderNumber,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      courseId: course.id,
      courseTitle: course.title,
      courseThumbnail: course.thumbnail,
      amount: course.price,
      paymentStatus: 'paid',
      orderStatus: 'completed',
      createdAt: now
    };

    // 2. Create Payment Record
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      orderId,
      orderNumber,
      userId: user.id,
      userName: user.name,
      courseTitle: course.title,
      amount: course.price,
      provider: paymentMethod === 'UPI' ? 'UPI (Simulated)' : 'Stripe (Simulated)',
      paymentMethod,
      transactionReference: `txn_sim_${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
      status: 'successful',
      createdAt: now
    };

    // 3. Grant Enrollment & Access
    const newEnrollment: Enrollment = {
      id: `enr-${Date.now()}`,
      userId: user.id,
      courseId: course.id,
      orderId,
      purchasedAt: now,
      progress: 0,
      completedLessonIds: []
    };

    // Persist all
    const orders = this.getOrders();
    orders.unshift(newOrder);
    this.set(STORAGE_KEYS.ORDERS, orders);

    const payments = this.getPayments();
    payments.unshift(newPayment);
    this.set(STORAGE_KEYS.PAYMENTS, payments);

    const enrollments = this.getEnrollments();
    enrollments.unshift(newEnrollment);
    this.set(STORAGE_KEYS.ENROLLMENTS, enrollments);

    return {
      success: true,
      order: newOrder,
      payment: newPayment,
      enrollment: newEnrollment
    };
  }

  public refundOrder(orderId: string): boolean {
    const orders = this.getOrders().map(o => (o.id === orderId ? { ...o, paymentStatus: 'refunded' as const, orderStatus: 'refunded' as const } : o));
    this.set(STORAGE_KEYS.ORDERS, orders);

    const payments = this.getPayments().map(p => (p.orderId === orderId ? { ...p, status: 'refunded' as const } : p));
    this.set(STORAGE_KEYS.PAYMENTS, payments);
    return true;
  }

  // --- Reviews ---
  public getReviews(): Review[] {
    return this.get<Review[]>(STORAGE_KEYS.REVIEWS, initialReviews);
  }

  public getApprovedReviews(): Review[] {
    return this.getReviews().filter(r => r.status === 'approved');
  }

  public updateReviewStatus(reviewId: string, status: 'approved' | 'pending' | 'hidden'): void {
    const reviews = this.getReviews().map(r => (r.id === reviewId ? { ...r, status } : r));
    this.set(STORAGE_KEYS.REVIEWS, reviews);
  }

  public deleteReview(reviewId: string): void {
    const reviews = this.getReviews().filter(r => r.id !== reviewId);
    this.set(STORAGE_KEYS.REVIEWS, reviews);
  }

  // --- Settings ---
  public getSettings(): AcademySettings {
    return this.get<AcademySettings>(STORAGE_KEYS.SETTINGS, initialSettings);
  }

  public updateSettings(settings: Partial<AcademySettings>): AcademySettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // --- Metrics ---
  public getAdminMetrics() {
    const courses = this.getCourses();
    const orders = this.getOrders();
    const payments = this.getPayments();
    const students = this.getUsers().filter(u => u.role === 'student');

    const totalRevenue = payments
      .filter(p => p.status === 'successful')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingOrders = orders.filter(o => o.orderStatus === 'processing' || o.paymentStatus === 'pending').length;

    return {
      totalCourses: courses.length,
      publishedCourses: courses.filter(c => c.status === 'published').length,
      totalStudents: students.length,
      totalOrders: orders.length,
      revenue: totalRevenue,
      pendingPayments: pendingOrders,
      recentOrders: orders.slice(0, 5),
      recentStudents: students.slice(0, 5),
      popularCourses: courses.slice(0, 4)
    };
  }

  public formatINR(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }
}

export const storageService = new StorageService();
// Initialize storage
storageService.init();
