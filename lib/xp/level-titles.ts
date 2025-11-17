export function xpLevelTitle(level: number): string {
  // Short, clear German rank names per level
  const titles = [
    'Rookie',       // 1
    'Entdecker',    // 2
    'Tüftler',      // 3
    'Programmierer',// 4
    'Ingenieur',    // 5
    'Navigator',    // 6
    'Architekt',    // 7
    'Virtuose',     // 8
    'Meister',      // 9
    'Legende',      // 10
  ]
  if (level <= 0) return 'Rookie'
  if (level <= titles.length) return titles[level - 1]
  return `Legende+${level - titles.length}`
}

