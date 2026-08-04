import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const db = drizzle(
  new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'lionet',
    password: process.env.PGPASSWORD || 'LionetRides2024!',
    database: process.env.PGDATABASE || 'lionetrides',
    ssl:
      process.env.PGSSLMODE === 'require'
        ? { rejectUnauthorized: false }
        : false,
    max: 20,
  }),
  { schema },
);

export { db };
export default db;
