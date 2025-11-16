"use client"
import { useEffect, useMemo, useState, useTransition } from 'react'
import { Markdown } from '@/lib/markdown'
import { stripMarkdown } from '@/lib/text'
import type { Checklist } from '@/lib/checklist-loader'

type Props = { robotKey: string; studentId: string; checklist: Checklist }

type ProgressEntry = { status: 'done' | 'todo' | 'in_progress'; payload?: any }
type ProgressMap = Record<string, ProgressEntry>

export function ChecklistView({ robotKey, studentId, checklist }: Props) {
  const [tab, setTab] = useState(0)
  const [isSaving, startTransition] = useTransition()
  const [progress, setProgress] = useState<ProgressMap>({})
  const [textValues, setTextValues] = useState<Record<string, string>>({})

  // load initial progress (DB only)
  useEffect(() => {
    let active = true
    async function load() {
      const res = await fetch(`/api/progress?robot=${robotKey}&student=${studentId}`)
      const data = await res.json()
      if (!active) return
      const map = (data.progress || {}) as Record<string, any>
      const normalized: ProgressMap = {}
      const texts: Record<string, string> = {}
      for (const [k, v] of Object.entries(map)) {
        if (typeof v === 'string') {
          normalized[k] = { status: v as any }
        } else {
          const pe = v as ProgressEntry
          normalized[k] = { status: pe.status, payload: pe.payload }
          if (pe.payload && typeof pe.payload.text === 'string') {
            texts[k] = pe.payload.text
          }
        }
      }
      setProgress(normalized)
      setTextValues(texts)
    }
    if (studentId) load()
    return () => { active = false }
  }, [robotKey, studentId])

  function toggleItem(itemKey: string) {
    const prev = progress[itemKey]
    const currentStatus: 'done' | 'todo' | 'in_progress' = (prev?.status === 'done' ? 'todo' : 'done')
    const entry: ProgressEntry = { status: currentStatus }
    if (prev && prev.payload !== undefined) entry.payload = prev.payload
    const next: ProgressMap = { ...progress, [itemKey]: entry }
    setProgress(next as ProgressMap)
    if (!studentId) return
    startTransition(async () => {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robot: robotKey, student: studentId, delta: { [itemKey]: entry } })
      })
    })
  }

  function saveText(itemKey: string, text: string) {
    const status: 'done' | 'todo' = text.trim() ? 'done' : 'todo'
    const next: ProgressMap = { ...progress, [itemKey]: { status, payload: { text } } }
    setProgress(next)
    setTextValues({ ...textValues, [itemKey]: text })
    if (!studentId) return
    startTransition(async () => {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robot: robotKey, student: studentId, delta: { [itemKey]: { status, payload: { text } } } })
      })
    })
  }

  const levelStats = useMemo(() => {
    return checklist.levels.map(lvl => {
      const total = lvl.items.length
      const done = lvl.items.filter(it => progress[it.key]?.status === 'done').length
      return { total, done, pct: total ? Math.round(done * 100 / total) : 0 }
    })
  }, [checklist.levels, progress])

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {checklist.levels.map((lvl, idx) => (
          <button
            key={lvl.key}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors ${tab === idx ? 'border-brand-500 bg-brand-700/30 text-brand-100' : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800'}`}
            onClick={() => setTab(idx)}
          >
            <span className="font-medium">Level {lvl.num ?? (idx + 1)}</span>
            <span className="ml-2 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">{levelStats[idx]?.done}/{levelStats[idx]?.total}</span>
          </button>
        ))}
      </div>

      <div className="card p-5">
        {!studentId ? (
          <div className="mb-3 rounded-md border border-yellow-800/50 bg-yellow-950/30 p-3 text-sm text-yellow-200">
            Bitte wähle oben einen Schüler aus, um Fortschritt zu speichern.
          </div>
        ) : null}
        <div className="mb-1 text-xs uppercase tracking-wide text-neutral-400">{checklist.title}</div>
        <h2 className="mb-2 text-xl font-semibold">{checklist.levels[tab]?.title}</h2>
        {checklist.levels[tab]?.intro ? (
          <div className="mb-4"><Markdown text={checklist.levels[tab]!.intro!} /></div>
        ) : null}
        <div className="progress mb-4"><span style={{ width: `${levelStats[tab]?.pct ?? 0}%` }} /></div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {checklist.levels[tab]?.items.map((item) => (
            <div key={item.key} className="rounded-md border border-neutral-800 bg-neutral-900/60 p-3">
              {item.type !== 'text' ? (
                <div className="flex items-start gap-3">
                  <input
                    aria-label={`Abhaken: ${stripMarkdown(item.label)}`}
                    type="checkbox"
                    className="mt-0.5 h-5 w-5 cursor-pointer accent-brand-500"
                    checked={progress[item.key]?.status === 'done'}
                    onChange={() => toggleItem(item.key)}
                    disabled={!studentId}
                  />
                  <div className="flex-1">
                    <div className="font-medium leading-snug"><Markdown text={item.label} /></div>
                    {item.description ? <div className="mt-1"><Markdown text={item.description} /></div> : null}
                    {('noteLabel' in item) && (item as any).noteLabel ? (
                      <div className="mt-2">
                        <label className="text-sm text-neutral-300"><Markdown text={(item as any).noteLabel} /></label>
                        <textarea
                          className="textarea mt-2 min-h-[80px] w-full"
                          placeholder={stripMarkdown((item as any).noteLabel || 'Antwort hier eingeben…')}
                          value={textValues[item.key] || ''}
                          onChange={(e) => setTextValues({ ...textValues, [item.key]: e.target.value })}
                          onBlur={(e) => saveText(item.key, e.currentTarget.value)}
                          disabled={!studentId}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-neutral-300"><Markdown text={item.label} /></label>
                  <textarea
                    className="textarea min-h-[80px]"
                    placeholder="Antwort hier eingeben…"
                    value={textValues[item.key] || ''}
                    onChange={(e) => setTextValues({ ...textValues, [item.key]: e.target.value })}
                    onBlur={(e) => saveText(item.key, e.currentTarget.value)}
                    disabled={!studentId}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-neutral-500">{isSaving ? 'Speichern…' : 'Alles gespeichert'}</div>
      </div>
    </div>
  )
}
