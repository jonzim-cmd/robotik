import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { LevelLocksTable } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { runMigrations } from '@/lib/migrate'

export const dynamic = 'force-dynamic'

// GET: Abrufen aller Level-Status für einen Roboter
export async function GET(req: NextRequest) {
  try {
    // Ensure tables exist so first-time clicks don't fail
    await runMigrations()
    const robotKey = req.nextUrl.searchParams.get('robot')
    if (!robotKey) {
      return NextResponse.json({ error: 'robot parameter required' }, { status: 400 })
    }

    const db = await getDb()
    const locks = await db
      .select()
      .from(LevelLocksTable)
      .where(eq(LevelLocksTable.robotKey, robotKey))

    const locksMap: Record<string, boolean> = {}
    for (const lock of locks) {
      locksMap[lock.levelKey] = lock.unlocked
    }

    return NextResponse.json({ locks: locksMap })
  } catch (error: any) {
    console.error('GET /api/admin/levels error:', error)
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
    await runMigrations()
    const body = await req.json()
    const { robotKey, levelKey, unlocked } = body

    if (!robotKey || !levelKey || typeof unlocked !== 'boolean') {
      return NextResponse.json({ error: 'robotKey, levelKey, and unlocked are required' }, { status: 400 })
    }

    const db = await getDb()
    await db
      .insert(LevelLocksTable)
      .values({
        robotKey,
        levelKey,
        unlocked,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [LevelLocksTable.robotKey, LevelLocksTable.levelKey],
        set: {
          unlocked,
          updatedAt: new Date(),
        },
      })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('POST /api/admin/levels error:', error)
    const msg = typeof error?.message === 'string' && /No database configured/i.test(error.message)
      ? 'Database not configured. Set POSTGRES_URL/DATABASE_URL.'
      : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: /Database not configured/.test(msg) ? 400 : 500 })
  }
}
