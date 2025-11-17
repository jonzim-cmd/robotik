"use client"
import { useEffect, useRef, useState } from 'react'
import { getRules, levelFromTotalXP } from '@/lib/xp/services/rules'
import { xpLevelTitle } from '@/lib/xp/level-titles'

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
  const [totalXp, setTotalXp] = useState<number>(0)
  const [floaters, setFloaters] = useState<Array<{ id: number; drift: number }>>([])
  const rules = getRules(robotKey)
  const totalRef = useRef<number>(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!studentId) return
      try {
        const res = await fetch(`/api/xp/stats?student=${encodeURIComponent(studentId)}`)
        const j: StatsResp = await res.json()
        if (!cancelled && j.ok && j.stats) {
          // Detect XP gains to trigger floater animation
          const newTotal = j.stats.student.totalXP
          const { level: newLevel, xpInLevel: newXpInLevel, nextLevelXP: nextXP } = levelFromTotalXP(newTotal, rules.levelCurve)
          // Only apply server values if they don't regress total XP
          if (newTotal >= totalRef.current) {
            setLevel(newLevel)
            setXpInLevel(newXpInLevel)
            setTotalXp(newTotal)
            totalRef.current = newTotal
          }
          // Floaters only for positive gains over last known total
          if (newTotal > prevTotalXp) {
            const delta = Math.max(0, newTotal - prevTotalXp)
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
          setNextLevelXP(nextXP || 0)
          const r = j.stats.robots[robotKey]
          setRobotTier(r?.masteryTier || 0)
        }
      } catch {}
    }
    load()
    const onUpdated = () => load()
    const onOptimistic = (e: any) => {
      if (!e?.detail) return
      const { studentId: sid, robotKey: rk, delta } = e.detail
      if (sid !== studentId || rk !== robotKey || !delta) return
      const newTotal = (totalRef.current || 0) + delta
      const { level: newLevel, xpInLevel: newXpInLevel, nextLevelXP: nextXP } = levelFromTotalXP(newTotal, rules.levelCurve)
      setLevel(newLevel)
      setXpInLevel(newXpInLevel)
      setNextLevelXP(nextXP)
      setTotalXp(newTotal)
      totalRef.current = newTotal
      const count = Math.max(1, Math.min(3, Math.round(delta / 10)))
      const now = Date.now()
      const items = Array.from({ length: count }, (_, i) => ({ id: now + i, drift: (Math.random() - 0.5) * 14 }))
      setFloaters((cur) => [...cur, ...items])
      setTimeout(() => {
        setFloaters((cur) => cur.filter(f => !items.find(it => it.id === f.id)))
      }, 950)
    }
    window.addEventListener('xp:updated', onUpdated as any)
    window.addEventListener('xp:optimistic', onOptimistic as any)
    return () => {
      cancelled = true
      window.removeEventListener('xp:updated', onUpdated as any)
      window.removeEventListener('xp:optimistic', onOptimistic as any)
    }
  }, [studentId, robotKey])

  if (!studentId || level == null) return null
  return (
    <div className={`relative flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 text-xs text-neutral-200 ${className}`} title="Dein XP-Rang und Fortschritt">
      <span className="font-semibold">{xpLevelTitle(level)} <span className="text-neutral-400 font-normal">(L{level})</span></span>
      <span className="text-neutral-400">•</span>
      <span>{xpInLevel}{nextLevelXP ? `/${nextLevelXP}` : ''} XP</span>
      {/* Robot mastery tier intentionally not shown to reduce confusion */}
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
