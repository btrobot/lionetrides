// Lionet Rides 初始种子数据
/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

async function seed() {
  const pool = new Pool({
    host: process.env.PGHOST || "172.18.0.1",
    port: parseInt(process.env.PGPORT || "5432"),
    user: process.env.PGUSER || "lionet",
    password: process.env.PGPASSWORD || "LionetRides2024!",
    database: process.env.PGDATABASE || "lionetrides",
  });

  try {
    // 检查是否已有数据
    const { rows } = await pool.query("SELECT count(*) FROM categories");
    if (parseInt(rows[0].count) > 0) {
      console.log("数据库已有数据，跳过 seed");
      return;
    }

    console.log("开始填充初始数据...");

    // 分类
    await pool.query(`
      INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
      ('Roller Coasters', 'roller-coasters', 'Thrilling roller coaster rides', 1, 1),
      ('Ferris Wheels', 'ferris-wheels', 'Panoramic ferris wheel rides', 2, 2),
      ('Carousels', 'carousels', 'Classic romantic carousels', 3, 3),
      ('Bumper Cars', 'bumper-cars', 'Fun interactive bumper cars', 4, 4),
      ('Water Parks', 'water-parks', 'Refreshing water park equipment', 5, 5),
      ('Kids Rides', 'kids-rides', 'Safe and fun kids rides', 6, 6)
    `);
    console.log("✓ 6 categories seeded");

    // 品牌
    await pool.query(`
      INSERT INTO brands (name, slug, description, logo, website) VALUES
      ('Lionet Rides', 'lionet-rides', 'Professional amusement ride manufacturer', '/logo.png', 'https://lionetrides.com'),
      ('Happy Park', 'happy-park', 'Kids ride equipment specialist', '/brand-happy-park.png', 'https://example.com')
    `);
    console.log("✓ 2 brands seeded");

    // 示例产品
    await pool.query(`
      INSERT INTO products (name, slug, sku, description, category_id, brand_id, price, capacity, status, is_featured) VALUES
      ('Lion King Coaster', 'lion-king-coaster', 'LR-RC-001', 'Family-friendly small roller coaster', 1, 1, 65000.00, '4-6', 'published', true),
      ('Dream Ferris Wheel', 'dream-ferris-wheel', 'LR-FW-001', '28m height with city views', 2, 1, 150000.00, '24', 'published', true),
      ('Happy Bumper Cars', 'happy-bumper-cars', 'LR-BC-001', 'Electric bumper cars for all ages', 4, 1, 32000.00, '6-10', 'published', true)
    `);
    console.log("✓ 3 products seeded");

    // 管理员账号
    const adminPassword = "Admin123!";
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await pool.query(`
      INSERT INTO users (email, password_hash, name, role, company, phone, login_attempts) VALUES
      ('admin@ridex.com', $1, 'System Admin', 'super_admin', 'RideX Manufacturing', '+86-400-888-0000', 0)
    `, [passwordHash]);
    console.log("✓ Admin account created (admin@ridex.com / Admin123!)");

    console.log("\nSeed 完成！");
  } catch (err) {
    console.error("Seed 失败:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
