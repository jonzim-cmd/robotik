import { Header } from '@/components/header'
import { ChecklistView } from '@/components/checklist-view'
import { getRobots } from '@/lib/robots'
import { loadChecklist } from '@/lib/checklist-loader'
import { getStudents } from '@/lib/students'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const selectedRobot = cookieStore.get('robot_key')?.value || 'rvr_plus'
  const selectedStudent = cookieStore.get('student_id')?.value || ''

  const robots = await getRobots()
  const students = await getStudents()
  const checklist = await loadChecklist(selectedRobot)

  return (
    <main className="min-h-screen">
      <Header robots={robots} students={students} selectedRobot={selectedRobot} selectedStudent={selectedStudent} />
      <div className="mx-auto max-w-5xl p-4">
        <ChecklistView robotKey={selectedRobot} studentId={selectedStudent} checklist={checklist} />
      </div>
    </main>
  )
}

