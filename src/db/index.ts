import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://ridex:ridex123@localhost:5432/ridex_db';

function createDb() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  return drizzle({ client: pool, schema });
}

export const db = createDb();
export default db;