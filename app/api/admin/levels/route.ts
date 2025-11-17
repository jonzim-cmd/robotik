import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { LevelLocksTable } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { ensureMigrations } from '@/lib/migrate'
import { resolveDbUrl } from '@/lib/db-url'
import { sql as dsql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET: Abrufen aller Level-Status für einen Roboter
export async function GET(req: NextRequest) {
  try {
    // Ensure tables exist so first-time clicks don't fail
    await ensureMigrations()
    if (process.env.NODE_ENV !== 'production') {
      // minimal noise in dev
    } else {
      const url = resolveDbUrl()
      const visible = {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        DATABASE_URL: !!process.env.DATABASE_URL,
        POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
        DATABASE_URL_UNPOOLED: !!(process as any).env?.DATABASE_URL_UNPOOLED,
        POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
        NEON_POSTGRES_URL: !!process.env.NEON_POSTGRES_URL,
        NEON_DATABASE_URL: !!process.env.NEON_DATABASE_URL,
        NEON_POSTGRES_URL_NON_POOLING: !!process.env.NEON_POSTGRES_URL_NON_POOLING,
        NEON_DATABASE_URL_UNPOOLED: !!(process as any).env?.NEON_DATABASE_URL_UNPOOLED,
        NEON_POSTGRES_PRISMA_URL: !!process.env.NEON_POSTGRES_PRISMA_URL,
        PGHOST: !!process.env.PGHOST,
        PGUSER: !!process.env.PGUSER,
        PGPASSWORD: !!process.env.PGPASSWORD,
        PGDATABASE: !!process.env.PGDATABASE,
        NEON_PGHOST: !!process.env.NEON_PGHOST,
        NEON_PGUSER: !!process.env.NEON_PGUSER,
        NEON_PGPASSWORD: !!process.env.NEON_PGPASSWORD,
        NEON_PGDATABASE: !!process.env.NEON_PGDATABASE,
      }
      console.info('GET /api/admin/levels env:', visible, 'resolved:', !!url)
    }
    const robotKey = req.nextUrl.searchParams.get('robot')
    const course = (req.nextUrl.searchParams.get('course') || '').toString()
    if (!robotKey) {
      return NextResponse.json({ error: 'robot parameter required' }, { status: 400 })
    }

    const db = await getDb()
    const locks = await db
      .select()
      .from(LevelLocksTable)
      .where(and(eq(LevelLocksTable.robotKey, robotKey), eq(LevelLocksTable.course, course)))

    const locksMap: Record<string, boolean> = {}
    for (const lock of locks) {
      locksMap[lock.levelKey] = lock.unlocked
    }

    return NextResponse.json({ locks: locksMap })
  } catch (error: any) {
    const url = resolveDbUrl()
    const visible = {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
      POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
      DATABASE_URL_UNPOOLED: !!(process as any).env?.DATABASE_URL_UNPOOLED,
      POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
      NEON_POSTGRES_URL: !!process.env.NEON_POSTGRES_URL,
      NEON_DATABASE_URL: !!process.env.NEON_DATABASE_URL,
      NEON_POSTGRES_URL_NON_POOLING: !!process.env.NEON_POSTGRES_URL_NON_POOLING,
      NEON_DATABASE_URL_UNPOOLED: !!(process as any).env?.NEON_DATABASE_URL_UNPOOLED,
      NEON_POSTGRES_PRISMA_URL: !!process.env.NEON_POSTGRES_PRISMA_URL,
      PGHOST: !!process.env.PGHOST,
      PGUSER: !!process.env.PGUSER,
      PGPASSWORD: !!process.env.PGPASSWORD,
      PGDATABASE: !!process.env.PGDATABASE,
      NEON_PGHOST: !!process.env.NEON_PGHOST,
      NEON_PGUSER: !!process.env.NEON_PGUSER,
      NEON_PGPASSWORD: !!process.env.NEON_PGPASSWORD,
      NEON_PGDATABASE: !!process.env.NEON_PGDATABASE,
    }
    console.error('GET /api/admin/levels error:', error, 'env:', visible, 'resolved:', !!url)
    const msg = typeof error?.message === 'string' && /No database configured/i.test(error.message)
      ? 'Database not configured. Set POSTGRES_URL/DATABASE_URL.'
      : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: /Database not configured/.test(msg) ? 400 : 500 })
  }
}

