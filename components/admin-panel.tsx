"use client"
import { useEffect, useState } from 'react'

type Student = { id: string; displayName: string }

export function AdminPanel() {
  const [students, setStudents] = useState<Student[]>([])
  const [name, setName] = useState('')
  const [info, setInfo] = useState('')
  const [dbReady, setDbReady] = useState(false)

  async function refresh() {
    const res = await fetch('/api/admin/students')
    const data = await res.json()
    setStudents(data.students || [])
  }

  useEffect(() => { refresh() }, [])

  async function addStudent() {
    if (!name.trim()) return
    const res = await fetch('/api/admin/students', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: name })
    })
    const r = await res.json()
    setInfo(r.ok ? 'Schüler angelegt' : r.error || 'Fehler')
    setName('')
    refresh()
  }

  async function initDb() {
    const res = await fetch('/api/admin/init', { method: 'POST' })
    const r = await res.json()
    setInfo(r.ok ? 'Datenbank initialisiert' : r.error || 'Fehler')
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="mb-2 font-medium">Setup</div>
        <button className="btn" onClick={initDb}>Datenbank initialisieren</button>
      </div>

      <div className="card p-4">
        <div className="mb-2 font-medium">Schüler anlegen</div>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Vorname Nachname" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn" onClick={addStudent}>Anlegen</button>
        </div>
        {info && <div className="mt-2 text-sm text-neutral-400">{info}</div>}
      </div>

      <div className="card p-4">
        <div className="mb-2 font-medium">Schüler</div>
        <ul className="space-y-1">
          {students.map(s => (
            <li key={s.id} className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900/60 p-2">
              <span>{s.displayName}</span>
              <span className="text-xs text-neutral-400">{s.id}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
