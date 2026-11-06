import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from '../server/neonDb.ts';

const categoriesToSeed = [
  { id: 'cat-1', name: 'Cake Baking', slug: 'cake-baking', description: 'Foundational baking techniques, sponge science, and temperature control.' },
  { id: 'cat-2', name: 'Cake Decorating', slug: 'cake-decorating', description: 'Buttercream textures, palette knife art, and sharp-edge finishes.' },
  { id: 'cat-3', name: 'Fondant Art', slug: 'fondant-art', description: 'Sugarpaste drape, sharp edges, and handcrafted sugar botanicals.' },
  { id: 'cat-4', name: 'Chocolate Techniques', slug: 'chocolate-techniques', description: 'Tempering, ganache formulation, mirror glazes, and chocolate accents.' },
  { id: 'cat-5', name: 'Cupcakes & Mini Desserts', slug: 'cupcakes-mini-desserts', description: 'Individual bakery creations, gourmet fillings, and piped towers.' }
];

const coursesToSeed = [
  {
    id: 'course-1',
    title: 'Buttercream Decoration Masterclass',
    slug: 'buttercream-decoration-masterclass',
    tag: 'Bestseller Masterclass',
    short_description: 'Master silky Swiss meringue buttercream, crisp palette knife textures, and breathtaking floral rosettes.',
    description: 'Step inside the professional studio of Cakexperiment to elevate your cake decorating from amateur to artisanal luxury. Learn the exact chemistry of fail-safe Swiss meringue buttercream, construct smooth side walls with acrylic disks, and pipe romantic floral rosettes.',
    thumbnail: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80',
    preview_media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category_id: 'cat-2',
    category_name: 'Cake Decorating',
    instructor_name: 'Chef Camille Laurent',
    instructor_bio: 'Former executive pastry chef at L\'Étoile Paris with over 14 years of bespoke wedding cake design experience.',
    skill_level: 'All Levels',
    price: 499,
    original_price: 1499,
    rating: 4.95,
    reviews_count: 142,
    status: 'published',
    featured: true,
    total_duration: '2h 45m',
    modules_count: 3,
    lessons_count: 9
  },
  {
    id: 'course-2',
    title: 'Classic Cake Baking & Sponge Perfection',
    slug: 'classic-cake-baking-sponge-perfection',
    tag: 'Foundational Masterclass',
    short_description: 'Understand the science of moisture, crumb structure, oven heat distribution, and fool-proof sponge recipes.',
    description: 'Transform your baking from guesswork into consistent, bakery-quality mastery. Discover why cakes sink, dome, or dry out, and learn how temperature, flour protein, and emulsion methods dictate the final texture of vanilla, chocolate, and chiffon cakes.',
    thumbnail: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    preview_media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    category_id: 'cat-1',
    category_name: 'Cake Baking',
    instructor_name: 'Chef Camille Laurent',
    instructor_bio: 'Former executive pastry chef at L\'Étoile Paris with over 14 years of bespoke wedding cake design experience.',
    skill_level: 'Beginner',
    price: 499,
    original_price: 1299,
    rating: 4.90,
    reviews_count: 98,
    status: 'published',
    featured: true,
    total_duration: '3h 10m',
    modules_count: 2,
    lessons_count: 6
  },
  {
    id: 'course-3',
    title: 'Modern Fondant Sculpting & Sugar Florals',
    slug: 'modern-fondant-sculpting-sugar-florals',
    tag: 'Artisan Masterclass',
    short_description: 'Sculpt lifelike sugar roses, peonies, and master sharp edge fondant finishing for tiered architectural cakes.',
    description: 'Elevate your cake artistry to exhibition standard. Master delicate gum paste petal thinning, dusting powder shading techniques, and structural wire assembly for showstopper luxury cakes.',
    thumbnail: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80',
    preview_media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category_id: 'cat-3',
    category_name: 'Fondant Art',
    instructor_name: 'Elena Rostova',
    instructor_bio: 'Award-winning sugar florist and author of Contemporary Botanical Cake Design.',
    skill_level: 'Intermediate',
    price: 499,
    original_price: 1699,
    rating: 4.98,
    reviews_count: 76,
    status: 'published',
    featured: false,
    total_duration: '4h 00m',
    modules_count: 2,
    lessons_count: 6
  },
  {
    id: 'course-4',
    title: 'Artisan Chocolate Cake & Ganache Alchemy',
    slug: 'artisan-chocolate-cake-ganache-alchemy',
    tag: 'Artisan Masterclass',
    short_description: 'Unlock the secret to mirror glazes, drip ratios, chocolate curls, and silky dark Belgian ganache.',
    description: 'Chocolate is both the most requested cake flavor and the most temperamental to work with. Master emulsion science, formulate the perfect glossy drip that never slides off the cake board, and achieve velvet spray textures using simple household tools.',
    thumbnail: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    preview_media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category_id: 'cat-4',
    category_name: 'Chocolate Techniques',
    instructor_name: 'Chef Camille Laurent',
    instructor_bio: 'Former executive pastry chef at L\'Étoile Paris with over 14 years of bespoke wedding cake design experience.',
    skill_level: 'Intermediate',
    price: 499,
    original_price: 1599,
    rating: 4.92,
    reviews_count: 110,
    status: 'published',
    featured: true,
    total_duration: '1h 03m',
    modules_count: 2,
    lessons_count: 3
  },
  {
    id: 'course-5',
    title: 'French Pastry & Gourmet Cupcake Collection',
    slug: 'french-pastry-gourmet-cupcake-collection',
    tag: 'Boutique Collection',
    short_description: 'Petite bakes with gourmet fillings, marshmallow frosting swirls, and delicate fruit reductions.',
    description: 'Learn how to elevate cupcakes into luxury dessert boutique staples. From French choux puffs and tartlet shells to injected salted caramel cupcakes topped with toasted meringue torch finishes.',
    thumbnail: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=800&q=80',
    preview_media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    category_id: 'cat-5',
    category_name: 'Cupcakes & Mini Desserts',
    instructor_name: 'Elena Rostova',
    instructor_bio: 'International cake sculptor and gold medal recipient at the London Cake Masters Expo.',
    skill_level: 'Beginner',
    price: 499,
    original_price: 1199,
    rating: 4.85,
    reviews_count: 62,
    status: 'published',
    featured: false,
    total_duration: '50m',
    modules_count: 2,
    lessons_count: 3
  },
  {
    id: 'course-6',
    title: 'Fondant Art, Sculpting & Wedding Architecture',
    slug: 'fondant-art-sculpting-wedding-architecture',
    tag: 'Couture Wedding Masterclass',
    short_description: 'Pliable sugarpaste handling, sharp ganache undercoats, lifelike peony flowers, and seamless draping.',
    description: 'Achieve flawless fondant drape without elephant skin or tears. Learn how to hand-sculpt botanically accurate peonies with edible dust veining, construct delicate sugar lace, and secure tall wedding tiers.',
    thumbnail: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80',
    preview_media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    category_id: 'cat-3',
    category_name: 'Fondant Art',
    instructor_name: 'Elena Rostova',
    instructor_bio: 'International cake sculptor and gold medal recipient at the London Cake Masters Expo.',
    skill_level: 'Advanced',
    price: 499,
    original_price: 1799,
    rating: 4.97,
    reviews_count: 88,
    status: 'published',
    featured: false,
    total_duration: '1h 31m',
    modules_count: 2,
    lessons_count: 4
  }
];

