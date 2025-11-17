import { pgTable, text, timestamp, primaryKey, boolean } from 'drizzle-orm/pg-core'

export const StudentsTable = pgTable('students', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  course: text('course'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const ProgressTable = pgTable(
  'progress',
  {
    studentId: text('student_id').notNull(),
    robotKey: text('robot_key').notNull(),
    itemKey: text('item_key').notNull(),
    status: text('status', { enum: ['done', 'todo', 'in_progress'] }).notNull(),
    payload: text('payload'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.studentId, t.robotKey, t.itemKey] }),
  })
)

export const LevelLocksTable = pgTable(
  'level_locks',
  {
    robotKey: text('robot_key').notNull(),
    course: text('course').notNull().default(''),
    levelKey: text('level_key').notNull(),
    unlocked: boolean('unlocked').notNull().default(false),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.robotKey, t.course, t.levelKey] }),
  })
)
