import { AdminPanel } from '@/components/admin-panel'
// Admin page uses its own header with tabs, not the main header

export default async function AdminPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl p-4">
        <AdminPanel />
      </div>
    </main>
  )
}
