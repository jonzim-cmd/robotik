import { runMigrations } from '@/lib/migrate'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await runMigrations()
    return Response.json({ ok: true })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'Fehler' }, { status: 500 })
  }
}

