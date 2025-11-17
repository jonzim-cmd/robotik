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
    'PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE',
    'POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DATABASE',
  ]
  const visible: Record<string, boolean> = {}
  for (const k of keys) visible[k] = has(k)
  return Response.json({ visible })
}