const modulesToSeed = [
  // Course 1
  { id: 'mod-1-1', course_id: 'course-1', title: 'Module 1: The Chemistry of Silky Buttercream', description: 'Egg white protein structure, sugar syrups, and temperature stability.', order_num: 1 },
  { id: 'mod-1-2', course_id: 'course-1', title: 'Module 2: Acrylic Disks & Crisp 90° Sides', description: 'Leveling cakes, crumb coating, and side scraping for straight cylindrical sides.', order_num: 2 },
  { id: 'mod-1-3', course_id: 'course-1', title: 'Module 3: Sculptural Palette Knife Florals', description: 'Blending custom gel colors, palette knife pressure, and 3D floral petals.', order_num: 3 },
  // Course 2
  { id: 'mod-2-1', course_id: 'course-2', title: 'Module 1: Flour Protein & Fat Emulsions', description: 'Fat coating flour proteins to prevent gluten overdevelopment.', order_num: 1 },
  { id: 'mod-2-2', course_id: 'course-2', title: 'Module 2: Oven Heat Distribution & Level Baking', description: 'Cake strips, pan materials, and low-temperature thermal conduction.', order_num: 2 },
  // Course 3
  { id: 'mod-3-1', course_id: 'course-3', title: 'Module 1: Gum Paste Conditioning & Rolling', description: 'Rolling paste to translucent thickness without stickiness or tearing.', order_num: 1 },
  { id: 'mod-3-2', course_id: 'course-3', title: 'Module 2: Botanical Shading & Wire Assembly', description: 'Petal dust blending and assembly into a secure botanical spray.', order_num: 2 },
  // Course 4
  { id: 'mod-4-1', course_id: 'course-4', title: 'Module 1: Cocoa Science & Ganache Formulation', description: 'Understanding chocolate crystallization, fat curves, and emulsion stability.', order_num: 1 },
  { id: 'mod-4-2', course_id: 'course-4', title: 'Module 2: Architectural Chocolate Accents', description: 'Crafting curls, collars, tempered geometric shards, and velvet spray coats.', order_num: 2 },
  // Course 5
  { id: 'mod-5-1', course_id: 'course-5', title: 'Module 1: Sponge Chemistry & Center Injections', description: 'Baking dome-free delicate cupcakes and infusing artisanal curds.', order_num: 1 },
  { id: 'mod-5-2', course_id: 'course-5', title: 'Module 2: Boutique Frosting Swirls & Torch Art', description: 'Swiss meringue high towers, dual-tone striping, and caramelized finishes.', order_num: 2 },
  // Course 6
  { id: 'mod-6-1', course_id: 'course-6', title: 'Module 1: Pliable Sugarpaste Handling & Sharp Edges', description: 'Conditioning fondant for humid climates and sharp 90-degree corner draping.', order_num: 1 },
  { id: 'mod-6-2', course_id: 'course-6', title: 'Module 2: Sugar Peony Floristry & Veining', description: 'Crafting lifelike botanically accurate sugar blooms, wired petals, and dusting.', order_num: 2 }
];

