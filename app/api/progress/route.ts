import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { ProgressTable } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const robot = req.nextUrl.searchParams.get('robot') || ''
  const student = req.nextUrl.searchParams.get('student') || ''
  if (!robot || !student) return Response.json({ progress: {} })

  const db = await getDb().catch(() => null)
  if (!db) return Response.json({ progress: {} })

  const rows = await db.select().from(ProgressTable).where(and(eq(ProgressTable.robotKey, robot), eq(ProgressTable.studentId, student)))
  const map = Object.fromEntries(rows.map(r => [r.itemKey, r.status]))
  return Response.json({ progress: map })
}

export async function POST(req: Request) {
  const { robot, student, delta } = await req.json()
  const db = await getDb().catch(() => null)
  if (!db) return Response.json({ ok: true, mode: 'local' })

  const entries = Object.entries(delta as Record<string, string>)
  await Promise.all(entries.map(([itemKey, status]) =>
    db.insert(ProgressTable).values({
      robotKey: robot,
      studentId: student,
      itemKey,
      status: status as any
    }).onConflictDoUpdate({
      target: [ProgressTable.robotKey, ProgressTable.studentId, ProgressTable.itemKey],
      set: { status: status as any }
    })
  ))

  return Response.json({ ok: true })
}
