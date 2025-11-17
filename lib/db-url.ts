export function resolveDbUrl(): string | null {
  // Try common URL env names in order of preference, including NEON_* variants
  const candidates = [
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.POSTGRES_PRISMA_URL,
    // Neon-specific names
    process.env.NEON_POSTGRES_URL,
    process.env.NEON_DATABASE_URL,
    process.env.NEON_POSTGRES_URL_NON_POOLING,
    process.env.NEON_DATABASE_URL_UNPOOLED,
    process.env.NEON_POSTGRES_PRISMA_URL,
    // As a last resort, a non-SSL URL from Neon (we can add sslmode=require if needed)
    process.env.NEON_POSTGRES_URL_NO_SSL,
  ].filter(Boolean) as string[]

  if (candidates.length > 0) {
    const url = candidates[0]!
    // Ensure sslmode=require if not present
    if (!/sslmode=/i.test(url)) {
      const sep = url.includes('?') ? '&' : '?'
      return `${url}${sep}sslmode=require`
    }
    return url
  }

  // Try to construct from PG*/POSTGRES_* parts (include NEON_* aliases)
  const host = process.env.PGHOST || process.env.POSTGRES_HOST || process.env.NEON_PGHOST || process.env.NEON_POSTGRES_HOST || process.env.NEON_PGHOST_UNPOOLED
  const user = process.env.PGUSER || process.env.POSTGRES_USER || process.env.NEON_PGUSER || process.env.NEON_POSTGRES_USER
  const db = process.env.PGDATABASE || process.env.POSTGRES_DATABASE || process.env.NEON_PGDATABASE || process.env.NEON_POSTGRES_DATABASE
  const pass = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || process.env.NEON_PGPASSWORD || process.env.NEON_POSTGRES_PASSWORD
  if (host && user && db && pass) {
    const ssl = 'sslmode=require'
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${db}?${ssl}`
  }

  return null
}
