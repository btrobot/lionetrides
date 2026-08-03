import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

function createDb() {
  // Use system env vars for remote PostgreSQL, fall back to local dev
  const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'ridex',
    password: process.env.PGPASSWORD || 'ridex123',
    database: process.env.PGDATABASE || 'ridex_db',
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  });
  return drizzle({ client: pool, schema });
}

export const db = createDb();
export default db;