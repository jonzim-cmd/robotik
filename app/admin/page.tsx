import { AdminPanel } from '@/components/admin-panel'
import { Header } from '@/components/header'
import { getRobots } from '@/lib/robots'
import { getStudents } from '@/lib/students'
import { cookies } from 'next/headers'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const selectedRobot = cookieStore.get('robot_key')?.value || 'rvr_plus'
  const selectedStudent = cookieStore.get('student_id')?.value || ''
  const robots = await getRobots()
  const students = await getStudents()
  return (
    <main className="min-h-screen">
      <Header robots={robots} students={students} selectedRobot={selectedRobot} selectedStudent={selectedStudent} />
      <div className="mx-auto max-w-5xl p-4">
        <AdminPanel />
      </div>
    </main>
  )
}
