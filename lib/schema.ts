import { pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core'

export const StudentsTable = pgTable('students', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const ProgressTable = pgTable(
  'progress',
  {
    studentId: text('student_id').notNull(),
    robotKey: text('robot_key').notNull(),
    itemKey: text('item_key').notNull(),
    status: text('status', { enum: ['done', 'todo', 'in_progress'] }).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.studentId, t.robotKey, t.itemKey] }),
  })
)

