export function randomId() {
  // simple URL-safe random ID
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID()
  }
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join('')
}

