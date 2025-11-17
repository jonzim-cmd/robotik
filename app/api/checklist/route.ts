import { NextRequest, NextResponse } from 'next/server'
import { loadChecklist } from '@/lib/checklist-loader'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const robotKey = req.nextUrl.searchParams.get('robot')
    if (!robotKey) {
      return NextResponse.json({ error: 'robot parameter required' }, { status: 400 })
    }

    const checklist = await loadChecklist(robotKey)
    return NextResponse.json({ checklist })
  } catch (error) {
    console.error('GET /api/checklist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

