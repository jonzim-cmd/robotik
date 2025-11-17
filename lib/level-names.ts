export function getCoolLevelTitle(robotKey: string, levelKey: string, fallback: string): string {
  const map: Record<string, Record<string, string>> = {
    rvr_plus: {
      start_verbindung: 'Boot & Link 🔗',
      bewegung: 'Drive & Flow 🏎️',
      schleifen: 'Loop Mastery ♻️',
      leds: 'LED FX ✨',
    },
    cutebot_pro: {
      start: 'Boot & Basics 🚀',
      sensoren: 'Sensor Suite 🔧',
    },
    picarx: {
      start: 'Boot & Basics 🚀',
      sensoren: 'Sensor Suite 🔧',
    },
  }
  return map[robotKey]?.[levelKey] || fallback
}

