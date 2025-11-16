import { AdminPanel } from '@/components/admin-panel'

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Admin</h1>
      <AdminPanel />
    </div>
  )
}

