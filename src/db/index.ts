import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

function createDb() {
  // Use DATABASE_URL if available (cloud database), fall back to individual PG* env vars
  const connectionString = process.env.DATABASE_URL || process.env.PGDATABASE_URL;
  
  let pool;
  if (connectionString) {
    pool = new Pool({ connectionString });
  } else {
    pool = new Pool({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      user: process.env.PGUSER || 'lionet',
      password: process.env.PGPASSWORD || 'LionetRides2024!',
      database: process.env.PGDATABASE || 'lionetrides',
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
    });
  }
  return drizzle({ client: pool, schema });
}

export const db = createDb();
export default db;