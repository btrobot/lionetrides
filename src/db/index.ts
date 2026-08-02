import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || '';

function createDb() {
  if (!connectionString) {
    // Return a proxy that throws descriptive errors at runtime if called
    return new Proxy(
      {},
      {
        get(_target, prop) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          return (..._: unknown[]) => {
            throw new Error(
              `Database not configured. Set DATABASE_URL environment variable to use the database. Called: ${String(prop)}`
            );
          };
        },
      }
    ) as unknown as ReturnType<typeof drizzle>;
  }

  const pool = new Pool({ connectionString });
  return drizzle({ client: pool, schema });
}

export const db = createDb();
export default db;