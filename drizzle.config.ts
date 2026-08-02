import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
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
});
