"use client"
import { useEffect, useState } from 'react'

type Props = { studentId: string; robotKey: string; className?: string }

type StatsResp = {
  ok: boolean
  stats?: {
    student: { totalXP: number; level: number; xpInLevel: number; nextLevelXP?: number }
    robots: Record<string, { robotXP: number; itemsDone: number; levelsComplete: number; masteryTier: number }>
  }
}

export function LevelPill({ studentId, robotKey, className = '' }: Props) {
  const [level, setLevel] = useState<number | null>(null)
  const [xpInLevel, setXpInLevel] = useState<number>(0)
  const [robotTier, setRobotTier] = useState<number>(0)
  const [nextLevelXP, setNextLevelXP] = useState<number>(0)
  const [prevTotalXp, setPrevTotalXp] = useState<number>(0)
  const [floaters, setFloaters] = useState<Array<{ id: number; drift: number }>>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!studentId) return
      try {
        const res = await fetch(`/api/xp/stats?student=${encodeURIComponent(studentId)}`)
        const j: StatsResp = await res.json()
        if (!cancelled && j.ok && j.stats) {
          // Detect XP gains to trigger floater animation
          setLevel(j.stats.student.level)
          const newXpInLevel = j.stats.student.xpInLevel
          const newTotal = j.stats.student.totalXP
          setXpInLevel(newXpInLevel)
          if (newTotal > prevTotalXp) {
            const delta = newTotal - prevTotalXp
            const count = Math.max(1, Math.min(3, Math.round(delta / 10)))
            const now = Date.now()
            const items = Array.from({ length: count }, (_, i) => ({ id: now + i, drift: (Math.random() - 0.5) * 14 }))
            setFloaters((cur) => [...cur, ...items])
            // Cleanup after animation
            setTimeout(() => {
              setFloaters((cur) => cur.filter(f => !items.find(it => it.id === f.id)))
            }, 950)
          }
          setPrevTotalXp(newTotal)
          setNextLevelXP(j.stats.student.nextLevelXP || 0)
          const r = j.stats.robots[robotKey]
          setRobotTier(r?.masteryTier || 0)
        }
      } catch {}
    }
    load()
    const onUpdated = () => load()
    window.addEventListener('xp:updated', onUpdated as any)
    return () => {
      cancelled = true
      window.removeEventListener('xp:updated', onUpdated as any)
    }
  }, [studentId, robotKey])

  if (!studentId || level == null) return null
  return (
    <div className={`relative flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 text-xs text-neutral-200 ${className}`}>
      <span className="font-semibold">Lv {level}</span>
      <span className="text-neutral-400">•</span>
      <span>{xpInLevel}{nextLevelXP ? `/${nextLevelXP}` : ''} XP</span>
      {robotTier > 0 && (
        <span className="ml-1 rounded bg-brand-950/30 text-brand-200 border border-brand-700/30 px-2 py-0.5">T{robotTier}</span>
      )}
      {/* XP gain floaters */}
      <div className="pointer-events-none absolute inset-0 overflow-visible">
        {floaters.map(f => (
          <span
            key={f.id}
            className="xp-floater absolute right-1 top-1 select-none"
            style={{ ['--drift' as any]: `${f.drift}px` }}
          >
            🧠
          </span>
        ))}
      </div>
    </div>
  )
}
