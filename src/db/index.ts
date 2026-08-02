import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || '';

function createDb() {
  if (!connectionString) {
    // Return a proxy that throws descriptive errors at runtime if called
    return new Proxy(
      {},
      {
        get(_target, prop) {
          return (..._args: unknown[]) => {
            throw new Error(
              `Database not configured. Set DATABASE_URL environment variable to use the database. Called: ${String(prop)}`
            );
          };
        },
      }
    ) as unknown as ReturnType<typeof drizzle>;
  }

  const sql = neon(connectionString);
  return drizzle({ client: sql, schema });
}

export const db = createDb();
export default db;