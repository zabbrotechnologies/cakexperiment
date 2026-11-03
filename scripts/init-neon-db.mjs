import dotenv from 'dotenv';
import https from 'https';
import crypto from 'crypto';
import { neon, neonConfig } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

// Fallback IPs for Neon hosts in case local DNS refuses external domains
const CANDIDATE_IPS = {
  'api.c-8.us-east-2.aws.neon.tech': ['77.112.129.102', '3.142.41.151', '3.14.138.241'],
  'ep-silent-union-bdr8bzds-pooler.c-8.us-east-2.aws.neon.tech': ['77.112.129.102', '3.142.41.151', '3.14.138.241'],
  'ep-silent-union-bdr8bzds.c-8.us-east-2.aws.neon.tech': ['77.112.129.102', '3.142.41.151', '3.14.138.241']
};

function tryFetch(url, targetIp, opts) {
  const hostname = url.hostname;
  const headers = {
    ...(opts.headers || {}),
    Host: url.host
  };

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: url.protocol,
        hostname: targetIp,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: opts.method || 'POST',
        headers,
        servername: hostname,
        timeout: 6000
      },
      res => {
        const chunks = [];
        res.on('data', c => chunks.push(Buffer.from(c)));
        res.on('end', () => {
          const bodyText = Buffer.concat(chunks).toString('utf8');
          resolve({
            ok: (res.statusCode || 500) >= 200 && (res.statusCode || 500) < 300,
            status: res.statusCode || 500,
            statusText: res.statusMessage || '',
            headers: new Headers(res.headers),
            json: async () => JSON.parse(bodyText),
            text: async () => bodyText
          });
        });
      }
    );

    req.on('timeout', () => req.destroy(new Error(`Timeout connecting to ${targetIp}`)));
    req.on('error', reject);
    if (opts.body) {
      req.write(opts.body);
    }
    req.end();
  });
}

