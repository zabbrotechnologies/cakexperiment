import fs from 'fs';
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
import { getDb } from '../server/neonDb.ts';

async function main() {
  const sql = getDb();
  console.log('--- Running Cakexperiment Dual-Commerce E-Commerce Migration ---');

  // 1. Product Categories
  await sql`
    CREATE TABLE IF NOT EXISTS product_categories (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      image TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 2. Physical Products
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      short_description TEXT,
      description TEXT,
      category_id VARCHAR(64) REFERENCES product_categories(id) ON DELETE SET NULL,
      base_price NUMERIC(10, 2) NOT NULL DEFAULT 499,
      compare_at_price NUMERIC(10, 2),
      images JSONB NOT NULL DEFAULT '[]'::jsonb,
      featured BOOLEAN DEFAULT FALSE,
      is_exclusive BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      stock INT NOT NULL DEFAULT 0,
      badge VARCHAR(64),
      product_info TEXT,
      delivery_info TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 3. Product Variants
  await sql`
    CREATE TABLE IF NOT EXISTS product_variants (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant_name VARCHAR(255) NOT NULL,
      size VARCHAR(64),
      colour VARCHAR(64),
      colour_hex VARCHAR(32),
      sku VARCHAR(128),
      price_adjustment NUMERIC(10, 2) NOT NULL DEFAULT 0,
      stock INT NOT NULL DEFAULT 0,
      image TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);`;

  // 4. Persistent Cart Items (per authenticated user)
  await sql`
    CREATE TABLE IF NOT EXISTS cart_items (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant_id VARCHAR(64) NOT NULL DEFAULT '',
      quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, product_id, variant_id)
    );
  `;

  // 5. Persistent Wishlists (per authenticated user)
  await sql`
    CREATE TABLE IF NOT EXISTS wishlists (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant_id VARCHAR(64) NOT NULL DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, product_id, variant_id)
    );
  `;

  // 6. Shipping Addresses
  await sql`
    CREATE TABLE IF NOT EXISTS shipping_addresses (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      first_name VARCHAR(128) NOT NULL,
      last_name VARCHAR(128) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      street_address TEXT NOT NULL,
      apartment TEXT,
      city VARCHAR(128) NOT NULL,
      state VARCHAR(128) NOT NULL,
      pincode VARCHAR(16) NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 7. Extend orders table safely without disrupting course orders
  try { await sql`ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;`; } catch {}
  try { await sql`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;`; } catch {}
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(32) NOT NULL DEFAULT 'COURSE';`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS hamper_details JSONB;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC(10, 2) DEFAULT 0;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(32);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS expected_delivery_date VARCHAR(64);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(64);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_collected BOOLEAN DEFAULT FALSE;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_collected_at TIMESTAMP WITH TIME ZONE;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_collected_by VARCHAR(64);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS inventory_deducted BOOLEAN DEFAULT FALSE;`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL;`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_type_user ON orders(order_type, user_id);`;

  // 8. Extend order_items table safely
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL;`;
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id VARCHAR(64);`;
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name_snapshot VARCHAR(255);`;
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_label_snapshot VARCHAR(255);`;
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size_snapshot VARCHAR(64);`;
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS colour_snapshot VARCHAR(64);`;
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sku_snapshot VARCHAR(128);`;
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image_snapshot TEXT;`;
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1;`;
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2);`;
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_total NUMERIC(10, 2);`;
  try { await sql`ALTER TABLE order_items ALTER COLUMN course_name_snapshot DROP NOT NULL;`; } catch {}

  // 9. Extend payments table status check constraint to support COD lifecycle
  await sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2);`;
  try { await sql`ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;`; } catch {}
  await sql`
    ALTER TABLE payments ADD CONSTRAINT payments_status_check
    CHECK (status IN ('AWAITING_CONFIRMATION', 'CONFIRMED', 'NOT_CONFIRMED', 'REFUNDED', 'PENDING_COD', 'COLLECTED', 'CANCELLED'));
  `;

  // 10. Order Status History (5-step physical product tracking)
  await sql`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status VARCHAR(64) NOT NULL,
      note TEXT,
      changed_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);`;

  // 11. Inventory Movements
  await sql`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant_id VARCHAR(64),
      order_id VARCHAR(64),
      change_amount INT NOT NULL,
      previous_stock INT NOT NULL,
      new_stock INT NOT NULL,
      reason VARCHAR(64) NOT NULL,
      created_by VARCHAR(64),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 12. Configurable Store & Shipping Settings
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS standard_shipping_fee NUMERIC(10, 2) DEFAULT 79;`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS express_shipping_fee NUMERIC(10, 2) DEFAULT 199;`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC(10, 2) DEFAULT 1499;`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS standard_delivery_days_min INT DEFAULT 5;`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS standard_delivery_days_max INT DEFAULT 7;`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS express_delivery_days_min INT DEFAULT 2;`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS express_delivery_days_max INT DEFAULT 3;`;

  await sql`
    UPDATE settings
    SET standard_shipping_fee = COALESCE(standard_shipping_fee, 79),
        express_shipping_fee = COALESCE(express_shipping_fee, 199),
        free_shipping_threshold = COALESCE(free_shipping_threshold, 1499),
        standard_delivery_days_min = COALESCE(standard_delivery_days_min, 5),
        standard_delivery_days_max = COALESCE(standard_delivery_days_max, 7),
        express_delivery_days_min = COALESCE(express_delivery_days_min, 2),
        express_delivery_days_max = COALESCE(express_delivery_days_max, 3)
    WHERE id = 'default';
  `;

  // 13. Seed Product Categories if empty
  const catCount = await sql`SELECT COUNT(*)::int as cnt FROM product_categories;`;
  if (catCount[0].cnt === 0) {
    console.log('Seeding initial product categories...');
    const cats = [
      { id: 'cat-prod-hampers', name: 'Signature Gift Hampers', slug: 'signature-gift-hampers', description: 'Royal keepsake celebration hampers crafted with nut chocolates, cookies, and artisanal savouries.', image: '/images/gift-hamper-poster.jpg', sort_order: 1 },
      { id: 'cat-prod-cakes', name: 'Designer Cakes', slug: 'designer-cakes', description: 'Handcrafted multi-layered artisan cakes made with pure Belgian couverture and fresh creams.', image: '/images/hero-cake.png', sort_order: 2 },
      { id: 'cat-prod-cupcakes', name: 'Cupcakes & Dessert Boxes', slug: 'cupcakes-dessert-boxes', description: 'Gourmet cupcake assortments, French sablé tins, and petite baked boxes.', image: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=800&q=80', sort_order: 3 },
      { id: 'cat-prod-chocolates', name: 'Artisanal Chocolates', slug: 'artisanal-chocolates', description: 'Small-batch tempered chocolates, truffles, and nut pralines crafted in-house.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80', sort_order: 4 },
      { id: 'cat-prod-tools', name: 'Studio Apparel & Tools', slug: 'studio-apparel-tools', description: 'Professional baking tools, linen aprons, and precision decorating kits used at Cakexperiment.', image: '/images/linen-apron-plum.jpg', sort_order: 5 }
    ];
    for (const c of cats) {
      await sql`
        INSERT INTO product_categories (id, name, slug, description, image, is_active, sort_order)
        VALUES (${c.id}, ${c.name}, ${c.slug}, ${c.description}, ${c.image}, true, ${c.sort_order})
        ON CONFLICT (id) DO NOTHING;
      `;
    }
  }

  // 14. Seed Physical Products & Variants if empty
  const prodCount = await sql`SELECT COUNT(*)::int as cnt FROM products;`;
  if (prodCount[0].cnt === 0) {
    console.log('Seeding initial physical products & variants...');
    const seedProducts = [
      {
        id: 'prod-keepsake-hamper',
        slug: 'artisan-signature-keepsake-hamper',
        name: 'Artisan Signature Keepsake Hamper',
        short_description: 'Ornate floral keepsake box with 6–9 handcrafted nut chocolates, 1 jar French butter sablé cookies & 1 jar royal savoury mixture.',
        description: 'A royal presentation crafted for discerning dessert lovers and festive gifting. Packed in an ornate keepsake floral box with golden brass latches, each hamper contains handcrafted single-origin nut chocolates (Milk, Dark & White), freshly baked melt-in-mouth French sablé butter cookies, and a jar of crunchy festive savoury mixture.',
        category_id: 'cat-prod-hampers',
        base_price: 1599,
        compare_at_price: 1999,
        images: [
          '/images/gift-hamper-poster.jpg'
        ],
        featured: true,
        is_exclusive: true,
        stock: 30,
        badge: 'Signature Exclusive',
        product_info: '100% Eggless & Vegetarian • Shelf Life: 21 Days at Cool Room Temp • Handwritten Personalized Card Included',
        delivery_info: 'Dispatched from Cakexperiment Bangalore Studio in custom shock-proof gift packaging across India.',
        variants: [
          { id: 'var-hmp-std', variant_name: 'Signature Keepsake Box', size: null, colour: null, colour_hex: null, sku: 'CAK-HMP-STD', price_adjustment: 0, stock: 30, image: '/images/gift-hamper-poster.jpg' }
        ]
      },
      {
        id: 'prod-truffle-cake',
        slug: 'belgian-dark-truffle-velvet-cake',
        name: 'Belgian Dark Truffle Velvet Cake',
        short_description: '54% Callebaut dark chocolate sponge layered with silky whipped truffle ganache and roasted hazelnut crunch.',
        description: 'Our signature atelier chocolate creation baked fresh to order. Three moist cocoa-buttermilk sponge layers brushed with espresso-vanilla soak and finished with mirror-smooth dark Belgian ganache.',
        category_id: 'cat-prod-cakes',
        base_price: 949,
        compare_at_price: 1249,
        images: [
          'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80',
          '/images/hero-cake.png'
        ],
        featured: true,
        is_exclusive: false,
        stock: 25,
        badge: 'Bestseller',
        product_info: '100% Eggless • Pure Couverture Chocolate • Refrigerate upon arrival & serve at room temperature.',
        delivery_info: 'Insulated temperature-safe packaging for delicate frosted creations.',
        variants: [
          { id: 'var-trf-dk-500', variant_name: 'Dark Belgian / 500g', size: '500g', colour: 'Dark Belgian', colour_hex: '#3D221D', sku: 'CAK-TRF-DK-500', price_adjustment: 0, stock: 10, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80' },
          { id: 'var-trf-dk-1k', variant_name: 'Dark Belgian / 1 Kg', size: '1 Kg', colour: 'Dark Belgian', colour_hex: '#3D221D', sku: 'CAK-TRF-DK-1K', price_adjustment: 650, stock: 8, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80' },
          { id: 'var-trf-hz-500', variant_name: 'Hazelnut Praline / 500g', size: '500g', colour: 'Hazelnut Praline', colour_hex: '#8C5A3C', sku: 'CAK-TRF-HZ-500', price_adjustment: 100, stock: 7, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80' },
          { id: 'var-trf-hz-1k', variant_name: 'Hazelnut Praline / 1 Kg', size: '1 Kg', colour: 'Hazelnut Praline', colour_hex: '#8C5A3C', sku: 'CAK-TRF-HZ-1K', price_adjustment: 750, stock: 5, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80' }
        ]
      },
      {
        id: 'prod-cupcake-atelier',
        slug: 'french-gourmet-cupcake-collection',
        name: 'French Gourmet Cupcake & Sablé Box',
        short_description: 'Assortment of Swiss meringue swirled cupcakes paired with crisp vanilla-butter sablé biscuits.',
        description: 'Curated by Chef Anisha for intimate soirées and luxury gifting. Light vanilla bean and Dutch cocoa cupcakes crowned with feather-light Swiss meringue rosettes, accompanied by French butter cookies.',
        category_id: 'cat-prod-cupcakes',
        base_price: 749,
        compare_at_price: 949,
        images: [
          'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=900&q=80'
        ],
        featured: true,
        is_exclusive: false,
        stock: 20,
        badge: 'Chef Pick',
        product_info: 'Zero Preservatives • Baked Every Morning • Ribbon-Tied Keepsake Sleeve Included.',
        delivery_info: 'Carefully nested inside partitioned cupcake trays to preserve piping.',
        variants: [
          { id: 'var-cup-rs-6', variant_name: 'Strawberry Rose / Box of 6', size: 'Box of 6', colour: 'Strawberry Rose', colour_hex: '#E38798', sku: 'CAK-CUP-RS-6', price_adjustment: 0, stock: 12, image: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=900&q=80' },
          { id: 'var-cup-rs-12', variant_name: 'Strawberry Rose / Box of 12', size: 'Box of 12', colour: 'Strawberry Rose', colour_hex: '#E38798', sku: 'CAK-CUP-RS-12', price_adjustment: 600, stock: 6, image: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=900&q=80' },
          { id: 'var-cup-vn-6', variant_name: 'Madagascar Vanilla / Box of 6', size: 'Box of 6', colour: 'Madagascar Vanilla', colour_hex: '#F3E5AB', sku: 'CAK-CUP-vn-6', price_adjustment: 0, stock: 8, image: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=900&q=80' }
        ]
      },
      {
        id: 'prod-praline-truffles',
        slug: 'single-origin-nut-praline-truffles',
        name: 'Single-Origin Nut Praline Truffles',
        short_description: 'Artisan tempered bonbons filled with roasted almond gianduja, pistachio marzipan, and sea-salt caramel.',
        description: 'Twelve hand-tempered Belgian chocolate jewels crafted in small batches inside our studio. Delicate crisp shells give way to velvety nut pralines and aromatic spiced ganache centers.',
        category_id: 'cat-prod-chocolates',
        base_price: 899,
        compare_at_price: 1199,
        images: [
          'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=900&q=80'
        ],
        featured: true,
        is_exclusive: false,
        stock: 40,
        badge: 'Small Batch',
        product_info: '70% Dark & 38% Milk Couverture • Roasted Tree Nuts • No Palm Oil.',
        delivery_info: 'Shipped with insulated cool-pack lining for warm-weather transit.',
        variants: [
          { id: 'var-prl-as-12', variant_name: 'Assorted Gold Tin / 12 Pieces', size: '12 Pieces', colour: 'Assorted Gold', colour_hex: '#B8860B', sku: 'CAK-PRL-12', price_adjustment: 0, stock: 22, image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=900&q=80' },
          { id: 'var-prl-as-24', variant_name: 'Assorted Gold Tin / 24 Pieces', size: '24 Pieces', colour: 'Assorted Gold', colour_hex: '#B8860B', sku: 'CAK-PRL-24', price_adjustment: 750, stock: 12, image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=900&q=80' },
          { id: 'var-prl-dk-12', variant_name: 'Intense 70% Dark / 12 Pieces', size: '12 Pieces', colour: 'Intense Dark', colour_hex: '#2C1810', sku: 'CAK-PRL-DK-12', price_adjustment: 50, stock: 10, image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=900&q=80' }
        ]
      },
      {
        id: 'prod-linen-apron',
        slug: 'cakexperiment-atelier-linen-apron',
        name: 'Cakexperiment Atelier Linen Apron',
        short_description: 'Heavyweight washed French flax linen baker apron with cross-back straps and embroidered studio crest.',
        description: 'Designed for long hours at the marble pastry bench without neck strain. Breathable 240gsm European linen in signature Cakexperiment colours with deep utensil pockets and antique brass hardware.',
        category_id: 'cat-prod-tools',
        base_price: 1299,
        compare_at_price: 1699,
        images: [
          '/images/linen-apron-plum.jpg',
          '/images/linen-apron-cream.jpg'
        ],
        featured: true,
        is_exclusive: false,
        stock: 35,
        badge: 'Studio Merch',
        product_info: '100% Washed Flax Linen • Machine Washable • Adjustable Cross-Back Straps.',
        delivery_info: 'In stock for immediate dispatch across India.',
        variants: [
          { id: 'var-apr-plm-s', variant_name: 'Strawberry Plum / S', size: 'S', colour: 'Strawberry Plum', colour_hex: '#A95768', sku: 'CAK-APR-PLM-S', price_adjustment: 0, stock: 8, image: '/images/linen-apron-plum.jpg' },
          { id: 'var-apr-plm-m', variant_name: 'Strawberry Plum / M', size: 'M', colour: 'Strawberry Plum', colour_hex: '#A95768', sku: 'CAK-APR-PLM-M', price_adjustment: 0, stock: 12, image: '/images/linen-apron-plum.jpg' },
          { id: 'var-apr-plm-l', variant_name: 'Strawberry Plum / L', size: 'L', colour: 'Strawberry Plum', colour_hex: '#A95768', sku: 'CAK-APR-PLM-L', price_adjustment: 100, stock: 7, image: '/images/linen-apron-plum.jpg' },
          { id: 'var-apr-crm-m', variant_name: 'Warm Cream / M', size: 'M', colour: 'Warm Cream', colour_hex: '#F3E7DF', sku: 'CAK-APR-CRM-M', price_adjustment: 0, stock: 8, image: '/images/linen-apron-cream.jpg' }
        ]
      },
      {
        id: 'prod-decorating-kit',
        slug: 'pro-cake-turntable-piping-kit',
        name: 'Pro Studio Turntable & Piping Kit',
        short_description: 'Weighted cast-alloy revolving cake stand with seamless Korean floral nozzles, offset spatulas, and acrylic scrapers.',
        description: 'The exact hardware used by Chef Camille and Chef Anisha in our masterclasses. Smooth dual ball-bearing rotation ensures razor-sharp buttercream edges every single turn.',
        category_id: 'cat-prod-tools',
        base_price: 1899,
        compare_at_price: 2499,
        images: [
          '/images/turntable-piping-kit.jpg',
          '/images/hero-cake.png'
        ],
        featured: true,
        is_exclusive: false,
        stock: 18,
        badge: 'Pro Kit',
        product_info: '304 Food-Grade Stainless Steel Nozzles • Non-Slip Silicone Base • Carry Case Included.',
        delivery_info: 'Eligible for Free Express Delivery above order threshold.',
        variants: [
          { id: 'var-kit-rg-24', variant_name: 'Rose Gold / 24-Piece Starter', size: '24-Piece Starter', colour: 'Rose Gold', colour_hex: '#D49A9A', sku: 'CAK-KIT-RG-24', price_adjustment: 0, stock: 10, image: '/images/turntable-piping-kit.jpg' },
          { id: 'var-kit-rg-48', variant_name: 'Rose Gold / 48-Piece Pro Studio', size: '48-Piece Pro Studio', colour: 'Rose Gold', colour_hex: '#D49A9A', sku: 'CAK-KIT-RG-48', price_adjustment: 600, stock: 6, image: '/images/turntable-piping-kit.jpg' },
          { id: 'var-kit-sl-24', variant_name: 'Brushed Steel / 24-Piece Starter', size: '24-Piece Starter', colour: 'Brushed Steel', colour_hex: '#9CA3AF', sku: 'CAK-KIT-SL-24', price_adjustment: 0, stock: 8, image: '/images/hero-cake.png' }
        ]
      }
    ];

    for (const p of seedProducts) {
      await sql`
        INSERT INTO products (
          id, slug, name, short_description, description, category_id,
          base_price, compare_at_price, images, featured, is_exclusive, is_active, stock,
          badge, product_info, delivery_info
        ) VALUES (
          ${p.id}, ${p.slug}, ${p.name}, ${p.short_description}, ${p.description}, ${p.category_id},
          ${p.base_price}, ${p.compare_at_price}, ${JSON.stringify(p.images)}::jsonb,
          ${p.featured}, ${p.is_exclusive}, true, ${p.stock}, ${p.badge}, ${p.product_info}, ${p.delivery_info}
        )
        ON CONFLICT (id) DO NOTHING;
      `;

      for (const v of p.variants) {
        await sql`
          INSERT INTO product_variants (
            id, product_id, variant_name, size, colour, colour_hex, sku, price_adjustment, stock, image, is_active
          ) VALUES (
            ${v.id}, ${p.id}, ${v.variant_name}, ${v.size}, ${v.colour}, ${v.colour_hex},
            ${v.sku}, ${v.price_adjustment}, ${v.stock}, ${v.image}, true
          )
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }
  }

  // Gift Hamper is NOT a retail /shop product — keep deactivated from /shop catalog & categories
  await sql`
    UPDATE product_categories
    SET is_active = false
    WHERE id = 'cat-prod-hampers' OR slug = 'signature-gift-hampers';
  `;
  await sql`
    UPDATE products
    SET images = '["/images/gift-hamper-poster.jpg"]'::jsonb,
        is_exclusive = false,
        featured = false,
        is_active = false
    WHERE id = 'prod-keepsake-hamper' OR slug = 'artisan-signature-keepsake-hamper';
  `;
  await sql`UPDATE product_categories SET image = '/images/linen-apron-plum.jpg' WHERE id = 'cat-prod-tools';`;
  await sql`
    UPDATE products
    SET images = '["/images/linen-apron-plum.jpg", "/images/linen-apron-cream.jpg"]'::jsonb,
        featured = true
    WHERE id = 'prod-linen-apron';
  `;
  await sql`UPDATE product_variants SET image = '/images/linen-apron-plum.jpg' WHERE product_id = 'prod-linen-apron' AND colour = 'Strawberry Plum';`;
  await sql`UPDATE product_variants SET image = '/images/linen-apron-cream.jpg' WHERE product_id = 'prod-linen-apron' AND colour = 'Warm Cream';`;
  await sql`
    UPDATE products
    SET images = '["/images/turntable-piping-kit.jpg", "/images/hero-cake.png"]'::jsonb,
        is_exclusive = false,
        featured = true
    WHERE id = 'prod-decorating-kit';
  `;
  await sql`UPDATE product_variants SET image = '/images/turntable-piping-kit.jpg' WHERE product_id = 'prod-decorating-kit' AND colour = 'Rose Gold';`;
  await sql`UPDATE product_variants SET image = '/images/hero-cake.png' WHERE product_id = 'prod-decorating-kit' AND colour = 'Brushed Steel';`;
  await sql`
    UPDATE courses
    SET thumbnail = '/images/turntable-piping-kit.jpg',
        image = '/images/turntable-piping-kit.jpg'
    WHERE thumbnail LIKE '%1535141192574%' OR image LIKE '%1535141192574%';
  `;

  console.log('Migration and physical product seeding completed successfully!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