// POST: Setzen des Lock-Status für ein Level
export async function POST(req: NextRequest) {
  try {
    // Ensure tables exist so writes never fail on fresh DBs
    await ensureMigrations()
    if (process.env.NODE_ENV === 'production') {
      const url = resolveDbUrl()
      const visible = {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        DATABASE_URL: !!process.env.DATABASE_URL,
        POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
        DATABASE_URL_UNPOOLED: !!(process as any).env?.DATABASE_URL_UNPOOLED,
        POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
        NEON_POSTGRES_URL: !!process.env.NEON_POSTGRES_URL,
        NEON_DATABASE_URL: !!process.env.NEON_DATABASE_URL,
        NEON_POSTGRES_URL_NON_POOLING: !!process.env.NEON_POSTGRES_URL_NON_POOLING,
        NEON_DATABASE_URL_UNPOOLED: !!(process as any).env?.NEON_DATABASE_URL_UNPOOLED,
        NEON_POSTGRES_PRISMA_URL: !!process.env.NEON_POSTGRES_PRISMA_URL,
        PGHOST: !!process.env.PGHOST,
        PGUSER: !!process.env.PGUSER,
        PGPASSWORD: !!process.env.PGPASSWORD,
        PGDATABASE: !!process.env.PGDATABASE,
        NEON_PGHOST: !!process.env.NEON_PGHOST,
        NEON_PGUSER: !!process.env.NEON_PGUSER,
        NEON_PGPASSWORD: !!process.env.NEON_PGPASSWORD,
        NEON_PGDATABASE: !!process.env.NEON_PGDATABASE,
      }
      console.info('POST /api/admin/levels env:', visible, 'resolved:', !!url)
    }
    const body = await req.json()

    // Bulk mode: { robotKey, updates: [{ levelKey, unlocked }, ...] }
    if (Array.isArray(body?.updates)) {
      const robotKey = body.robotKey
      const course = (body.course || '').toString()
      const updates = body.updates as Array<{ levelKey: string; unlocked: boolean }>
      if (!robotKey) {
        return NextResponse.json({ error: 'robotKey is required' }, { status: 400 })
      }
      const rows = updates.filter(u => u && typeof u.levelKey === 'string' && typeof u.unlocked === 'boolean')
      if (rows.length === 0) {
        return NextResponse.json({ ok: true })
      }
      const db = await getDb()
      const values = rows.map(u => ({
        robotKey,
        course,
        levelKey: u.levelKey,
        unlocked: u.unlocked,
        updatedAt: new Date(),
      }))
      await db
        .insert(LevelLocksTable)
        .values(values)
        .onConflictDoUpdate({
          target: [LevelLocksTable.robotKey, LevelLocksTable.course, LevelLocksTable.levelKey],
          set: {
            unlocked: dsql`excluded.unlocked`,
            updatedAt: dsql`excluded.updated_at`,
          },
        })
      return NextResponse.json({ ok: true })
    }

    // Single update mode: { robotKey, levelKey, unlocked }
    const { robotKey, levelKey, unlocked } = body
    const course = (body.course || '').toString()

    if (!robotKey || !levelKey || typeof unlocked !== 'boolean') {
      return NextResponse.json({ error: 'robotKey, levelKey, and unlocked are required' }, { status: 400 })
    }

    const db = await getDb()
    await db
      .insert(LevelLocksTable)
      .values({
        robotKey,
        course,
        levelKey,
        unlocked,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [LevelLocksTable.robotKey, LevelLocksTable.course, LevelLocksTable.levelKey],
        set: {
          unlocked,
          updatedAt: new Date(),
        },
      })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const url = resolveDbUrl()
    const visible = {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
      POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
      DATABASE_URL_UNPOOLED: !!(process as any).env?.DATABASE_URL_UNPOOLED,
      POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
      NEON_POSTGRES_URL: !!process.env.NEON_POSTGRES_URL,
      NEON_DATABASE_URL: !!process.env.NEON_DATABASE_URL,
      NEON_POSTGRES_URL_NON_POOLING: !!process.env.NEON_POSTGRES_URL_NON_POOLING,
      NEON_DATABASE_URL_UNPOOLED: !!(process as any).env?.NEON_DATABASE_URL_UNPOOLED,
      NEON_POSTGRES_PRISMA_URL: !!process.env.NEON_POSTGRES_PRISMA_URL,
      PGHOST: !!process.env.PGHOST,
      PGUSER: !!process.env.PGUSER,
      PGPASSWORD: !!process.env.PGPASSWORD,
      PGDATABASE: !!process.env.PGDATABASE,
      NEON_PGHOST: !!process.env.NEON_PGHOST,
      NEON_PGUSER: !!process.env.NEON_PGUSER,
      NEON_PGPASSWORD: !!process.env.NEON_PGPASSWORD,
      NEON_PGDATABASE: !!process.env.NEON_PGDATABASE,
    }
    console.error('POST /api/admin/levels error:', error, 'env:', visible, 'resolved:', !!url)
    const msg = typeof error?.message === 'string' && /No database configured/i.test(error.message)
      ? 'Database not configured. Set POSTGRES_URL/DATABASE_URL.'
      : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: /Database not configured/.test(msg) ? 400 : 500 })
  }
}
