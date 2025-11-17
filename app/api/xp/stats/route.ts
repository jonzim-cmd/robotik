import { NextRequest, NextResponse } from 'next/server'
import { ensureMigrations } from '@/lib/migrate'
import { logError } from '@/lib/log'
import { getStats } from '@/lib/xp/services/stats'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await ensureMigrations()
    const studentId = req.nextUrl.searchParams.get('student') || ''
    if (!studentId) return NextResponse.json({ error: 'student required' }, { status: 400 })
    const stats = await getStats(studentId)
    return NextResponse.json({ ok: true, stats })
  } catch (e) {
    logError('GET /api/xp/stats error:', e)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
