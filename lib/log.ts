const isProd = process.env.NODE_ENV === 'production'

export function logInfo(...args: any[]) {
  if (!isProd) console.info(...args)
}

export function logError(...args: any[]) {
  if (!isProd) console.error(...args)
}

export function logWarn(...args: any[]) {
  if (!isProd) console.warn(...args)
}

export function logDebug(...args: any[]) {
  if (!isProd) console.debug?.(...args)
}

