import { sql } from '@vercel/postgres'

export async function runMigrations() {
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
    updated_at timestamp DEFAULT now() NOT NULL,
    PRIMARY KEY (student_id, robot_key, item_key)
  );`
}

