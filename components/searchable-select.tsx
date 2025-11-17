"use client"
import { useEffect, useMemo, useRef, useState } from 'react'

export type Option = { value: string; label: string; course?: string }

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
  const [activeCourses, setActiveCourses] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)

  const selected = useMemo(() => options.find(o => o.value === value) || null, [options, value])
  const courses = useMemo(() => {
    const set = new Set<string>()
    for (const o of options) if (o.course) set.add(o.course)
    return Array.from(set).sort()
  }, [options])

  useEffect(() => {
    // Initialize/trim active courses based on available ones
    setActiveCourses(prev => {
      if (prev.length === 0) return courses
      const next = prev.filter(c => courses.includes(c))
      // If all were removed (e.g., data changed), default to all
      return next.length === 0 ? courses : next
    })
  }, [courses])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const byQuery = (o: Option) => (q ? o.label.toLowerCase().includes(q) : true)
    const byCourse = (o: Option) => {
      if (!courses.length) return true // no course data -> no filter
      if (!o.course) return true      // items without course remain visible
      return activeCourses.includes(o.course)
    }
    return options.filter(o => byQuery(o) && byCourse(o))
  }, [options, query, activeCourses, courses])

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
          {courses.length > 0 && (
            <div className="p-2 border-b border-neutral-800">
              <div className="mb-1 text-xs text-neutral-400">Kurse</div>
              <div className="flex flex-wrap gap-2">
                {courses.map((c) => (
                  <label key={c} className="inline-flex items-center gap-1 text-xs text-neutral-200">
                    <input
                      type="checkbox"
                      className="accent-brand-500"
                      checked={activeCourses.includes(c)}
                      onChange={() =>
                        setActiveCourses((prev) =>
                          prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                        )
                      }
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
              <div className="mt-1 flex gap-3 text-[11px] text-neutral-400">
                <button
                  type="button"
                  className="underline hover:text-neutral-200"
                  onClick={() => setActiveCourses(courses)}
                >Alle</button>
                <button
                  type="button"
                  className="underline hover:text-neutral-200"
                  onClick={() => setActiveCourses([])}
                >Keine</button>
              </div>
            </div>
          )}
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
