import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ProgressTable, StudentsTable } from '@/lib/schema'
import { inArray } from 'drizzle-orm'
import { runMigrations } from '@/lib/migrate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function DELETE(req: NextRequest) {
  try {
    await runMigrations()
    const body = await req.json().catch(() => ({} as any))
    const ids = Array.isArray(body?.ids) ? (body.ids as string[]).filter((x) => typeof x === 'string' && x.trim().length > 0) : []
    if (!ids || ids.length === 0) {
      return NextResponse.json({ ok: false, error: 'Keine IDs angegeben' }, { status: 400 })
    }

    const db = await getDb()
    // Delete progress first, then students
    await db.delete(ProgressTable).where(inArray(ProgressTable.studentId, ids))
    await db.delete(StudentsTable).where(inArray(StudentsTable.id, ids))

    return NextResponse.json({ ok: true, deleted: ids.length })
  } catch (error: any) {
    const msg = typeof error?.message === 'string' && /No database configured/i.test(error.message)
      ? 'Database not configured. Set POSTGRES_URL/DATABASE_URL.'
      : error?.message || 'Fehler'
    return NextResponse.json({ ok: false, error: msg }, { status: /Database not configured/.test(msg) ? 400 : 500 })
  }
}

