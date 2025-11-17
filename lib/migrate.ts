import { sql } from '@vercel/postgres'

// Ensure @vercel/postgres sees a connection string even if only DATABASE_URL is set
const _url = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING
if (!process.env.POSTGRES_URL && _url) {
  process.env.POSTGRES_URL = _url
}

export async function runMigrations() {
  // Give a clear, consistent error if no DB is configured so API routes can surface it
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING
  if (!url) {
    throw new Error('No database configured')
  }
  await sql`CREATE TABLE IF NOT EXISTS students (
    id text PRIMARY KEY,
    display_name text NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
  );`

  await sql`CREATE TABLE IF NOT EXISTS progress (
    student_id text NOT NULL,
    robot_key text NOT NULL,
    item_key text NOT NULL,
    status text NOT NULL,
    payload text,
    updated_at timestamp DEFAULT now() NOT NULL,
    PRIMARY KEY (student_id, robot_key, item_key)
  );`

  await sql`CREATE TABLE IF NOT EXISTS level_locks (
    robot_key text NOT NULL,
    level_key text NOT NULL,
    unlocked boolean NOT NULL DEFAULT false,
    updated_at timestamp DEFAULT now() NOT NULL,
    PRIMARY KEY (robot_key, level_key)
  );`

  // Ensure new columns exist on older deployments
  await sql`ALTER TABLE progress ADD COLUMN IF NOT EXISTS payload text;`
}
