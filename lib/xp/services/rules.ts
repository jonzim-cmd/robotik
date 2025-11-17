import { getDefaultsForRobot } from '../config/defaults'
import type { XPRules } from '../types'

export function getRules(robotKey?: string): XPRules {
  return getDefaultsForRobot(robotKey)
}

export function levelFromTotalXP(total: number, curve: number[]): { level: number; xpInLevel: number; nextLevelXP: number } {
  // curve is cumulative thresholds for start of each level; e.g., [0, 50, 120, ...]
  let lvl = 1
  for (let i = 0; i < curve.length; i++) {
    if (total >= curve[i]) lvl = i + 1
  }
  const currentStart = curve[Math.max(0, lvl - 1)] ?? 0
  const nextStart = curve[lvl] ?? currentStart
  const xpInLevel = total - currentStart
  const nextLevelXP = Math.max(0, nextStart - currentStart)
  return { level: lvl, xpInLevel, nextLevelXP }
}

