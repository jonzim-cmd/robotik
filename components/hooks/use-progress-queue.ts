"use client"
import { useCallback, useEffect, useRef, useState } from 'react'

type ProgressEntry = { status: 'done' | 'todo' | 'in_progress'; payload?: any }

export function useProgressQueue(robotKey: string, studentId: string) {
  const [isSaving, setIsSaving] = useState(false)
  const pendingRef = useRef<Record<string, ProgressEntry>>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inflightRef = useRef(false)

  const flush = useCallback(async () => {
    if (!studentId) return
    if (inflightRef.current) return
    const delta = pendingRef.current
    if (!delta || Object.keys(delta).length === 0) return
    pendingRef.current = {}
    inflightRef.current = true
    setIsSaving(true)
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robot: robotKey, student: studentId, delta })
      })
    } finally {
      inflightRef.current = false
      // If more came in during flight, schedule another flush
      if (Object.keys(pendingRef.current).length > 0) {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(flush, 200)
      } else {
        setIsSaving(false)
      }
    }
  }, [robotKey, studentId])

  const queue = useCallback((delta: Record<string, ProgressEntry>) => {
    // Merge into pending
    pendingRef.current = { ...pendingRef.current, ...delta }
    // Debounce flush
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(flush, 250)
  }, [flush])

  useEffect(() => {
    const onBeforeUnload = () => { /* best effort sync - fire and forget */ flush() }
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [flush])

  return { isSaving, queue }
}

