"use client"
import { useEffect, useMemo, useState } from 'react'
import { Markdown, MarkdownInline } from '@/lib/markdown'
import { stripMarkdown } from '@/lib/text'
import type { Checklist } from '@/lib/checklist-loader'
import { useProgressQueue } from './hooks/use-progress-queue'
import { getRules } from '@/lib/xp/services/rules'

type Props = { robotKey: string; studentId: string; checklist: Checklist }

type ProgressEntry = { status: 'done' | 'todo' | 'in_progress'; payload?: any }
type ProgressMap = Record<string, ProgressEntry>

export function ChecklistView({ robotKey, studentId, checklist }: Props) {
  const [tab, setTab] = useState(0)
  const [progress, setProgress] = useState<ProgressMap>({})
  const [textValues, setTextValues] = useState<Record<string, string>>({})
  const { isSaving, queue } = useProgressQueue(robotKey, studentId)
  const rules = useMemo(() => getRules(robotKey), [robotKey])

  // Map itemKey -> level info for quick lookups
  const itemToLevel = useMemo(() => {
    const map = new Map<string, { levelIdx: number; levelKey: string; total: number }>()
    checklist.levels.forEach((lvl, idx) => {
      lvl.items.forEach(it => map.set(it.key, { levelIdx: idx, levelKey: lvl.key, total: lvl.items.length }))
    })
    return map
  }, [checklist.levels])

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

    // Optimistic XP: only for positive transitions
    let optimisticDelta = 0
    if ((prev?.status !== 'done') && currentStatus === 'done') {
      // Base XP
      optimisticDelta += rules.baseItemXP
      // Level completion bonus
      const lvlInfo = itemToLevel.get(itemKey)
      if (lvlInfo) {
        const lvl = checklist.levels[lvlInfo.levelIdx]
        const doneAfter = lvl.items.filter(it => (next[it.key]?.status === 'done')).length
        if (doneAfter === lvlInfo.total) optimisticDelta += rules.levelCompleteXP
      }
      // Mastery tier bonuses if thresholds crossed
      const prevDone = Object.values(progress).filter(p => p.status === 'done').length
      const nextDone = Object.values(next).filter(p => p.status === 'done').length
      for (let i = 0; i < rules.mastery.tiers.length; i++) {
        const t = rules.mastery.tiers[i]
        if (prevDone < t.thresholdItems && nextDone >= t.thresholdItems) {
          optimisticDelta += t.bonusXP
        }
      }
    }
    if (optimisticDelta > 0) {
      try { window.dispatchEvent(new CustomEvent('xp:optimistic', { detail: { studentId, robotKey, delta: optimisticDelta } })) } catch {}
    }
    queue({ [itemKey]: entry })
  }

  function saveText(itemKey: string, text: string) {
    const status: 'done' | 'todo' = text.trim() ? 'done' : 'todo'
    const next: ProgressMap = { ...progress, [itemKey]: { status, payload: { text } } }
    setProgress(next)
    setTextValues({ ...textValues, [itemKey]: text })
    if (!studentId) return
    // Optimistic XP for text items when transitioning to done
    if ((progress[itemKey]?.status !== 'done') && status === 'done') {
      let optimisticDelta = rules.baseItemXP
      const lvlInfo = itemToLevel.get(itemKey)
      if (lvlInfo) {
        const lvl = checklist.levels[lvlInfo.levelIdx]
        const doneAfter = lvl.items.filter(it => (next[it.key]?.status === 'done')).length
        if (doneAfter === lvlInfo.total) optimisticDelta += rules.levelCompleteXP
      }
      const prevDone = Object.values(progress).filter(p => p.status === 'done').length
      const nextDone = Object.values(next).filter(p => p.status === 'done').length
      for (let i = 0; i < rules.mastery.tiers.length; i++) {
        const t = rules.mastery.tiers[i]
        if (prevDone < t.thresholdItems && nextDone >= t.thresholdItems) {
          optimisticDelta += t.bonusXP
        }
      }
      if (optimisticDelta > 0) {
        try { window.dispatchEvent(new CustomEvent('xp:optimistic', { detail: { studentId, robotKey, delta: optimisticDelta } })) } catch {}
      }
    }
    queue({ [itemKey]: { status, payload: { text } } as any })
  }

  const levelStats = useMemo(() => {
    return checklist.levels.map(lvl => {
      const total = lvl.items.length
      const done = lvl.items.filter(it => progress[it.key]?.status === 'done').length
      return { total, done, pct: total ? Math.round(done * 100 / total) : 0 }
    })
  }, [checklist.levels, progress])

  return (
    <div className="space-y-5">
      {/* Level Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {checklist.levels.map((lvl, idx) => (
          <button
            key={lvl.key}
            className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-medium transition-all ${
              tab === idx 
                ? 'border-brand-500 bg-brand-600/20 text-brand-100 shadow-sm shadow-brand-500/20' 
                : 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
            }`}
            onClick={() => setTab(idx)}
          >
            <span className="font-semibold">Level {lvl.num ?? (idx + 1)}</span>
            <span className="ml-2 hidden sm:inline text-neutral-400">{lvl.title}</span>
            <span className="ml-2.5 rounded-full bg-neutral-900/80 px-2.5 py-1 text-xs font-medium text-neutral-300">
              {levelStats[idx]?.done}/{levelStats[idx]?.total}
            </span>
          </button>
        ))}
      </div>

      {/* Level Content */}
      <div className="card p-6 lg:p-8">
        {/* Warning Banner */}
        {!studentId ? (
          <div className="mb-5 rounded-lg border border-yellow-700/50 bg-yellow-950/30 p-4 text-sm text-yellow-100 flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="font-semibold mb-0.5">Kein Schüler ausgewählt</div>
              <div className="text-yellow-200/90">Bitte wähle oben einen Schüler aus, um den Fortschritt zu speichern.</div>
            </div>
          </div>
        ) : null}

        {/* Level Header */}
        <div className="mb-5">
          <div className="mb-1.5 text-xs uppercase tracking-wider text-neutral-400 font-semibold">
            {checklist.title}
          </div>
          <h2 className="text-2xl font-bold text-neutral-50 mb-3">
            {checklist.levels[tab]?.title}
          </h2>
          {checklist.levels[tab]?.intro ? (
            <div className="text-neutral-200 bg-neutral-900/50 rounded-lg p-4 border border-neutral-800">
              <Markdown text={checklist.levels[tab]!.intro!} />
            </div>
          ) : null}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-neutral-300">Fortschritt</span>
            <span className="text-sm font-semibold text-neutral-200">
              {levelStats[tab]?.pct ?? 0}%
            </span>
          </div>
          <div className="progress h-2.5">
            <span 
              style={{ width: `${levelStats[tab]?.pct ?? 0}%` }} 
              className="transition-all duration-500 ease-out"
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-4">
          {checklist.levels[tab]?.items.map((item) => (
            <div 
              key={item.key} 
              className={`rounded-lg border transition-all ${
                progress[item.key]?.status === 'done'
                  ? 'border-brand-600/40 bg-brand-950/20'
                  : 'border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/60'
              }`}
            >
              {item.type !== 'text' ? (
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-0.5">
                      <input
                        aria-label={`Abhaken: ${stripMarkdown(item.label)}`}
                        type="checkbox"
                        className="h-5 w-5 cursor-pointer accent-brand-500 rounded transition-transform hover:scale-110"
                        checked={progress[item.key]?.status === 'done'}
                        onChange={() => toggleItem(item.key)}
                        disabled={!studentId}
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Label */}
                      <div className={`text-[15px] font-semibold leading-snug mb-2 ${
                        progress[item.key]?.status === 'done' 
                          ? 'text-neutral-100' 
                          : 'text-neutral-50'
                      }`}>
                        <MarkdownInline text={item.label} />
                      </div>
                      
                      {/* Description */}
                      {item.description ? (
                        <div className="mt-3 pt-3 border-t border-neutral-800/60">
                          <Markdown text={item.description} />
                        </div>
                      ) : null}
                      
                      {/* Note Input */}
                      {('noteLabel' in item) && (item as any).noteLabel ? (
                        <div className="mt-4 pt-4 border-t border-neutral-800/60">
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            <MarkdownInline text={(item as any).noteLabel} />
                          </label>
                          <textarea
                            className="textarea mt-2 min-h-[100px] w-full"
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
                </div>
              ) : (
                <div className="p-5">
                  <label className="block text-[15px] font-semibold text-neutral-50 mb-3">
                    <MarkdownInline text={item.label} />
                  </label>
                  <textarea
                    className="textarea min-h-[100px] w-full"
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

        {/* Save Status */}
        <div className="mt-5 pt-4 border-t border-neutral-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            {isSaving ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Wird gespeichert…</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Alle Änderungen gespeichert</span>
              </>
            )}
          </div>
          <div className="text-xs text-neutral-500">
            {levelStats[tab]?.done} von {levelStats[tab]?.total} abgeschlossen
          </div>
        </div>
      </div>
    </div>
  )
}
