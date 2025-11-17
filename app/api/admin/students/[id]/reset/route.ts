import { NextRequest, NextResponse } from 'next/server'
import { ensureMigrations } from '@/lib/migrate'
import { getDb } from '@/lib/db'
import { ProgressTable } from '@/lib/schema'
import { and, eq, inArray, sql as dsql } from 'drizzle-orm'
import { loadChecklist } from '@/lib/checklist-loader'
import { StudentRobotStatsTable, StudentXpStatsTable, XpEventsTable } from '@/lib/xp/storage/schema'
import { getRules, levelFromTotalXP } from '@/lib/xp/services/rules'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  await ensureMigrations()
  const db = await getDb()
  const studentId = context.params.id
  const body = await req.json().catch(() => ({} as any))
  const action = (body?.action || '').toString()

  if (action === 'reset_progress') {
    const robotKey = (body?.robotKey || '').toString()
    if (!robotKey) return NextResponse.json({ ok: false, error: 'robotKey required' }, { status: 400 })
    const upToLevelIndex = Number.isFinite(body?.upToLevelIndex) ? Number(body.upToLevelIndex) : null

    // Determine affected item keys and level keys
    const checklist = await loadChecklist(robotKey)
    const levels = checklist.levels || []
    const chosenLevels = upToLevelIndex == null ? levels : levels.filter((_: any, idx: number) => idx <= upToLevelIndex)
    const itemKeys: string[] = chosenLevels.flatMap((l: any) => l.items?.map((it: any) => it.key) || [])
    const levelKeys: string[] = chosenLevels.map((l: any) => l.key)

    await db.transaction(async (tx) => {
      // Delete progress rows for selected items
      if (itemKeys.length) {
        await tx.delete(ProgressTable)
          .where(and(eq(ProgressTable.studentId, studentId), eq(ProgressTable.robotKey, robotKey), inArray(ProgressTable.itemKey, itemKeys)))
      }
      // Remove XP events associated with those items/levels and mastery tiers for this robot
      if (itemKeys.length) {
        await tx.delete(XpEventsTable)
          .where(and(eq(XpEventsTable.studentId, studentId), eq(XpEventsTable.robotKey, robotKey), inArray(XpEventsTable.itemKey, itemKeys)))
      }
      if (levelKeys.length) {
        await tx.delete(XpEventsTable)
          .where(and(eq(XpEventsTable.studentId, studentId), eq(XpEventsTable.robotKey, robotKey), inArray(XpEventsTable.levelKey, levelKeys)))
      }
      // Remove mastery tier events for this robot (they may no longer be valid)
      await tx.delete(XpEventsTable)
        .where(and(eq(XpEventsTable.studentId, studentId), eq(XpEventsTable.robotKey, robotKey), eq(XpEventsTable.type, 'mastery_tier')))

      // Recompute robot stats from remaining data
      const rules = getRules(robotKey)
      const xpSumRes: any = await tx.execute(dsql`SELECT COALESCE(SUM(${XpEventsTable.delta}), 0)::int AS total FROM ${XpEventsTable} WHERE ${XpEventsTable.studentId} = ${studentId} AND ${XpEventsTable.robotKey} = ${robotKey}` as any)
      const robotTotal = Number(xpSumRes?.rows?.[0]?.total || 0)
      const countRes: any = await tx.execute(dsql`SELECT COUNT(*)::int AS count FROM ${ProgressTable} WHERE ${ProgressTable.studentId} = ${studentId} AND ${ProgressTable.robotKey} = ${robotKey} AND ${ProgressTable.status} = 'done'` as any)
      const itemsDone = Number(countRes?.rows?.[0]?.count || 0)
      // derive mastery tier from thresholds
      let masteryTier = 0
      for (let i = 0; i < rules.mastery.tiers.length; i++) {
        if (itemsDone >= rules.mastery.tiers[i].thresholdItems) masteryTier = i + 1
      }
      await tx.insert(StudentRobotStatsTable).values({ studentId, robotKey, robotXpTotal: robotTotal, itemsDoneCount: itemsDone, levelsCompleteCount: 0, masteryTier })
        .onConflictDoUpdate({
          target: [StudentRobotStatsTable.studentId, StudentRobotStatsTable.robotKey],
          set: { robotXpTotal: robotTotal, itemsDoneCount: itemsDone, masteryTier }
        })

      // Recompute global student stats from remaining events
      const totalRes: any = await tx.execute(dsql`SELECT COALESCE(SUM(${XpEventsTable.delta}), 0)::int AS total FROM ${XpEventsTable} WHERE ${XpEventsTable.studentId} = ${studentId}` as any)
      const total = Number(totalRes?.rows?.[0]?.total || 0)
      const curve = getRules().levelCurve
      const { level, xpInLevel } = levelFromTotalXP(total, curve)
      await tx.insert(StudentXpStatsTable).values({ studentId, totalXp: total, level, xpInLevel })
        .onConflictDoUpdate({ target: [StudentXpStatsTable.studentId], set: { totalXp: total, level, xpInLevel } })
    })

    return NextResponse.json({ ok: true, reset: { robotKey, upToLevelIndex } })
  }

  if (action === 'reset_xp') {
    const scope = (body?.scope || 'student').toString() as 'student' | 'robot'
    const robotKey = (body?.robotKey || '').toString()
    await db.transaction(async (tx) => {
      if (scope === 'robot') {
        if (!robotKey) throw new Error('robotKey required for robot scope')
        await tx.delete(XpEventsTable).where(and(eq(XpEventsTable.studentId, studentId), eq(XpEventsTable.robotKey, robotKey)))
        await tx.insert(StudentRobotStatsTable).values({ studentId, robotKey, robotXpTotal: 0, itemsDoneCount: dsql`${StudentRobotStatsTable.itemsDoneCount}`, levelsCompleteCount: 0, masteryTier: 0 })
          .onConflictDoUpdate({ target: [StudentRobotStatsTable.studentId, StudentRobotStatsTable.robotKey], set: { robotXpTotal: 0, masteryTier: 0 } })
      } else {
        await tx.delete(XpEventsTable).where(eq(XpEventsTable.studentId, studentId))
        await tx.delete(StudentRobotStatsTable).where(eq(StudentRobotStatsTable.studentId, studentId))
      }
      // Recompute global stats
      const totalRes: any = await tx.execute(dsql`SELECT COALESCE(SUM(${XpEventsTable.delta}), 0)::int AS total FROM ${XpEventsTable} WHERE ${XpEventsTable.studentId} = ${studentId}` as any)
      const total = Number(totalRes?.rows?.[0]?.total || 0)
      const curve = getRules().levelCurve
      const { level, xpInLevel } = levelFromTotalXP(total, curve)
      await tx.insert(StudentXpStatsTable).values({ studentId, totalXp: total, level, xpInLevel })
        .onConflictDoUpdate({ target: [StudentXpStatsTable.studentId], set: { totalXp: total, level, xpInLevel } })
    })
    return NextResponse.json({ ok: true, reset: { scope, robotKey: robotKey || undefined } })
  }

  return NextResponse.json({ ok: false, error: 'invalid action' }, { status: 400 })
}
