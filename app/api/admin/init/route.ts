import { runMigrations } from '@/lib/migrate'
import { resolveDbUrl } from '@/lib/db-url'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  try {
    await runMigrations()
    if (process.env.NODE_ENV === 'production') {
      const url = resolveDbUrl()
      const visible = {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        DATABASE_URL: !!process.env.DATABASE_URL,
        POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
        DATABASE_URL_UNPOOLED: !!(process as any).env?.DATABASE_URL_UNPOOLED,
        POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
        PGHOST: !!process.env.PGHOST,
        PGUSER: !!process.env.PGUSER,
        PGPASSWORD: !!process.env.PGPASSWORD,
        PGDATABASE: !!process.env.PGDATABASE,
      }
      console.info('POST /api/admin/init env:', visible, 'resolved:', !!url)
    }
    return Response.json({ ok: true })
  } catch (e: any) {
    const url = resolveDbUrl()
    const visible = {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
      POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
      DATABASE_URL_UNPOOLED: !!(process as any).env?.DATABASE_URL_UNPOOLED,
      POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
      PGHOST: !!process.env.PGHOST,
      PGUSER: !!process.env.PGUSER,
      PGPASSWORD: !!process.env.PGPASSWORD,
      PGDATABASE: !!process.env.PGDATABASE,
    }
    console.error('POST /api/admin/init error:', e, 'env:', visible, 'resolved:', !!url)
    return Response.json({ ok: false, error: e?.message || 'Fehler' }, { status: /No database configured/i.test(e?.message) ? 400 : 500 })
  }
}