const lessonsToSeed = [
  // Course 1
  { id: 'les-1-1-1', module_id: 'mod-1-1', course_id: 'course-1', title: 'Swiss Meringue Buttercream From Scratch', description: 'Heating egg whites with fine sugar over a double boiler to 71°C.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', duration: '18:30', is_preview: true, order_num: 1 },
  { id: 'les-1-1-2', module_id: 'mod-1-1', course_id: 'course-1', title: 'Emulsion Science: Rescuing Curdled Buttercream', description: 'Fixing cold separated buttercream vs warm soupy buttercream.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', duration: '14:20', is_preview: false, order_num: 2 },
  { id: 'les-1-1-3', module_id: 'mod-1-1', course_id: 'course-1', title: 'Color Theory & Tinting Muted Atelier Hues', description: 'Using gel colors and purple neutralizers for soft blush tones.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', duration: '16:45', is_preview: false, order_num: 3 },
  { id: 'les-1-2-1', module_id: 'mod-1-2', course_id: 'course-1', title: 'Acrylic Disk Setup & Crumb Coat Application', description: 'Precision disc centering with non-slip mats and offset spatula.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', duration: '22:10', is_preview: false, order_num: 1 },
  { id: 'les-1-2-2', module_id: 'mod-1-2', course_id: 'course-1', title: 'Bench Scraper Smoothness & Sharp Top Lip', description: 'Holding the scraper at 45 degrees to pull crisp razor-sharp rims.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', duration: '19:50', is_preview: false, order_num: 2 },
  { id: 'les-1-2-3', module_id: 'mod-1-2', course_id: 'course-1', title: 'Chilling, Peeling Disks & Flawless Touchups', description: 'Refrigeration duration and filling micro-air bubbles on cake sides.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4', duration: '12:15', is_preview: false, order_num: 3 },
  { id: 'les-1-3-1', module_id: 'mod-1-3', course_id: 'course-1', title: 'Palette Knife Loading & Pressure Control', description: 'Selecting offset knives and scooping two-tone floral colors.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', duration: '24:40', is_preview: false, order_num: 1 },
  { id: 'les-1-3-2', module_id: 'mod-1-3', course_id: 'course-1', title: 'Sculpting English Roses & Wild Anemones', description: 'Flicking petals directly onto refrigerated buttercream canvas.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', duration: '28:10', is_preview: false, order_num: 2 },
  { id: 'les-1-3-3', module_id: 'mod-1-3', course_id: 'course-1', title: '24K Edible Gold Leaf & Final Masterpiece Staging', description: 'Applying wafer-thin gold leaf with dry fan brushes.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4', duration: '15:30', is_preview: false, order_num: 3 },
  // Course 2
  { id: 'les-2-1-1', module_id: 'mod-2-1', course_id: 'course-2', title: 'The Science of Fluffy Victoria Sponge', description: 'Balancing air incorporation in creaming vs liquid absorption.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', duration: '25:00', is_preview: true, order_num: 1 },
  { id: 'les-2-1-2', module_id: 'mod-2-1', course_id: 'course-2', title: 'Rich Mud Cake & Fudge Density Formulations', description: 'Melted chocolate batter physics and preventing sinkage in deep pans.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', duration: '28:15', is_preview: false, order_num: 2 },
  { id: 'les-2-1-3', module_id: 'mod-2-1', course_id: 'course-2', title: 'Airy Chiffon Cake With Stable Whipped Meringue', description: 'Oil-based batters with stabilized meringue fold-in techniques.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4', duration: '22:45', is_preview: false, order_num: 3 },
  { id: 'les-2-2-1', module_id: 'mod-2-2', course_id: 'course-2', title: 'Oven Calibration & Insulated Cake Strip Physics', description: 'Stopping domed crusts by cooling outer edges with water-soaked strips.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', duration: '16:20', is_preview: false, order_num: 1 },
  { id: 'les-2-2-2', module_id: 'mod-2-2', course_id: 'course-2', title: 'Precision Torte Slicing & Sugar Syrup Infusion', description: 'Using aglet wire levelers and vanilla bean soaking syrups.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', duration: '18:50', is_preview: false, order_num: 2 },
  { id: 'les-2-2-3', module_id: 'mod-2-2', course_id: 'course-2', title: 'Freezing, Storing & Preserving Sponge Moisture', description: 'Double plastic wrapping warm cakes to trap steam for days.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', duration: '14:10', is_preview: false, order_num: 3 },
  // Course 3
  { id: 'les-3-1-1', module_id: 'mod-3-1', course_id: 'course-3', title: 'Conditioning Gum Paste for Extreme Paper-Thin Rolling', description: 'Kneading vegetable shortening and cornstarch to roll see-through petals.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', duration: '21:30', is_preview: true, order_num: 1 },
  { id: 'les-3-1-2', module_id: 'mod-3-1', course_id: 'course-3', title: 'Silicone Veining & Ball Tool Edge Thinning', description: 'Pressing realistic vein texture on cel pads with metal ball styluses.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', duration: '26:40', is_preview: false, order_num: 2 },
  { id: 'les-3-1-3', module_id: 'mod-3-1', course_id: 'course-3', title: 'Making Wired Bud Centers & Drying Spoons', description: 'Shaping teardrop styrofoam cones on 24-gauge floral wires.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4', duration: '19:15', is_preview: false, order_num: 3 },
  { id: 'les-3-2-1', module_id: 'mod-3-2', course_id: 'course-3', title: 'Dry Dusting With Cosmetic Gradients', description: 'Shading petal bases darker and tips translucent with matte chalk dust.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', duration: '23:50', is_preview: false, order_num: 1 },
  { id: 'les-3-2-2', module_id: 'mod-3-2', course_id: 'course-3', title: 'Steam Setting Colors for Dewdrop Gloss', description: 'Passing wired petals over boiling water vapor to melt and lock pigments.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', duration: '17:20', is_preview: false, order_num: 2 },
  { id: 'les-3-2-3', module_id: 'mod-3-2', course_id: 'course-3', title: 'Floral Tape Tier Wrapping & Food-Safe Insertion', description: 'Stretching floral tape to activate wax and capping wires with safety posy picks.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4', duration: '20:10', is_preview: false, order_num: 3 },
  // Course 4
  { id: 'les-4-1-1', module_id: 'mod-4-1', course_id: 'course-4', title: 'Couverture Percentages & Emulsion Ratios', description: 'Why 70% dark chocolate behaves differently and how to prevent split ganache.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', duration: '19:40', is_preview: true, order_num: 1 },
  { id: 'les-4-1-2', module_id: 'mod-4-1', course_id: 'course-4', title: 'Mirror Glaze Pouring at Precise Viscosity', description: 'Reaching bubble-free reflection with gelatin bloom and immersion blender technique.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4', duration: '23:15', is_preview: false, order_num: 2 },
  { id: 'les-4-2-1', module_id: 'mod-4-2', course_id: 'course-4', title: 'Acetate Collar Draping & Tempered Curls', description: 'Seeding method for dark chocolate to ensure glossy snap and release from plastic.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', duration: '20:00', is_preview: false, order_num: 1 },
  // Course 5
  { id: 'les-5-1-1', module_id: 'mod-5-1', course_id: 'course-5', title: 'Baking Flat Tops Without Liner Peeling', description: 'The science behind oven humidity, butter emulsion, and liner adhesion.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', duration: '15:20', is_preview: true, order_num: 1 },
  { id: 'les-5-1-2', module_id: 'mod-5-1', course_id: 'course-5', title: 'Salted Caramel & Passionfruit Curd Core Injection', description: 'Using corer cylinders and squeeze bottles to fill moist sponge centers evenly.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', duration: '16:50', is_preview: false, order_num: 2 },
  { id: 'les-5-2-1', module_id: 'mod-5-2', course_id: 'course-5', title: 'High-Gloss Meringue Swirls & Culinary Torch Caramelization', description: 'Piping tall Parisian bakery swirls and applying golden torch highlights.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', duration: '18:10', is_preview: false, order_num: 1 },
  // Course 6
  { id: 'les-6-1-1', module_id: 'mod-6-1', course_id: 'course-6', title: 'Sugarpaste Conditioning for Humidity Resistance', description: 'Kneading Tylose CMC powder, rolling thickness control, and preventing tearing.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4', duration: '21:00', is_preview: true, order_num: 1 },
  { id: 'les-6-1-2', module_id: 'mod-6-1', course_id: 'course-6', title: 'The Upside-Down Pan Smoothing Method', description: 'How to achieve razor-sharp edges and eliminate rounded shoulders on tall tiers.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', duration: '24:30', is_preview: false, order_num: 2 },
  { id: 'les-6-2-1', module_id: 'mod-6-2', course_id: 'course-6', title: 'Wire Cutting, Silicone Veining & Petal Ruffling', description: 'Thinning petal edges with ball tools to create delicate translucent ruffles.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4', duration: '27:15', is_preview: false, order_num: 1 },
  { id: 'les-6-2-2', module_id: 'mod-6-2', course_id: 'course-6', title: 'Steaming & Dusting Botanical Luster Gradients', description: 'Blending soft plum and dusty rose petal dusts for true botanic realism.', video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', duration: '18:40', is_preview: false, order_num: 2 }
];

async function seedAll() {
  console.log('Connecting to Neon PostgreSQL...');
  const sql = getDb();

  console.log('Seeding categories...');
  for (const cat of categoriesToSeed) {
    await sql`
      INSERT INTO categories (id, name, slug, description)
      VALUES (${cat.id}, ${cat.name}, ${cat.slug}, ${cat.description})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description;
    `;
  }
  console.log('Categories seeded successfully.');

  console.log('Seeding all 6 masterclasses into courses table...');
  for (const c of coursesToSeed) {
    await sql`
      INSERT INTO courses (
        id, title, slug, tag, short_description, description,
        thumbnail, image, preview_media, category_id, category_name,
        instructor_name, instructor_bio, skill_level, price,
        original_price, rating, reviews_count, status, featured,
        total_duration, modules_count, lessons_count
      ) VALUES (
        ${c.id}, ${c.title}, ${c.slug}, ${c.tag}, ${c.short_description}, ${c.description},
        ${c.thumbnail}, ${c.image}, ${c.preview_media}, ${c.category_id}, ${c.category_name},
        ${c.instructor_name}, ${c.instructor_bio}, ${c.skill_level}, ${c.price},
        ${c.original_price}, ${c.rating}, ${c.reviews_count}, ${c.status}, ${c.featured},
        ${c.total_duration}, ${c.modules_count}, ${c.lessons_count}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        slug = EXCLUDED.slug,
        tag = EXCLUDED.tag,
        short_description = EXCLUDED.short_description,
        description = EXCLUDED.description,
        thumbnail = EXCLUDED.thumbnail,
        image = EXCLUDED.image,
        preview_media = EXCLUDED.preview_media,
        category_id = EXCLUDED.category_id,
        category_name = EXCLUDED.category_name,
        instructor_name = EXCLUDED.instructor_name,
        instructor_bio = EXCLUDED.instructor_bio,
        skill_level = EXCLUDED.skill_level,
        price = EXCLUDED.price,
        original_price = EXCLUDED.original_price,
        rating = EXCLUDED.rating,
        reviews_count = EXCLUDED.reviews_count,
        status = EXCLUDED.status,
        featured = EXCLUDED.featured,
        total_duration = EXCLUDED.total_duration,
        modules_count = EXCLUDED.modules_count,
        lessons_count = EXCLUDED.lessons_count,
        updated_at = NOW();
    `;
  }
  console.log('All 6 courses seeded successfully.');

  console.log('Seeding modules...');
  for (const m of modulesToSeed) {
    await sql`
      INSERT INTO modules (id, course_id, title, description, order_num)
      VALUES (${m.id}, ${m.course_id}, ${m.title}, ${m.description}, ${m.order_num})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        order_num = EXCLUDED.order_num;
    `;
  }
  console.log('All modules seeded successfully.');

  console.log('Seeding lessons...');
  for (const l of lessonsToSeed) {
    await sql`
      INSERT INTO lessons (id, module_id, course_id, title, description, video_reference, duration, is_preview, status, order_num)
      VALUES (${l.id}, ${l.module_id}, ${l.course_id}, ${l.title}, ${l.description}, ${l.video_reference}, ${l.duration}, ${l.is_preview}, 'published', ${l.order_num})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        video_reference = EXCLUDED.video_reference,
        duration = EXCLUDED.duration,
        is_preview = EXCLUDED.is_preview,
        order_num = EXCLUDED.order_num;
    `;
  }
  console.log('All lessons seeded successfully.');

  const totalCourses = await sql`SELECT count(*)::int as c FROM courses;`;
  const totalModules = await sql`SELECT count(*)::int as c FROM modules;`;
  const totalLessons = await sql`SELECT count(*)::int as c FROM lessons;`;

  console.log(`\n========================================`);
  console.log(`NEON DB STATS:`);
  console.log(`Courses in DB: ${totalCourses[0].c}`);
  console.log(`Modules in DB: ${totalModules[0].c}`);
  console.log(`Lessons in DB: ${totalLessons[0].c}`);
  console.log(`========================================`);
}

seedAll().catch(console.error);