neonConfig.fetchFunction = async (urlStr, opts = {}) => {
  const url = new URL(urlStr);
  const hostname = url.hostname;
  const ips = CANDIDATE_IPS[hostname] || [hostname];

  let lastErr;
  for (const ip of ips) {
    try {
      return await tryFetch(url, ip, opts);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error(`Failed connecting to ${hostname}`);
};

const sql = neon(process.env.DATABASE_URL);

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

async function initSchema() {
  console.log('--- Initializing Neon Postgres Database Schema for Cakexperiment E-Commerce & Auth ---');

  // 1. Users Table
  console.log('Ensuring table: users...');
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      email_verified BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active';`;

  // 2. User Profiles Table
  console.log('Ensuring table: user_profiles...');
  await sql`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      phone VARCHAR(64),
      profile_image TEXT,
      avatar TEXT,
      bio TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_image TEXT;`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar TEXT;`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(64);`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;`;

  // 3. Sessions Table
  console.log('Ensuring table: sessions...');
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(128) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(32) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 4. Categories Table
  console.log('Ensuring table: categories...');
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      image TEXT,
      status VARCHAR(32) DEFAULT 'active',
      course_count INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 5. Courses Table
  console.log('Ensuring table: courses...');
  await sql`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      tag VARCHAR(128),
      short_description TEXT,
      description TEXT,
      thumbnail TEXT,
      preview_media TEXT,
      category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
      category_name VARCHAR(255),
      instructor_name VARCHAR(255),
      instructor_avatar TEXT,
      instructor_bio TEXT,
      skill_level VARCHAR(64) DEFAULT 'All Levels',
      price NUMERIC(10, 2) DEFAULT 499,
      original_price NUMERIC(10, 2) DEFAULT 1499,
      rating NUMERIC(3, 2) DEFAULT 5.0,
      reviews_count INT DEFAULT 0,
      image TEXT,
      status VARCHAR(32) DEFAULT 'published',
      featured BOOLEAN DEFAULT FALSE,
      total_duration VARCHAR(64),
      modules_count INT DEFAULT 0,
      lessons_count INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // Add missing columns if courses already existed
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS short_description TEXT;`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail TEXT;`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS preview_media TEXT;`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_avatar TEXT;`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_bio TEXT;`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_duration VARCHAR(64);`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`;

  // 6. Modules Table
  console.log('Ensuring table: modules...');
  await sql`
    CREATE TABLE IF NOT EXISTS modules (
      id VARCHAR(64) PRIMARY KEY,
      course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      order_num INT DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 7. Lessons Table
  console.log('Ensuring table: lessons...');
  await sql`
    CREATE TABLE IF NOT EXISTS lessons (
      id VARCHAR(64) PRIMARY KEY,
      module_id VARCHAR(64) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
      course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      video_reference TEXT NOT NULL,
      duration VARCHAR(32) DEFAULT '15:00',
      is_preview BOOLEAN DEFAULT FALSE,
      status VARCHAR(32) DEFAULT 'published',
      order_num INT DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 8. Orders Table
  console.log('Ensuring table: orders...');
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(64) PRIMARY KEY,
      order_number VARCHAR(64) NOT NULL UNIQUE,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED')),
      total_amount NUMERIC(10, 2) NOT NULL DEFAULT 499,
      approved_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      approved_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // Ensure orders table columns exist
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(64);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT 499;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) DEFAULT 499;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS course_title VARCHAR(255);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS course_id VARCHAR(64);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(64) DEFAULT 'WHATSAPP_MANUAL';`;
  try { await sql`ALTER TABLE orders ALTER COLUMN course_title DROP NOT NULL;`; } catch {}
  try { await sql`ALTER TABLE orders ALTER COLUMN course_id DROP NOT NULL;`; } catch {}
  try { await sql`ALTER TABLE orders ALTER COLUMN payment_method DROP NOT NULL;`; } catch {}
  try { await sql`ALTER TABLE orders ALTER COLUMN user_email DROP NOT NULL;`; } catch {}
  try { await sql`ALTER TABLE orders ALTER COLUMN user_name DROP NOT NULL;`; } catch {}
  await sql`UPDATE orders SET total_amount = COALESCE(total_amount, amount, 499), amount = COALESCE(amount, total_amount, 499);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS approved_by VARCHAR(64);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`;

  // 9. Order Items Table
  console.log('Ensuring table: order_items...');
  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      course_id VARCHAR(64) REFERENCES courses(id) ON DELETE SET NULL,
      course_name_snapshot VARCHAR(255) NOT NULL,
      price_at_purchase NUMERIC(10, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 10. Payments Table
  console.log('Ensuring table: payments...');
  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
      payment_method VARCHAR(64) NOT NULL DEFAULT 'WHATSAPP_MANUAL',
      status VARCHAR(32) NOT NULL DEFAULT 'AWAITING_CONFIRMATION' CHECK (status IN ('AWAITING_CONFIRMATION', 'CONFIRMED', 'NOT_CONFIRMED', 'REFUNDED')),
      confirmed_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      confirmed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 11. Enrollments Table
  console.log('Ensuring table: enrollments...');
  await sql`
    CREATE TABLE IF NOT EXISTS enrollments (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      order_id VARCHAR(64) REFERENCES orders(id) ON DELETE SET NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
      progress INT DEFAULT 0,
      completed_lessons TEXT[] DEFAULT '{}',
      activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, course_id)
    );
  `;

  // Ensure status column on enrollments exists
  await sql`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'ACTIVE';`;
  await sql`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`;

  // 12. Lesson Progress Table
  console.log('Ensuring table: lesson_progress...');
  await sql`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      lesson_id VARCHAR(64) NOT NULL,
      completed BOOLEAN DEFAULT TRUE,
      last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, lesson_id)
    );
  `;
  await sql`ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`;
  await sql`ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`;

  // 13. Admin Audit Logs Table
  console.log('Ensuring table: admin_audit_logs...');
  await sql`
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      admin_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      order_id VARCHAR(64) REFERENCES orders(id) ON DELETE SET NULL,
      action VARCHAR(128) NOT NULL,
      previous_status VARCHAR(64),
      new_status VARCHAR(64),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 14. Reviews Table
  console.log('Ensuring table: reviews...');
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      user_name VARCHAR(255) NOT NULL,
      user_avatar TEXT,
      rating NUMERIC(2, 1) DEFAULT 5.0,
      comment TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 15. Settings Table
  console.log('Ensuring table: settings...');
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id VARCHAR(64) PRIMARY KEY,
      academy_name VARCHAR(255) NOT NULL,
      tagline TEXT,
      default_course_price NUMERIC(10, 2) DEFAULT 499,
      whatsapp_number VARCHAR(64) DEFAULT '918248957918',
      support_email VARCHAR(255),
      support_phone VARCHAR(64),
      address TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // Provision Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cakexperiment.demo';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
  console.log(`Ensuring provisioned administrator account for: ${adminEmail}...`);

  const existingAdmin = await sql`SELECT id, email, role FROM users WHERE LOWER(email) = LOWER(${adminEmail});`;
  const adminPasswordHash = hashPassword(adminPassword);

  if (existingAdmin.length === 0) {
    const adminId = `usr_admin_${Date.now()}`;
    await sql`
      INSERT INTO users (id, name, email, password_hash, role, email_verified)
      VALUES (${adminId}, 'Master Chef Admin', ${adminEmail.toLowerCase()}, ${adminPasswordHash}, 'ADMIN', TRUE);
    `;
    console.log(`Provisioned new ADMIN account with ID: ${adminId}`);
  } else {
    await sql`
      UPDATE users 
      SET password_hash = ${adminPasswordHash}, role = 'ADMIN', updated_at = NOW()
      WHERE LOWER(email) = LOWER(${adminEmail});
    `;
    console.log(`Updated existing user ${adminEmail} with role ADMIN.`);
  }

  // Seed default settings row if empty
  const settingsRows = await sql`SELECT id FROM settings WHERE id = 'default';`;
  if (settingsRows.length === 0) {
    await sql`
      INSERT INTO settings (id, academy_name, tagline, default_course_price, whatsapp_number, support_email, support_phone, address)
      VALUES (
        'default',
        'Cakexperiment Academy',
        'Master the Science and Art of Haute Cake Design',
        499,
        '918248957918',
        'support@cakexperiment.demo',
        '+91 8248957918',
        'Cakexperiment Studio, Whitefield, Bangalore, India'
      );
    `;
  }

  // Seed standard courses, modules, lessons if missing
  const courseCount = await sql`SELECT COUNT(*)::int as count FROM courses;`;
  const moduleCount = await sql`SELECT COUNT(*)::int as count FROM modules;`;
  console.log(`Current courses count: ${courseCount[0].count}, modules count: ${moduleCount[0].count}`);
  if (true) {
    console.log('Seeding/updating full catalog of courses, modules, and lessons into Neon Postgres...');
    
    const coursesToSeed = [
      {
        id: 'course-1',
        title: 'Buttercream Decoration Masterclass',
        slug: 'buttercream-decoration-masterclass',
        tag: 'Bestseller Masterclass',
        short_description: 'Master silky Swiss meringue buttercream, crisp palette knife textures, and breathtaking floral rosettes.',
        description: 'Step inside the professional studio of Cakexperiment to elevate your cake decorating from amateur to artisanal luxury. Learn the exact chemistry of fail-safe Swiss meringue buttercream, construct smooth side walls with acrylic disks, and pipe romantic floral rosettes.',
        thumbnail: '/images/hero-cake.png',
        image: '/images/hero-cake.png',
        preview_media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        category_id: 'cat-2',
        category_name: 'Cake Decorating',
        instructor_name: 'Chef Camille Laurent',
        instructor_avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
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
        instructor_avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
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
        instructor_avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=80',
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
      }
    ];

    for (const c of coursesToSeed) {
      await sql`
        INSERT INTO courses (
          id, title, slug, tag, short_description, description, thumbnail, image, preview_media,
          category_id, category_name, instructor_name, instructor_avatar, instructor_bio,
          skill_level, price, original_price, rating, reviews_count, status, featured,
          total_duration, modules_count, lessons_count
        ) VALUES (
          ${c.id}, ${c.title}, ${c.slug}, ${c.tag}, ${c.short_description}, ${c.description},
          ${c.thumbnail}, ${c.image}, ${c.preview_media}, ${c.category_id}, ${c.category_name},
          ${c.instructor_name}, ${c.instructor_avatar}, ${c.instructor_bio}, ${c.skill_level},
          ${c.price}, ${c.original_price}, ${c.rating}, ${c.reviews_count}, ${c.status},
          ${c.featured}, ${c.total_duration}, ${c.modules_count}, ${c.lessons_count}
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          price = EXCLUDED.price,
          short_description = EXCLUDED.short_description,
          description = EXCLUDED.description;
      `;

      // Seed modules & lessons for course-1
      if (c.id === 'course-1') {
        const modules = [
          {
            id: 'mod-1-1',
            course_id: 'course-1',
            title: 'Module 1: Silky Swiss Meringue Buttercream Science',
            description: 'Sugar syrup temperatures, protein denaturation, emulsion stability, and temperature recovery.',
            order_num: 1,
            lessons: [
              {
                id: 'les-1-1-1',
                title: 'Lesson 1: The Chemistry of Sugar Syrup & Egg White Stability',
                description: 'Understand heating egg whites to 71°C to dissolve sugar crystals and achieve glossy stiff peaks.',
                video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                duration: '18:45',
                is_preview: true,
                order_num: 1
              },
              {
                id: 'les-1-1-2',
                title: 'Lesson 2: Butter Emulsification & Temperature Fixes',
                description: 'Troubleshooting curdled or soupy buttercream and recovering the perfect silky emulsion.',
                video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                duration: '14:20',
                is_preview: false,
                order_num: 2
              },
              {
                id: 'les-1-1-3',
                title: 'Lesson 3: Removing Air Bubbles & Color Pigmentation',
                description: 'Paddle blade paddle technique to achieve bubble-free buttercream and color saturation.',
                video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                duration: '16:10',
                is_preview: false,
                order_num: 3
              }
            ]
          },
          {
            id: 'mod-1-2',
            course_id: 'course-1',
            title: 'Module 2: Piping Dynamics & Floral Rosettes',
            description: 'Wrist ergonomics, angle alignment, star tips, and dimensional blooming petals.',
            order_num: 2,
            lessons: [
              {
                id: 'les-1-2-1',
                title: 'Lesson 1: Basic Piping Techniques & Hand Posture',
                description: 'Master wrist pressure, rotation speed on the turntable, and sharp tail cut-offs.',
                video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                duration: '21:30',
                is_preview: false,
                order_num: 1
              },
              {
                id: 'les-1-2-2',
                title: 'Lesson 2: Creating Dimensional Rosettes & Ruffles',
                description: 'Piping open star rosettes, overlapping petals, and delicate buttercream fabric ruffles.',
                video_reference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                duration: '19:15',
                is_preview: false,
                order_num: 2
              }
            ]
          }
        ];

        for (const m of modules) {
          await sql`
            INSERT INTO modules (id, course_id, title, description, order_num)
            VALUES (${m.id}, ${m.course_id}, ${m.title}, ${m.description}, ${m.order_num})
            ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, course_id = EXCLUDED.course_id;
          `;
          for (const l of m.lessons) {
            await sql`
              INSERT INTO lessons (id, module_id, course_id, title, description, video_reference, duration, is_preview, status, order_num)
              VALUES (${l.id}, ${m.id}, ${m.course_id}, ${l.title}, ${l.description}, ${l.video_reference}, ${l.duration}, ${l.is_preview}, 'published', ${l.order_num})
              ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, video_reference = EXCLUDED.video_reference, course_id = EXCLUDED.course_id;
            `;
          }
        }
      }
    }
  }

  const finalCheck = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log('Tables verified in Neon database:', finalCheck.map(t => t.table_name));
  console.log('--- Schema & Catalog Initialization Complete! ---');
}

initSchema().catch(err => {
  console.error('Error during schema init:', err);
  process.exit(1);
});
