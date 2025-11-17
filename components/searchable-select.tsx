"use client"
import { useEffect, useMemo, useRef, useState } from 'react'

export type Option = { value: string; label: string }

export function SearchableSelect({
  options,
  value,
  placeholder = 'Auswählen…',
  onChange,
  className = '',
}: {
  options: Option[]
  value: string
  placeholder?: string
  onChange: (value: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)

  const selected = useMemo(() => options.find(o => o.value === value) || null, [options, value])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(o => o.label.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return
      if (boxRef.current.contains(e.target as any)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setQuery('')
    }
  }, [open])

  return (
    <div className={`relative ${className}`} ref={boxRef}>
      <button
        type="button"
        className="select w-64 text-left"
        onClick={() => setOpen(v => !v)}
      >
        {selected ? selected.label : <span className="text-neutral-400">{placeholder}</span>}
      </button>
      {open && (
        <div className="absolute left-0 right-auto mt-1 w-80 max-w-[min(20rem,90vw)] rounded-md border border-neutral-800 bg-neutral-900 shadow-lg z-50" style={{ top: 'calc(100% + 0.25rem)' }}>
          <div className="p-2 border-b border-neutral-800 sticky top-0 bg-neutral-900">
            <input
              ref={inputRef}
              className="input w-full"
              placeholder="Suchen…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className="max-h-64 overflow-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-neutral-500">Keine Treffer</li>
            ) : (
              filtered.map(o => (
                <li key={o.value}>
                  <button
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 ${o.value === value ? 'text-brand-300' : 'text-neutral-200'}`}
                    onClick={() => { onChange(o.value); setOpen(false) }}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

