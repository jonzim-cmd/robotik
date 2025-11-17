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
    const rawName = (body.displayName || '').toString()
    const rawCourse = (body.course || '').toString()
    const name = rawName.replace(/\s+/g, ' ').trim()
    const course = rawCourse.replace(/\s+/g, ' ').trim()
    if (!name) return Response.json({ ok: false, error: 'Name fehlt' }, { status: 400 })
    if (name.length < 2) return Response.json({ ok: false, error: 'Name zu kurz' }, { status: 400 })
    if (name.length > 80) return Response.json({ ok: false, error: 'Name zu lang' }, { status: 400 })
    if (course.length > 100) return Response.json({ ok: false, error: 'Kurs zu lang' }, { status: 400 })
    const db = await getDb()
    const id = randomId()
    try {
      await db.insert(StudentsTable).values({ id, displayName: name, course: course || undefined })
    } catch (e: any) {
      const msg = (e?.message || '').toString()
      if (/students_unique_name_course/i.test(msg) || /duplicate key value/i.test(msg)) {
        return Response.json({ ok: false, error: 'Schüler mit diesem Namen (und Kurs) existiert bereits' }, { status: 409 })
      }
      throw e
    }
    return Response.json({ ok: true, student: { id, displayName: name, course: course || undefined } })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'Fehler' }, { status: 500 })
  }
}
