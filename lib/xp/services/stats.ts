import { and, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { StudentRobotStatsTable, StudentXpStatsTable } from '../storage/schema'
import type { XPStatsResponse } from '../types'
import { getRules, levelFromTotalXP } from './rules'

export async function getStats(studentId: string): Promise<XPStatsResponse> {
  const db = await getDb()
  const [studentRow] = await db.select().from(StudentXpStatsTable).where(eq(StudentXpStatsTable.studentId, studentId))
  const robotRows = await db.select().from(StudentRobotStatsTable).where(eq(StudentRobotStatsTable.studentId, studentId))

  const rules = getRules()
  const total = studentRow?.totalXp || 0
  const { level, xpInLevel, nextLevelXP } = levelFromTotalXP(total, rules.levelCurve)
  const robots = Object.fromEntries(robotRows.map(r => [r.robotKey, {
    robotXP: r.robotXpTotal || 0,
    itemsDone: r.itemsDoneCount || 0,
    levelsComplete: r.levelsCompleteCount || 0,
    masteryTier: r.masteryTier || 0,
  }]))
  return { student: { totalXP: total, level, xpInLevel: Math.max(0, xpInLevel), nextLevelXP }, robots } as any
}

export async function getRobotStats(studentId: string, robotKey: string) {
  const db = await getDb()
  const [r] = await db.select().from(StudentRobotStatsTable).where(and(eq(StudentRobotStatsTable.studentId, studentId), eq(StudentRobotStatsTable.robotKey, robotKey)))
  return r || null
}
