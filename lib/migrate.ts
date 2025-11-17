import { sql } from '@vercel/postgres'
import { resolveDbUrl } from './db-url'

// Ensure @vercel/postgres sees a connection string even if only DATABASE_URL is set
const _url = resolveDbUrl() || undefined
if (!process.env.POSTGRES_URL && _url) {
  process.env.POSTGRES_URL = _url
}

export async function runMigrations() {
  // Give a clear, consistent error if no DB is configured so API routes can surface it
  const url = resolveDbUrl()
  if (!url) {
    throw new Error('No database configured')
  }
  await sql`CREATE TABLE IF NOT EXISTS students (
    id text PRIMARY KEY,
    display_name text NOT NULL,
    course text,
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
  await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS course text;`

  // Prevent duplicate students with same normalized name + course
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS students_unique_name_course
    ON students (lower(display_name), coalesce(course, ''));
  `
}
