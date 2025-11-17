"use client"
export type Toast = { id: string; text: string; variant?: 'success'|'error'|'info' }

export function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null
  return (
    <div className="fixed top-3 right-3 z-50 space-y-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`rounded-md border px-3 py-2 text-sm shadow-md backdrop-blur bg-neutral-900/90 ${
            t.variant === 'success'
              ? 'border-green-700/50 text-green-200'
              : t.variant === 'error'
              ? 'border-red-700/50 text-red-200'
              : 'border-neutral-700/60 text-neutral-200'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            {t.variant === 'success' ? (
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : t.variant === 'error' ? (
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
            )}
            <span className="flex-1">{t.text}</span>
            <button className="text-xs text-neutral-400 hover:text-neutral-200" onClick={() => onDismiss(t.id)}>Schließen</button>
          </div>
        </div>
      ))}
    </div>
  )
}

