export type XPEventType =
  | 'item_complete'
  | 'level_complete'
  | 'mastery_tier'
  | 'teacher_award'
  | 'reflection_bonus'

export type XPRobotKey = string
export type LevelKey = string
export type ItemKey = string

export type XPEvent = {
  studentId: string
  robotKey: XPRobotKey
  levelKey?: LevelKey
  itemKey?: ItemKey
  type: XPEventType
  delta: number
  tier?: number
  meta?: Record<string, any>
  occurredAt?: Date
}

export type XPRules = {
  baseItemXP: number
  levelCompleteXP: number
  difficultyBonus?: Record<'easy' | 'medium' | 'hard', number>
  reflection?: { enabled: boolean; minLength: number; bonusXP: number }
  mastery: { tiers: Array<{ thresholdItems: number; bonusXP: number; badgeKey: string }> }
  levelCurve: number[] // cumulative XP thresholds; e.g., [0, 50, 120, ...]
}

export type XPStudentStats = {
  totalXP: number
  level: number
  xpInLevel: number
}

export type XPRobotStats = {
  robotXP: number
  itemsDone: number
  levelsComplete: number
  masteryTier: number
}

export type XPStatsResponse = {
  student: XPStudentStats
  robots: Record<string, XPRobotStats>
}

