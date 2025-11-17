import type { XPRules } from '../types'

// Default rules. Can be overridden per robot later.
export const defaultRules: XPRules = {
  baseItemXP: 10,
  levelCompleteXP: 25,
  difficultyBonus: { easy: 5, medium: 10, hard: 15 },
  reflection: { enabled: false, minLength: 120, bonusXP: 5 },
  mastery: {
    tiers: [
      { thresholdItems: 10, bonusXP: 30, badgeKey: 'mastery_t1' },
      { thresholdItems: 20, bonusXP: 50, badgeKey: 'mastery_t2' },
      { thresholdItems: 35, bonusXP: 75, badgeKey: 'mastery_t3' },
      { thresholdItems: 999999, bonusXP: 100, badgeKey: 'mastery_t4' }, // treat "all items" as high threshold; validated separately
    ],
  },
  // simple, gentle curve: thresholds for start of levels, level 1 starts at 0
  levelCurve: [0, 50, 120, 210, 320, 450, 600, 770, 960, 1170, 1400],
}

// Optional per-robot overrides can be added here if desired.
export function getDefaultsForRobot(robotKey?: string): XPRules {
  // For now, return defaults for all robots.
  return defaultRules
}

