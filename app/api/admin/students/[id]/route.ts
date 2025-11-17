import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { StudentsTable, ProgressTable } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { ensureMigrations } from '@/lib/migrate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  try {
    await ensureMigrations()
    const id = context.params.id
    const body = await req.json()
    const rawName = (body.displayName || '').toString()
    const rawCourse = (body.course || '').toString()
    const name = rawName.replace(/\s+/g, ' ').trim()
    const course = rawCourse.replace(/\s+/g, ' ').trim()
    if (!name) {
      return NextResponse.json({ ok: false, error: 'Name fehlt' }, { status: 400 })
    }
    if (name.length < 2) return NextResponse.json({ ok: false, error: 'Name zu kurz' }, { status: 400 })
    if (name.length > 80) return NextResponse.json({ ok: false, error: 'Name zu lang' }, { status: 400 })
    if (course.length > 100) return NextResponse.json({ ok: false, error: 'Kurs zu lang' }, { status: 400 })
    const db = await getDb()
    try {
      await db
        .update(StudentsTable)
        .set({ displayName: name, course: course || undefined })
        .where(eq(StudentsTable.id, id))
    } catch (e: any) {
      const msg = (e?.message || '').toString()
      if (/students_unique_name_course/i.test(msg) || /duplicate key value/i.test(msg)) {
        return NextResponse.json({ ok: false, error: 'Schüler mit diesem Namen (und Kurs) existiert bereits' }, { status: 409 })
      }
      throw e
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const msg = typeof error?.message === 'string' && /No database configured/i.test(error.message)
      ? 'Database not configured. Set POSTGRES_URL/DATABASE_URL.'
      : error?.message || 'Fehler'
    return NextResponse.json({ ok: false, error: msg }, { status: /Database not configured/.test(msg) ? 400 : 500 })
  }
}

export async function DELETE(_req: NextRequest, context: { params: { id: string } }) {
  try {
    await ensureMigrations()
    const id = context.params.id
    const db = await getDb()
    // Remove dependent progress rows first to keep data consistent
    await db.delete(ProgressTable).where(eq(ProgressTable.studentId, id))
    await db.delete(StudentsTable).where(eq(StudentsTable.id, id))
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const msg = typeof error?.message === 'string' && /No database configured/i.test(error.message)
      ? 'Database not configured. Set POSTGRES_URL/DATABASE_URL.'
      : error?.message || 'Fehler'
    return NextResponse.json({ ok: false, error: msg }, { status: /Database not configured/.test(msg) ? 400 : 500 })
  }
}
