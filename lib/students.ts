import { getDb } from './db'
import { StudentsTable } from './schema'
import { desc } from 'drizzle-orm'

export type Student = { id: string; displayName: string; course?: string }

export async function getStudents(): Promise<Student[]> {
  try {
    const db = await getDb()
    const rows = await db.select().from(StudentsTable).orderBy(desc(StudentsTable.createdAt))
    return rows.map(r => ({ id: r.id, displayName: r.displayName, course: (r as any).course || undefined }))
  } catch {
    return []
  }
}
