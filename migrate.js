#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Lightweight database migration runner
 * Reads SQL files from drizzle/ directory and executes them in order.
 * Tracks executed migrations in a __migrations table.
 *
 * Usage: node migrate.js
 * Required env: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
 *   or: DATABASE_URL
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool(
    connectionString
      ? { connectionString }
      : {
          host: process.env.PGHOST || 'localhost',
          port: parseInt(process.env.PGPORT || '5432'),
          user: process.env.PGUSER || 'lionet',
          password: process.env.PGPASSWORD || '',
          database: process.env.PGDATABASE || 'lionetrides',
        }
  );

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('Connected to database');

    // Create migrations tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Get already executed migrations
    const { rows: executed } = await pool.query(
      'SELECT name FROM __drizzle_migrations ORDER BY name'
    );
    const executedSet = new Set(executed.map((r) => r.name));

    // Read migration files
    const migrationsDir = path.join(__dirname, 'drizzle');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No drizzle/ directory found, skipping migrations');
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found');
      return;
    }

    // Execute pending migrations
    let count = 0;
    for (const file of files) {
      if (executedSet.has(file)) {
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      console.log(`Executing: ${file}`);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO __drizzle_migrations (name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        count++;
        console.log(`  ✓ ${file} completed`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ✗ ${file} failed:`, err.message);
        throw err;
      } finally {
        client.release();
      }
    }

    if (count === 0) {
      console.log('All migrations are up to date');
    } else {
      console.log(`Executed ${count} migration(s)`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
