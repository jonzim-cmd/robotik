import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { ProgressTable } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

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
  const db = await getDb().catch(() => null)
  if (!db) return Response.json({ ok: false, error: 'Database not configured' }, { status: 500 })

  const entries = Object.entries(delta as Record<string, any>)
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

  return Response.json({ ok: true })
}
