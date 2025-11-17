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

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!studentId) return
      try {
        const res = await fetch(`/api/xp/stats?student=${encodeURIComponent(studentId)}`)
        const j: StatsResp = await res.json()
        if (!cancelled && j.ok && j.stats) {
          setLevel(j.stats.student.level)
          setXpInLevel(j.stats.student.xpInLevel)
          setNextLevelXP(j.stats.student.nextLevelXP || 0)
          const r = j.stats.robots[robotKey]
          setRobotTier(r?.masteryTier || 0)
        }
      } catch {}
    }
    load()
    const onUpdated = () => load()
    window.addEventListener('xp:updated', onUpdated as any)
    return () => { cancelled = true }
  }, [studentId, robotKey])

  if (!studentId || level == null) return null
  return (
    <div className={`flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 text-xs text-neutral-200 ${className}`}>
      <span className="font-semibold">Lv {level}</span>
      <span className="text-neutral-400">•</span>
      <span>{xpInLevel}{nextLevelXP ? `/${nextLevelXP}` : ''} XP</span>
      {robotTier > 0 && (
        <span className="ml-1 rounded bg-brand-950/30 text-brand-200 border border-brand-700/30 px-2 py-0.5">T{robotTier}</span>
      )}
    </div>
  )
}
