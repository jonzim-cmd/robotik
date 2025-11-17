import { pgTable, text, integer, timestamp, primaryKey, bigserial } from 'drizzle-orm/pg-core'

export const XpEventsTable = pgTable('xp_events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  studentId: text('student_id').notNull(),
  robotKey: text('robot_key').notNull(),
  levelKey: text('level_key'),
  itemKey: text('item_key'),
  type: text('type').notNull(),
  delta: integer('delta').notNull(),
  tier: integer('tier'),
  meta: text('meta'),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
})

export const StudentXpStatsTable = pgTable('student_xp_stats', {
  studentId: text('student_id').primaryKey(),
  totalXp: integer('total_xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  xpInLevel: integer('xp_in_level').notNull().default(0),
  lastEventAt: timestamp('last_event_at'),
})

export const StudentRobotStatsTable = pgTable('student_robot_stats', {
  studentId: text('student_id').notNull(),
  robotKey: text('robot_key').notNull(),
  robotXpTotal: integer('robot_xp_total').notNull().default(0),
  itemsDoneCount: integer('items_done_count').notNull().default(0),
  levelsCompleteCount: integer('levels_complete_count').notNull().default(0),
  masteryTier: integer('mastery_tier').notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.studentId, t.robotKey] }),
}))

export const BadgesAwardedTable = pgTable('badges_awarded', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  studentId: text('student_id').notNull(),
  badgeKey: text('badge_key').notNull(),
  robotKey: text('robot_key'),
  awardedAt: timestamp('awarded_at').defaultNow().notNull(),
})

