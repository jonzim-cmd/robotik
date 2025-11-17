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

  // XP system tables (beta, additive)
  await sql`CREATE TABLE IF NOT EXISTS xp_events (
    id bigserial PRIMARY KEY,
    student_id text NOT NULL,
    robot_key text NOT NULL,
    level_key text,
    item_key text,
    type text NOT NULL,
    delta integer NOT NULL,
    tier integer,
    meta text,
    occurred_at timestamp DEFAULT now() NOT NULL
  );`

  await sql`CREATE TABLE IF NOT EXISTS student_xp_stats (
    student_id text PRIMARY KEY,
    total_xp integer NOT NULL DEFAULT 0,
    level integer NOT NULL DEFAULT 1,
    xp_in_level integer NOT NULL DEFAULT 0,
    last_event_at timestamp
  );`

  await sql`CREATE TABLE IF NOT EXISTS student_robot_stats (
    student_id text NOT NULL,
    robot_key text NOT NULL,
    robot_xp_total integer NOT NULL DEFAULT 0,
    items_done_count integer NOT NULL DEFAULT 0,
    levels_complete_count integer NOT NULL DEFAULT 0,
    mastery_tier integer NOT NULL DEFAULT 0,
    PRIMARY KEY (student_id, robot_key)
  );`

  await sql`CREATE TABLE IF NOT EXISTS badges_awarded (
    id bigserial PRIMARY KEY,
    student_id text NOT NULL,
    badge_key text NOT NULL,
    robot_key text,
    awarded_at timestamp DEFAULT now() NOT NULL
  );`

  // Idempotency/uniques for xp events
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS xp_unique_item_complete ON xp_events (student_id, item_key, type) WHERE item_key IS NOT NULL AND type = 'item_complete';`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS xp_unique_level_complete ON xp_events (student_id, level_key, type) WHERE level_key IS NOT NULL AND type = 'level_complete';`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS xp_unique_mastery ON xp_events (student_id, robot_key, type, tier) WHERE tier IS NOT NULL AND type = 'mastery_tier';`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS badges_unique_key ON badges_awarded (student_id, badge_key, robot_key);`

  // Ensure new columns exist on older deployments
  await sql`ALTER TABLE progress ADD COLUMN IF NOT EXISTS payload text;`
  await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS course text;`

  // Prevent duplicate students with same normalized name + course
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS students_unique_name_course
    ON students (lower(display_name), coalesce(course, ''));
  `
}
