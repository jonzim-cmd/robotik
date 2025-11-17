export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function has(name: string) {
  return Object.prototype.hasOwnProperty.call(process.env, name) && !!process.env[name]
}

export async function GET() {
  const keys = [
    'POSTGRES_URL',
    'DATABASE_URL',
    'POSTGRES_URL_NON_POOLING',
    'DATABASE_URL_UNPOOLED',
    'POSTGRES_PRISMA_URL',
    // Neon variants
    'NEON_POSTGRES_URL',
    'NEON_DATABASE_URL',
    'NEON_POSTGRES_URL_NON_POOLING',
    'NEON_DATABASE_URL_UNPOOLED',
    'NEON_POSTGRES_PRISMA_URL',
    'PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE',
    'POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DATABASE',
    'NEON_PGHOST', 'NEON_PGUSER', 'NEON_PGPASSWORD', 'NEON_PGDATABASE',
    'NEON_POSTGRES_HOST', 'NEON_POSTGRES_USER', 'NEON_POSTGRES_PASSWORD', 'NEON_POSTGRES_DATABASE',
    'NEON_PGHOST_UNPOOLED',
  ]
  const visible: Record<string, boolean> = {}
  for (const k of keys) visible[k] = has(k)
  return Response.json({ visible })
}
