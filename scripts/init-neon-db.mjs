import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function initSchema() {
  console.log('--- Initializing Neon Postgres Database Schema ---');

  // 1. Create Categories Table
  console.log('Creating table: categories...');
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

  // 2. Create Courses Table
  console.log('Creating table: courses...');
  await sql`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      tag VARCHAR(128),
      category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
      category_name VARCHAR(255),
      instructor_name VARCHAR(255),
      skill_level VARCHAR(64) DEFAULT 'All Levels',
      price NUMERIC(10, 2) DEFAULT 0,
      original_price NUMERIC(10, 2),
      rating NUMERIC(3, 2) DEFAULT 5.0,
      reviews_count INT DEFAULT 0,
      image TEXT,
      description TEXT,
      status VARCHAR(32) DEFAULT 'published',
      modules_count INT DEFAULT 0,
      lessons_count INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 3. Create Settings Table
  console.log('Creating table: settings...');
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id VARCHAR(64) PRIMARY KEY,
      academy_name VARCHAR(255) NOT NULL,
      tagline TEXT,
      default_course_price NUMERIC(10, 2) DEFAULT 499,
      support_email VARCHAR(255),
      support_phone VARCHAR(64),
      address TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 4. Create Object Storage Metadata Table
  console.log('Creating table: media_assets (for Neon Object Storage track)...');
  await sql`
    CREATE TABLE IF NOT EXISTS media_assets (
      id SERIAL PRIMARY KEY,
      key VARCHAR(512) NOT NULL UNIQUE,
      bucket VARCHAR(128) NOT NULL,
      content_type VARCHAR(128),
      size_bytes BIGINT,
      url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // Seed default settings if empty
  const settingsRows = await sql`SELECT id FROM settings WHERE id = 'default';`;
  if (settingsRows.length === 0) {
    console.log('Seeding initial settings row...');
    await sql`
      INSERT INTO settings (id, academy_name, tagline, default_course_price, support_email, support_phone, address)
      VALUES (
        'default',
        'Cakexperiment Academy',
        'Master the Science and Art of Haute Cake Design',
        499,
        'support@cakexperiment.demo',
        '+91 98765 43210',
        'Cakexperiment Studio, Whitefield, Bangalore, India'
      );
    `;
  }

  // Seed initial categories if empty
  const catRows = await sql`SELECT COUNT(*)::int as count FROM categories;`;
  if (catRows[0].count === 0) {
    console.log('Seeding initial categories...');
    const seedCategories = [
      ['cat-1', 'Cake Baking', 'cake-baking', 'Master sponge science, moisture retention, crumb structure, and temperature control.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', 3],
      ['cat-2', 'Cake Decorating', 'cake-decorating', 'Piping mastery, palette knife floral textures, smooth buttercream finishes, and rosettes.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', 4],
      ['cat-3', 'Fondant Art', 'fondant-art', 'Sculpting, sharp edge finishing, sugar flowers, and tiered cake architecture.', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80', 2],
      ['cat-4', 'Chocolate Techniques', 'chocolate-techniques', 'Tempering, drip consistency, mirror glazes, chocolate curls, and rich ganache alchemy.', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80', 2],
      ['cat-5', 'Cupcakes & Mini Desserts', 'cupcakes-and-desserts', 'Petite treats, filled centers, Swiss meringue swirls, and display aesthetics.', 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=800&q=80', 2],
      ['cat-6', 'Modern Celebration Cakes', 'celebration-cakes', 'High-end birthday, baby shower, and wedding centerpiece designs with modern artistic flair.', 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=800&q=80', 3]
    ];

    for (const [id, name, slug, desc, img, count] of seedCategories) {
      await sql`
        INSERT INTO categories (id, name, slug, description, image, course_count)
        VALUES (${id}, ${name}, ${slug}, ${desc}, ${img}, ${count});
      `;
    }
    console.log('Seeded 6 initial categories.');
  }

  const finalCheck = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log('Tables created in Neon database:', finalCheck.map(t => t.table_name));
  console.log('Schema initialization complete!');
}

initSchema().catch(err => {
  console.error('Error during schema init:', err);
  process.exit(1);
});

