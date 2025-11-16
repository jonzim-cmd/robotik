"use client"
import { useEffect, useMemo, useState, useTransition } from 'react'

export type Checklist = {
  robot: string
  title: string
  levels: { key: string; title: string; items: { key: string; label: string; description?: string }[] }[]
}

type Props = { robotKey: string; studentId: string; checklist: Checklist }

type ProgressMap = Record<string, 'done' | 'todo' | 'in_progress'>

export function ChecklistView({ robotKey, studentId, checklist }: Props) {
  const [tab, setTab] = useState(0)
  const [isSaving, startTransition] = useTransition()
  const [progress, setProgress] = useState<ProgressMap>({})

  // load initial progress
  useEffect(() => {
    let active = true
    async function load() {
      const res = await fetch(`/api/progress?robot=${robotKey}&student=${studentId}`)
      const data = await res.json()
      if (!active) return
      setProgress((data.progress || {}) as ProgressMap)
    }
    if (studentId) load()
    else {
      const k = `local:${robotKey}:${'anon'}`
      const raw = typeof window !== 'undefined' ? localStorage.getItem(k) : null
      setProgress((raw ? JSON.parse(raw) : {}) as ProgressMap)
    }
    return () => { active = false }
  }, [robotKey, studentId])

  function toggleItem(itemKey: string) {
    const current: 'done' | 'todo' | 'in_progress' = progress[itemKey] === 'done' ? 'todo' : 'done'
    const next: ProgressMap = { ...(progress as ProgressMap), [itemKey]: current }
    setProgress(next as ProgressMap)
    if (!studentId) {
      // local fallback
      const k = `local:${robotKey}:${'anon'}`
      localStorage.setItem(k, JSON.stringify(next))
      return
    }
    startTransition(async () => {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robot: robotKey, student: studentId, delta: { [itemKey]: current } })
      })
    })
  }

  const levelStats = useMemo(() => {
    return checklist.levels.map(lvl => {
      const total = lvl.items.length
      const done = lvl.items.filter(it => progress[it.key] === 'done').length
      return { total, done, pct: total ? Math.round(done * 100 / total) : 0 }
    })
  }, [checklist.levels, progress])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {checklist.levels.map((lvl, idx) => (
          <button key={lvl.key} className={`btn ${tab === idx ? 'bg-brand-700' : ''}`} onClick={() => setTab(idx)}>
            <span className="font-medium">{lvl.title}</span>
            <span className="text-xs text-neutral-300">{levelStats[idx]?.done}/{levelStats[idx]?.total}</span>
          </button>
        ))}
      </div>

      <div className="card p-4">
        <div className="mb-3 text-sm text-neutral-300">{checklist.title}</div>
        <div className="progress mb-4"><span style={{ width: `${levelStats[tab]?.pct ?? 0}%` }} /></div>
        <ul className="space-y-2">
          {checklist.levels[tab]?.items.map((item) => (
            <li key={item.key} className="flex items-start gap-3 rounded-md border border-neutral-800 bg-neutral-900/60 p-3">
              <input
                type="checkbox"
                className="h-5 w-5 cursor-pointer accent-brand-500"
                checked={progress[item.key] === 'done'}
                onChange={() => toggleItem(item.key)}
              />
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                {item.description ? <div className="text-sm text-neutral-300">{item.description}</div> : null}
              </div>
            </li>
          ))}
        </ul>
        {isSaving ? <div className="mt-2 text-xs text-neutral-400">Speichern…</div> : <div className="mt-2 text-xs text-neutral-500">Alles gespeichert</div>}
      </div>
    </div>
  )
}
