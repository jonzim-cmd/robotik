import { and, eq, inArray, sql as dsql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { ProgressTable } from '@/lib/schema'
import { loadChecklist } from '@/lib/checklist-loader'
import { BadgesAwardedTable, StudentRobotStatsTable, StudentXpStatsTable, XpEventsTable } from '../storage/schema'
import { getRules, levelFromTotalXP } from './rules'

type Status = 'todo' | 'in_progress' | 'done'

export async function onProgressDelta(robotKey: string, studentId: string, delta: Record<string, { prev?: Status; next: Status; payload?: any }>) {
  const db = await getDb()
  const rules = getRules(robotKey)
  const checklist = await loadChecklist(robotKey).catch(() => null as any)
  const itemToLevel = new Map<string, string>()
  if (checklist?.levels) {
    for (const lvl of checklist.levels) for (const it of lvl.items) itemToLevel.set(it.key, lvl.key)
  }

  const doneKeys = Object.entries(delta).filter(([, v]) => v.prev !== 'done' && v.next === 'done').map(([k]) => k)
  if (doneKeys.length === 0) return

  // Preload current robot stats
  const [robotStats] = await db.select().from(StudentRobotStatsTable).where(and(eq(StudentRobotStatsTable.studentId, studentId), eq(StudentRobotStatsTable.robotKey, robotKey)))
  let robotXpAcc = 0

  await db.transaction(async (tx) => {
    // Base XP for each item completed
    for (const itemKey of doneKeys) {
      const levelKey = itemToLevel.get(itemKey)
      const res = await tx.insert(XpEventsTable).values({
        studentId, robotKey, levelKey, itemKey, type: 'item_complete', delta: rules.baseItemXP,
      }).onConflictDoNothing().returning({ id: XpEventsTable.id })
      if (res.length) robotXpAcc += rules.baseItemXP
    }

    // Level completion checks for affected levels
    const affectedLevels = Array.from(new Set(doneKeys.map(k => itemToLevel.get(k)).filter(Boolean))) as string[]
    if (affectedLevels.length) {
      for (const lvlKey of affectedLevels) {
        // get all items in level
        const level = checklist?.levels?.find((l: any) => l.key === lvlKey)
        const allKeys: string[] = level?.items?.map((it: any) => it.key) || []
        if (allKeys.length === 0) continue
        const rows = await tx.select({ status: ProgressTable.status }).from(ProgressTable)
          .where(and(eq(ProgressTable.robotKey, robotKey), eq(ProgressTable.studentId, studentId), inArray(ProgressTable.itemKey, allKeys)))
        const allDone = rows.length === allKeys.length && rows.every(r => r.status === 'done')
        if (allDone) {
          const ins = await tx.insert(XpEventsTable).values({ studentId, robotKey, levelKey: lvlKey, type: 'level_complete', delta: rules.levelCompleteXP })
            .onConflictDoNothing().returning({ id: XpEventsTable.id })
          if (ins.length) robotXpAcc += rules.levelCompleteXP
        }
      }
    }

    // Update robot-level counters and grant mastery tiers if thresholds crossed
    // Recount items done for this robot (robust for vercel-postgres driver shape)
    const res: any = await tx.execute(
      dsql`SELECT COUNT(*)::int AS count FROM ${ProgressTable} WHERE ${ProgressTable.robotKey} = ${robotKey} AND ${ProgressTable.studentId} = ${studentId} AND ${ProgressTable.status} = 'done'` as any
    )
    const itemsDone = Number((res?.rows?.[0]?.count) ?? 0)

    // Ensure robot stats row exists and update robot XP and items count
    // Ensure robot stats row exists and increment XP correctly on both insert and update
    await tx.insert(StudentRobotStatsTable).values({
      studentId,
      robotKey,
      // On first insert, include the newly earned XP
      robotXpTotal: (robotStats?.robotXpTotal || 0) + robotXpAcc,
      itemsDoneCount: itemsDone,
      levelsCompleteCount: robotStats?.levelsCompleteCount || 0,
      masteryTier: robotStats?.masteryTier || 0,
    }).onConflictDoUpdate({
      target: [StudentRobotStatsTable.studentId, StudentRobotStatsTable.robotKey],
      set: {
        robotXpTotal: dsql`${StudentRobotStatsTable.robotXpTotal} + ${robotXpAcc}`,
        itemsDoneCount: itemsDone,
      },
    })

    // Grant mastery tiers
    let currentTier = robotStats?.masteryTier || 0
    for (let i = 0; i < rules.mastery.tiers.length; i++) {
      const tierNum = i + 1
      const t = rules.mastery.tiers[i]
      if (itemsDone >= t.thresholdItems && tierNum > currentTier) {
        const ins = await tx.insert(XpEventsTable).values({ studentId, robotKey, type: 'mastery_tier', delta: t.bonusXP, tier: tierNum })
          .onConflictDoNothing().returning({ id: XpEventsTable.id })
        if (ins.length) {
          robotXpAcc += t.bonusXP
          currentTier = tierNum
          await tx.update(StudentRobotStatsTable).set({ masteryTier: currentTier, robotXpTotal: dsql`${StudentRobotStatsTable.robotXpTotal} + ${t.bonusXP}` })
            .where(and(eq(StudentRobotStatsTable.studentId, studentId), eq(StudentRobotStatsTable.robotKey, robotKey)))
        }
      }
    }

    // Update global student stats
    const [statsRow] = await tx.select().from(StudentXpStatsTable).where(eq(StudentXpStatsTable.studentId, studentId))
    const total = (statsRow?.totalXp || 0) + robotXpAcc
    const curve = rules.levelCurve
    const { level, xpInLevel } = levelFromTotalXP(total, curve)
    await tx.insert(StudentXpStatsTable).values({ studentId, totalXp: total, level, xpInLevel, lastEventAt: new Date() })
      .onConflictDoUpdate({
        target: [StudentXpStatsTable.studentId],
        set: { totalXp: total, level, xpInLevel, lastEventAt: new Date() },
      })
  })
}
