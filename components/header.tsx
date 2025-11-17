"use client"
import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SearchableSelect } from './searchable-select'
import { LevelPill } from './xp/level-pill'

type Robot = { key: string; name: string }
type Student = { id: string; displayName: string; course?: string }

export function Header({ robots, students, selectedRobot, selectedStudent }: { robots: Robot[]; students: Student[]; selectedRobot: string; selectedStudent: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function updateSelection(type: 'robot' | 'student', value: string) {
    startTransition(async () => {
      await fetch('/api/selection', { method: 'POST', body: JSON.stringify({ type, value }) })
      router.refresh()
    })
  }

  const studentOptions = useMemo(
    () => students.map(s => ({ value: s.id, label: s.course ? `${s.displayName} (Kurs: ${s.course})` : s.displayName, course: s.course })),
    [students]
  )

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 p-3">
        <div className="font-semibold text-brand-300">Robotik</div>
        <div className="ml-auto flex items-center gap-2">
          <SearchableSelect
            options={studentOptions}
            value={selectedStudent}
            placeholder="Schüler wählen…"
            onChange={(v) => updateSelection('student', v)}
          />
          {selectedStudent ? (
            <LevelPill studentId={selectedStudent} robotKey={selectedRobot} />
          ) : null}
          <select className="select" value={selectedRobot} onChange={(e) => updateSelection('robot', e.target.value)}>
            {robots.map((r) => (
              <option key={r.key} value={r.key}>{r.name}</option>
            ))}
          </select>
          <a className="btn" href="/admin">Admin</a>
        </div>
      </div>
      {isPending ? <div className="h-1 bg-brand-500 animate-pulse" /> : null}
    </header>
  )
}
