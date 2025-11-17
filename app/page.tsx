import { Header } from '@/components/header'
import { ChecklistView } from '@/components/checklist-view'
import { getRobots } from '@/lib/robots'
import { loadChecklist } from '@/lib/checklist-loader'
import { getStudents } from '@/lib/students'
import { getLevelLocks, filterUnlockedLevels } from '@/lib/level-locks'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const selectedRobot = cookieStore.get('robot_key')?.value || 'rvr_plus'
  const selectedStudent = cookieStore.get('student_id')?.value || ''

  const robots = await getRobots()
  const students = await getStudents()
  let checklist = selectedStudent ? await loadChecklist(selectedRobot) : null
  
  // Filter levels based on locks
  if (checklist) {
    const locks = await getLevelLocks(selectedRobot)
    checklist = {
      ...checklist,
      levels: filterUnlockedLevels(checklist.levels, locks)
    }
  }

  return (
    <main className="min-h-screen">
      <Header robots={robots} students={students} selectedRobot={selectedRobot} selectedStudent={selectedStudent} />
      <div className="mx-auto max-w-5xl p-4">
        {selectedStudent ? (
          <ChecklistView robotKey={selectedRobot} studentId={selectedStudent} checklist={checklist!} />
        ) : (
          <div className="card p-5 text-sm text-neutral-300">
            Bitte oben einen Schüler auswählen, um die Inhalte zu sehen.
          </div>
        )}
      </div>
    </main>
  )
}
