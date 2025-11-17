import { getDb } from './db'
import { LevelLocksTable } from './schema'
import { and, eq } from 'drizzle-orm'

export async function getLevelLocks(robotKey: string, course: string = ''): Promise<Record<string, boolean>> {
  try {
    const db = await getDb()
    const locks = await db
      .select()
      .from(LevelLocksTable)
      .where(and(eq(LevelLocksTable.robotKey, robotKey), eq(LevelLocksTable.course, course || '')))

    const locksMap: Record<string, boolean> = {}
    for (const lock of locks) {
      locksMap[lock.levelKey] = lock.unlocked
    }

    return locksMap
  } catch (error) {
    console.error('Error fetching level locks:', error)
    return {}
  }
}

export function filterUnlockedLevels<T extends { key: string }>(
  levels: T[],
  locks: Record<string, boolean>
): T[] {
  // Wenn keine Locks definiert sind, sind alle Levels freigeschaltet
  if (Object.keys(locks).length === 0) {
    return levels
  }
  
  return levels.filter(level => locks[level.key] === true)
}
