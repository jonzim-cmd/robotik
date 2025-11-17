import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { ProgressTable } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { runMigrations } from '@/lib/migrate'
import { onProgressDelta } from '@/lib/xp/services/xp'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const robot = req.nextUrl.searchParams.get('robot') || ''
  const student = req.nextUrl.searchParams.get('student') || ''
  if (!robot || !student) return Response.json({ progress: {} })

  const db = await getDb().catch(() => null)
  if (!db) return Response.json({ progress: {} })

  const rows = await db.select({ itemKey: ProgressTable.itemKey, status: ProgressTable.status, payload: ProgressTable.payload }).from(ProgressTable).where(and(eq(ProgressTable.robotKey, robot), eq(ProgressTable.studentId, student)))
  const map = Object.fromEntries(rows.map(r => [r.itemKey, { status: r.status, payload: r.payload ? JSON.parse(r.payload) : undefined }]))
  return Response.json({ progress: map })
}

export async function POST(req: Request) {
  const { robot, student, delta } = await req.json()
  await runMigrations()
  const db = await getDb().catch(() => null)
  if (!db) return Response.json({ ok: false, error: 'Database not configured' }, { status: 500 })

  const entries = Object.entries(delta as Record<string, any>)
  // Load previous statuses for idempotent XP awards
  const itemKeys = entries.map(([k]) => k)
  const prevRows = itemKeys.length ? await db.select({ itemKey: ProgressTable.itemKey, status: ProgressTable.status, payload: ProgressTable.payload }).from(ProgressTable).where(and(eq(ProgressTable.robotKey, robot), eq(ProgressTable.studentId, student))) : []
  const prevMap = Object.fromEntries(prevRows.map(r => [r.itemKey, { status: r.status as any, payload: r.payload ? JSON.parse(r.payload) : undefined }])) as Record<string, { status: 'done'|'todo'|'in_progress'; payload?: any }>

  await Promise.all(entries.map(([itemKey, val]) => {
    const isString = typeof val === 'string'
    const status = isString ? (val as string) : (val.status as string)
    const payload = isString ? null : (val.payload ? JSON.stringify(val.payload) : null)
    return db.insert(ProgressTable).values({
      robotKey: robot,
      studentId: student,
      itemKey,
      status: status as any,
      payload
    }).onConflictDoUpdate({
      target: [ProgressTable.robotKey, ProgressTable.studentId, ProgressTable.itemKey],
      set: { status: status as any, payload }
    })
  }))

  // Trigger XP engine (non-blocking for core progress flow)
  try {
    const xpDelta: Record<string, { prev?: 'todo'|'in_progress'|'done'; next: 'todo'|'in_progress'|'done'; payload?: any }> = {}
    for (const [itemKey, val] of entries) {
      const isString = typeof val === 'string'
      const nextStatus = (isString ? val : (val.status)) as any
      const prev = prevMap[itemKey]
      const prevStatus = prev?.status
      const payload = isString ? undefined : (val.payload)
      xpDelta[itemKey] = { prev: prevStatus, next: nextStatus, payload }
    }
    await onProgressDelta(robot, student, xpDelta)
  } catch (e) {
    console.error('XP engine error (non-fatal):', e)
  }

  return Response.json({ ok: true })
}
