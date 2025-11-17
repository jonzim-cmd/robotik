export function resolveDbUrl(): string | null {
  // Try common URL env names in order of preference
  const candidates = [
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.POSTGRES_PRISMA_URL,
  ].filter(Boolean) as string[]

  if (candidates.length > 0) return candidates[0]!

  // Try to construct from PG* parts
  const host = process.env.PGHOST || process.env.POSTGRES_HOST
  const user = process.env.PGUSER || process.env.POSTGRES_USER
  const db = process.env.PGDATABASE || process.env.POSTGRES_DATABASE
  const pass = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD
  if (host && user && db && pass) {
    const ssl = 'sslmode=require'
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${db}?${ssl}`
  }

  return null
}

