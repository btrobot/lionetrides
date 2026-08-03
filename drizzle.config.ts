import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
<<<<<<< HEAD
  dbCredentials: databaseUrl
    ? { url: databaseUrl }
    : {
        host: 'localhost',
        port: 5432,
        user: 'ridex',
        password: 'ridex123',
        database: 'ridex_db',
        ssl: false,
      },
=======
  dbCredentials: {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'ridex',
    password: process.env.PGPASSWORD || 'ridex123',
    database: 'ridex_db',
    ssl: process.env.PGSSLMODE ? { rejectUnauthorized: false } : false,
  },
>>>>>>> 9fc5bb6 (fix: P0 数据库连接修复 + 搜索页 i18n + SVG 占位符)
});
