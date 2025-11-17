import { drizzle } from 'drizzle-orm/vercel-postgres'
import { sql } from '@vercel/postgres'
import { resolveDbUrl } from './db-url'

let cached: ReturnType<typeof drizzle> | null = null

export async function getDb() {
  if (cached) return cached
  // Accept multiple env var names, prefer POSTGRES_URL (Vercel Postgres convention).
  const url = resolveDbUrl() || ''

  if (!url) throw new Error('No database configured')

  // Ensure @vercel/postgres reads a URL even if only DATABASE_URL is set
  if (!process.env.POSTGRES_URL) {
    process.env.POSTGRES_URL = url
  }

  cached = drizzle(sql)
  return cached
}
