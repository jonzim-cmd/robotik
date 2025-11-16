import { drizzle } from 'drizzle-orm/vercel-postgres'
import { sql } from '@vercel/postgres'

let cached: ReturnType<typeof drizzle> | null = null

export async function getDb() {
  if (cached) return cached
  const url = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || ''
  if (!url) throw new Error('No database configured')
  cached = drizzle(sql)
  return cached
}

