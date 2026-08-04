// Lionet Rides 初始种子数据
// 执行方式: docker exec <container> node /app/migrations/seed.js

const { Pool } = require('pg');

async function seed() {
  const pool = new Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  });

  try {
    console.log('🌱 Seeding database...');

    // 检查是否已有数据
    const countResult = await pool.query('SELECT COUNT(*) FROM categories');
    if (parseInt(countResult.rows[0].count) > 0) {
      console.log('⊘ 数据库已有数据，跳过种子');
      return;
    }

    // 插入分类
    await pool.query(`
      INSERT INTO categories (name, slug, description, icon, sort_order, is_active) VALUES
        ('Roller Coasters', 'roller-coasters', 'High-speed thrill coasters', '🎢', 1, true),
        ('Ferris Wheels', 'ferris-wheels', 'Panoramic observation wheels', '🎡', 2, true),
        ('Carousels', 'carousels', 'Classic merry-go-rounds', '🎠', 3, true),
        ('Bumper Cars', 'bumper-cars', 'Electric bumper car arenas', '🚗', 4, true),
        ('Water Park Rides', 'water-rides', 'Water slides and wave pools', '🌊', 5, true),
        ('Kids Rides', 'kids-rides', 'Safe and fun rides for children', '🧸', 6, true)
    `);
    console.log('✓ 6 categories seeded');

    // 插入品牌 (需要 slug)
    await pool.query(`
      INSERT INTO brands (name, slug, description, country, is_active) VALUES
        ('Lionet Rides', 'lionet-rides', 'Premium amusement ride manufacturer since 1995', 'CN', true),
        ('ThemeCo', 'themeco', 'International theme park solutions provider', 'US', true)
    `);
    console.log('✓ 2 brands seeded');

    // 插入示例产品 (需要 sku)
    await pool.query(`
      INSERT INTO products (sku, name, slug, description, category_id, brand_id, price, status, is_featured) VALUES
        ('LR-RC-001', 'Thunder Bolt Coaster', 'thunder-bolt-coaster', 'A thrilling high-speed roller coaster with multiple loops and drops', 1, 1, 1500000.00, 'published', true),
        ('LR-FW-001', 'Sky Wheel 60m', 'sky-wheel-60m', '60-meter panoramic Ferris wheel with 36 climate-controlled cabins', 2, 1, 2000000.00, 'published', true),
        ('LR-CR-001', 'Royal Carousel', 'royal-carousel', 'Classic double-decker carousel with 60 horses and LED lighting', 3, 1, 500000.00, 'published', true)
    `);
    console.log('✓ 3 sample products seeded');

    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
