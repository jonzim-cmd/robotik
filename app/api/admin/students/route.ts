import { getDb } from '@/lib/db'
import { StudentsTable } from '@/lib/schema'
import { NextRequest } from 'next/server'
import { randomId } from '@/lib/id'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const db = await getDb()
    const rows = await db.select().from(StudentsTable)
    return Response.json({ students: rows.map(r => ({ id: r.id, displayName: r.displayName, course: (r as any).course || undefined })) })
  } catch (e) {
    return Response.json({ students: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = (body.displayName || '').toString().trim()
    const course = (body.course || '').toString().trim()
    if (!name) return Response.json({ ok: false, error: 'Name fehlt' }, { status: 400 })
    const db = await getDb()
    const id = randomId()
    await db.insert(StudentsTable).values({ id, displayName: name, course: course || undefined })
    return Response.json({ ok: true, student: { id, displayName: name, course: course || undefined } })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'Fehler' }, { status: 500 })
  }
}
