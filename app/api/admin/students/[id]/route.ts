import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { StudentsTable, ProgressTable } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { runMigrations } from '@/lib/migrate'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  try {
    await runMigrations()
    const id = context.params.id
    const body = await req.json()
    const name = (body.displayName || '').toString().trim()
    if (!name) {
      return NextResponse.json({ ok: false, error: 'Name fehlt' }, { status: 400 })
    }
    const db = await getDb()
    await db
      .update(StudentsTable)
      .set({ displayName: name })
      .where(eq(StudentsTable.id, id))

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
    await runMigrations()
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

