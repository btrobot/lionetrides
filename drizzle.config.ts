import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: databaseUrl
    ? { url: databaseUrl }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'ridex',
        password: process.env.PGPASSWORD || 'ridex123',
        database: 'ridex_db',
        ssl: process.env.PGSSLMODE ? { rejectUnauthorized: false } : false,
      },
});