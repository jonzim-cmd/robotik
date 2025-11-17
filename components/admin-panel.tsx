"use client"
import { useEffect, useRef, useState } from 'react'
import { Toast, ToastStack } from './toast'
import { useRouter } from 'next/navigation'
import { AdminHeader } from './admin-header'
import { logError } from '@/lib/log'

type Student = { id: string; displayName: string; course?: string }
type Robot = { key: string; name: string }
type Level = { key: string; title: string; num?: number }

const ADMIN_PIN = '1111'
const PIN_LEN = ADMIN_PIN.length

export function AdminPanel() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  
  const [students, setStudents] = useState<Student[]>([])
  const [name, setName] = useState('')
  const [course, setCourse] = useState('')
  const [info, setInfo] = useState('')
  const [studentInfo, setStudentInfo] = useState('')
  const [setupInfo, setSetupInfo] = useState('')
  const [initBusy, setInitBusy] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  function pushToast(text: string, variant: Toast['variant'] = 'info', ttl = 3000) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((t) => [...t, { id, text, variant }])
    if (ttl > 0) setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), ttl)
  }
  function dismissToast(id: string) { setToasts((t) => t.filter(x => x.id !== id)) }
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCourse, setEditCourse] = useState('')
  const [studentBusyId, setStudentBusyId] = useState<string | null>(null)
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null)
  const [resetRobots, setResetRobots] = useState<string[]>([])
  const [studentQuery, setStudentQuery] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)
  const [activeCourses, setActiveCourses] = useState<string[]>([])
  const courses = Array.from(new Set(students.map(s => s.course).filter(Boolean) as string[])).sort()
  // keep activeCourses in sync with available courses; default to all
  useEffect(() => {
    setActiveCourses(prev => {
      if (prev.length === 0) return courses
      const next = prev.filter(c => courses.includes(c))
      return next.length === 0 ? courses : next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses.join('\u0001')])
  const [showAllStudents, setShowAllStudents] = useState(false)
  const filteredStudents = students.filter(s => {
    const q = studentQuery.toLowerCase()
    const matchesQuery = (
      s.displayName.toLowerCase().includes(q) ||
      (s.course || '').toLowerCase().includes(q)
    )
    if (!matchesQuery) return false
    if (courses.length === 0) return true
    if (!s.course) return true // Schüler ohne Kurs bleiben sichtbar
    return activeCourses.includes(s.course)
  })
  const visibleStudents = (studentQuery ? filteredStudents : (showAllStudents ? filteredStudents : filteredStudents.slice(0, 3)))
  
  const [selectedRobot, setSelectedRobot] = useState('rvr_plus')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [robots] = useState<Robot[]>([
    { key: 'rvr_plus', name: 'RVR+ Sphero' },
    { key: 'cutebot_pro', name: 'Cutebot Pro (Micro:Bit)' },
    { key: 'picarx', name: 'PiCar-X (SunFounder, Raspberry Pi 5)' },
  ])
  const [levels, setLevels] = useState<Level[]>([])
  const [levelsByRobot, setLevelsByRobot] = useState<Record<string, Level[]>>({})
  const [levelLocks, setLevelLocks] = useState<Record<string, boolean>>({})
  const [locksCache, setLocksCache] = useState<Record<string, Record<string, boolean>>>({})
  const [isLoadingLevels, setIsLoadingLevels] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function refreshStudents() {
    const res = await fetch('/api/admin/students')
    const data = await res.json()
    setStudents(data.students || [])
  }

  async function loadLevels(robotKey: string, course: string) {
    try {
      setIsLoadingLevels(true)
      const cachedLvls = levelsByRobot[robotKey]
      if (cachedLvls && cachedLvls.length) setLevels(cachedLvls)
      // Load checklist to get all levels
      const checklistRes = await fetch(`/api/checklist?robot=${robotKey}`)
      const checklistData = await checklistRes.json()
      if (checklistData.checklist?.levels) {
        setLevels(checklistData.checklist.levels)
        setLevelsByRobot(prev => ({ ...prev, [robotKey]: checklistData.checklist.levels }))
      }
      
      // Load current locks with simple in-memory cache for this session
      const cacheKey = `${robotKey}::${course || ''}`
      if (locksCache[cacheKey]) {
        setLevelLocks(locksCache[cacheKey])
      } else {
        const q = new URLSearchParams({ robot: robotKey, course: course || '' }).toString()
        const locksRes = await fetch(`/api/admin/levels?${q}`)
        const locksData = await locksRes.json()
        const locks = locksData.locks || {}
        setLevelLocks(locks)
        setLocksCache(prev => ({ ...prev, [cacheKey]: locks }))
      }
    } catch (error) {
      logError('Error loading levels:', error)
    } finally {
      setIsLoadingLevels(false)
    }
  }

  async function ensureLevelsLoaded(robotKey: string) {
    if (!levelsByRobot[robotKey]) {
      try {
        const checklistRes = await fetch(`/api/checklist?robot=${robotKey}`)
        const checklistData = await checklistRes.json()
        if (checklistData.checklist?.levels) {
          setLevelsByRobot(prev => ({ ...prev, [robotKey]: checklistData.checklist.levels }))
        }
      } catch (e) { logError('ensureLevelsLoaded error', e) }
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    ;(async () => {
      await Promise.all([
        refreshStudents(),
        loadLevels(selectedRobot, selectedCourse),
      ])
    })()
  }, [isAuthenticated, selectedRobot, selectedCourse])

  // Keep selectedCourse valid when course list changes
  useEffect(() => {
    setSelectedCourse(prev => (prev && courses.includes(prev)) ? prev : (courses[0] || ''))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses.join('\u0001')])

  // Close actions dropdown when clicking outside
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!openMenuFor) return
      const el = e.target as HTMLElement
      if (el.closest?.('.actions-menu')) return
      setOpenMenuFor(null)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [openMenuFor])

  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true)
      setPinError('')
    } else {
      setPinError('Falsche PIN')
      setPinInput('')
    }
  }

  const pinInputRef = useRef<HTMLInputElement | null>(null)

  function handlePinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = (e.target.value || '').toString()
    const digitsOnly = raw.replace(/\D/g, '').slice(0, PIN_LEN)
    setPinInput(digitsOnly)
    if (pinError) setPinError('')
    if (digitsOnly.length === PIN_LEN) {
      if (digitsOnly === ADMIN_PIN) {
        setIsAuthenticated(true)
        setPinError('')
      } else {
        setPinError('Falsche PIN')
        // kurze Verzögerung, damit der letzte Punkt sichtbar bleibt
        setTimeout(() => setPinInput(''), 150)
        // Fokus behalten für schnelle Neueingabe
        requestAnimationFrame(() => pinInputRef.current?.focus())
      }
    }
  }

  async function addStudent() {
    const newName = name.trim()
    if (!newName || studentBusyId === '__add__') return
    setStudentBusyId('__add__')
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ displayName: newName, course })
      })
      const r = await res.json()
      if (!res.ok || !r.ok) throw new Error(r?.error || 'Fehler')
      pushToast('Schüler erfolgreich angelegt', 'success')
      setStudents(prev => [r.student, ...prev])
      setName('')
      setCourse('')
    } catch (e: any) {
      pushToast(`❌ ${e?.message || 'Fehler'}`, 'error')
    } finally {
      setStudentBusyId(null)
    }
  }

  function startEdit(student: Student) {
    setEditId(student.id)
    setEditName(student.displayName)
    setEditCourse(student.course || '')
  }

  function cancelEdit() {
    setEditId(null)
    setEditName('')
    setEditCourse('')
  }

  async function saveEdit() {
    if (!editId) return
    const newName = editName.trim()
    if (!newName) {
      setStudentInfo('❌ Name darf nicht leer sein')
      setTimeout(() => setStudentInfo(''), 3000)
      return
    }
    setStudentBusyId(editId)
    try {
      const res = await fetch(`/api/admin/students/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: newName, course: editCourse })
      })
      const r = await res.json().catch(() => ({} as any))
      if (!res.ok || !r.ok) {
        throw new Error(r?.error || 'Fehler beim Aktualisieren')
      }
      pushToast('Schüler erfolgreich aktualisiert', 'success')
      cancelEdit()
      refreshStudents()
    } catch (e: any) {
      pushToast(`❌ ${e?.message || 'Fehler beim Aktualisieren'}`, 'error')
    } finally {
      setStudentBusyId(null)
    }
  }

  async function deleteStudent(id: string) {
    if (!confirm('Schüler wirklich löschen? Zugehöriger Fortschritt wird entfernt.')) return
    setStudentBusyId(id)
    try {
      const res = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' })
      const r = await res.json().catch(() => ({} as any))
      if (!res.ok || !r.ok) {
        throw new Error(r?.error || 'Fehler beim Löschen')
      }
      pushToast('Schüler erfolgreich gelöscht', 'success')
      if (editId === id) cancelEdit()
      refreshStudents()
    } catch (e: any) {
      pushToast(`❌ ${e?.message || 'Fehler beim Löschen'}`, 'error')
    } finally {
      setStudentBusyId(null)
    }
  }

  async function bulkDelete(ids: string[], scopeLabel: string) {
    const count = ids.length
    if (count === 0) {
      pushToast('Keine Schüler zum Löschen gefunden', 'error')
      return
    }
    const really = confirm(`Wirklich ${scopeLabel} löschen?\nDies löscht ${count} Schüler und deren Fortschritt unumkehrbar.`)
    if (!really) return
    setBulkBusy(true)
    try {
      const res = await fetch('/api/admin/students/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      const r = await res.json().catch(() => ({} as any))
      if (!res.ok || !r.ok) {
        throw new Error(r?.error || 'Fehler beim Löschen')
      }
      pushToast(`✓ ${count} Schüler gelöscht`, 'success')
      if (editId && ids.includes(editId)) cancelEdit()
      refreshStudents()
    } catch (e: any) {
      pushToast(`❌ ${e?.message || 'Fehler beim Löschen'}`, 'error')
    } finally {
      setBulkBusy(false)
    }
  }

  async function initDb() {
    if (initBusy) return
    setInitBusy(true)
    try {
      const res = await fetch('/api/admin/init', { method: 'POST' })
      const r = await res.json().catch(() => ({} as any))
      if (!res.ok || !r.ok) {
        const msg = r?.error || 'Fehler bei der Initialisierung'
        pushToast(`❌ ${msg}`, 'error')
      } else {
        pushToast('✓ Datenbank erfolgreich initialisiert', 'success')
      }
    } catch (e: any) {
      pushToast(`❌ ${e?.message || 'Fehler bei der Initialisierung'}`, 'error')
    } finally {
      setInitBusy(false)
      setSetupInfo('')
    }
  }

  async function toggleLevel(levelKey: string) {
    const currentState = levelLocks[levelKey] || false
    const newState = !currentState
    
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          robotKey: selectedRobot,
          course: selectedCourse || '',
          levelKey,
          unlocked: newState
        })
      })
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        throw new Error(j?.error || 'API-Fehler')
      }
      
      const cacheKey = `${selectedRobot}::${selectedCourse || ''}`
      const next = { ...levelLocks, [levelKey]: newState }
      setLevelLocks(next)
      setLocksCache(prev => ({ ...prev, [cacheKey]: next }))
      pushToast(`✓ Level "${levelKey}" erfolgreich ${newState ? 'freigeschaltet' : 'gesperrt'} und gespeichert`, 'success')
    } catch (error: any) {
      logError('Error toggling level:', error)
      const msg = typeof error?.message === 'string' ? error.message : 'Fehler beim Speichern des Levels'
      pushToast(`❌ ${msg}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function unlockAllLevels() {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          robotKey: selectedRobot,
          course: selectedCourse || '',
          updates: levels.map(l => ({ levelKey: l.key, unlocked: true }))
        })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        throw new Error(j?.error || 'API-Fehler')
      }
      // Optimistisch UI + cache
      const cacheKey = `${selectedRobot}::${selectedCourse || ''}`
      const next: Record<string, boolean> = {}
      for (const l of levels) next[l.key] = true
      setLevelLocks(next)
      setLocksCache(prev => ({ ...prev, [cacheKey]: next }))
      pushToast('✓ Alle Levels erfolgreich freigeschaltet und gespeichert','success')
    } catch (error: any) {
      logError('Error unlocking all levels:', error)
      const msg = typeof error?.message === 'string' ? error.message : 'Fehler beim Speichern der Levels'
      pushToast(`❌ ${msg}`,'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function lockAllLevels() {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          robotKey: selectedRobot,
          course: selectedCourse || '',
          updates: levels.map(l => ({ levelKey: l.key, unlocked: false }))
        })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        throw new Error(j?.error || 'API-Fehler')
      }
      const cacheKey = `${selectedRobot}::${selectedCourse || ''}`
      const next: Record<string, boolean> = {}
      for (const l of levels) next[l.key] = false
      setLevelLocks(next)
      setLocksCache(prev => ({ ...prev, [cacheKey]: next }))
      pushToast('✓ Alle Levels erfolgreich gesperrt und gespeichert','success')
    } catch (error: any) {
      logError('Error locking all levels:', error)
      const msg = typeof error?.message === 'string' ? error.message : 'Fehler beim Speichern der Levels'
      pushToast(`❌ ${msg}`,'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function resetStudentProgress(studentId: string, robotKey: string, mode: 'all' | 'upto', uptoIndex?: number) {
    setStudentBusyId(studentId)
    try {
      const res = await fetch(`/api/admin/students/${encodeURIComponent(studentId)}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_progress', robotKey, upToLevelIndex: mode === 'all' ? null : (uptoIndex ?? null) })
      })
      const j = await res.json().catch(() => ({} as any))
      if (!res.ok || !j.ok) throw new Error(j?.error || 'Fehler beim Zurücksetzen')
      pushToast('✓ Level-Fortschritt zurückgesetzt', 'success')
    } catch (e: any) {
      pushToast(`❌ ${e?.message || 'Fehler beim Zurücksetzen'}`, 'error')
    } finally {
      setStudentBusyId(null)
      setOpenMenuFor(null)
    }
  }

  async function resetStudentXP(studentId: string, scope: 'student' | 'robot' = 'student', robotKey?: string) {
    setStudentBusyId(studentId)
    try {
      const res = await fetch(`/api/admin/students/${encodeURIComponent(studentId)}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_xp', scope, robotKey })
      })
      const j = await res.json().catch(() => ({} as any))
      if (!res.ok || !j.ok) throw new Error(j?.error || 'Fehler beim XP-Reset')
      pushToast('✓ XP zurückgesetzt', 'success')
      try { window.dispatchEvent(new Event('xp:updated')) } catch {}
    } catch (e: any) {
      pushToast(`❌ ${e?.message || 'Fehler beim XP-Reset'}`, 'error')
    } finally {
      setStudentBusyId(null)
      setOpenMenuFor(null)
    }
  }

  

  // Refs für Sektionen (Tabs)
  const levelRef = useRef<HTMLDivElement | null>(null)
  const studentsRef = useRef<HTMLDivElement | null>(null)
  const setupRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<'levels' | 'students' | 'setup'>('levels')

  function scrollToRef(ref: React.RefObject<HTMLDivElement>) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    const sections: Array<{ key: 'levels'|'students'|'setup'; el: HTMLElement | null }> = [
      { key: 'levels', el: levelRef.current },
      { key: 'students', el: studentsRef.current },
      { key: 'setup', el: setupRef.current },
    ]
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const match = sections.find(s => s.el === entry.target)
          if (match) setActiveTab(match.key)
        }
      })
    }, { root: null, threshold: 0.4, rootMargin: '-10% 0px -60% 0px' })
    sections.forEach(s => { if (s.el) io.observe(s.el) })
    return () => io.disconnect()
  }, [])

  // PIN-Eingabe-Formular
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="card p-8 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-4 text-center">Admin-Zugang</h2>
          <p className="text-neutral-400 text-sm mb-6 text-center">
            Bitte geben Sie die PIN ein, um auf den Admin-Bereich zuzugreifen.
          </p>
          <form onSubmit={handlePinSubmit} className="space-y-4" autoComplete="off">
            <div className="flex flex-col items-center gap-3">
              {/* iPhone-ähnliche PIN-Eingabe */}
              <div
                className="flex gap-3 select-none"
                onClick={() => pinInputRef.current?.focus()}
              >
                {Array.from({ length: PIN_LEN }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-11 h-14 rounded-md border flex items-center justify-center text-2xl ${
                      pinInput.length > idx
                        ? 'border-neutral-600 bg-neutral-800'
                        : 'border-neutral-800 bg-neutral-900/60'
                    }`}
                  >
                    {pinInput.length > idx ? '•' : ''}
                  </div>
                ))}
              </div>
              {/* Verstecktes numerisches Feld für echte Eingabe */}
              <input
                ref={pinInputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={PIN_LEN}
                className="sr-only"
                value={pinInput}
                onChange={handlePinChange}
                autoFocus
              />
              {pinError && (
                <p className="mt-1 text-sm text-red-400 text-center">{pinError}</p>
              )}
            </div>
            {/* Kein Button nötig – automatische Prüfung nach Eingabe */}
          </form>
        </div>
      </div>
    )
  }

  // Admin-Panel (nach erfolgreicher Anmeldung)
  return (
    <div className="space-y-6">
      <AdminHeader
        activeTab={activeTab}
        onLevels={() => scrollToRef(levelRef)}
        onStudents={() => scrollToRef(studentsRef)}
        onSetup={() => scrollToRef(setupRef)}
      />
      {/* Zurück-Button */}
      <div />

      {/* Tabs sind im AdminHeader untergebracht */}

      {/* Level-Verwaltung */}
      <div ref={levelRef} className="card p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-medium text-lg">Level-Verwaltung</h3>
              {(isSaving || isLoadingLevels) && (
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{isSaving ? 'Wird gespeichert...' : 'Lade...'}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                className="btn text-sm"
                onClick={unlockAllLevels}
                disabled={isSaving}
              >
                Alle freischalten
              </button>
              <button 
                className="btn text-sm"
                onClick={lockAllLevels}
                disabled={isSaving}
              >
                Alle sperren
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-neutral-400 mb-2">Roboter & Kurs wählen:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select 
                className="select w-full"
                value={selectedRobot}
                onChange={(e) => setSelectedRobot(e.target.value)}
                disabled={isLoadingLevels || isSaving}
              >
                {robots.map(robot => (
                  <option key={robot.key} value={robot.key}>{robot.name}</option>
                ))}
              </select>
              <select
                className="select w-full"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                disabled={isLoadingLevels || isSaving}
              >
                <option value="">(Kein Kurs)</option>
                {courses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {isLoadingLevels ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-md border border-neutral-800 bg-neutral-900/60 animate-pulse">
                <div className="h-4 w-40 bg-neutral-800 rounded mb-2" />
                <div className="h-3 w-72 bg-neutral-800/80 rounded" />
              </div>
            ))}
          </div>
        ) : levels.length > 0 ? (
          <div className="space-y-2">
            {levels.map((level) => {
              const isUnlocked = levelLocks[level.key] || false
              return (
                <div 
                  key={level.key}
                  className="flex items-center justify-between p-3 rounded-md border border-neutral-800 bg-neutral-900/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-neutral-300">
                      Level {level.num ?? '?'}
                    </span>
                    <span className="text-neutral-100">{level.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      isUnlocked 
                        ? 'bg-green-900/30 text-green-400 border border-green-700/50' 
                        : 'bg-red-900/30 text-red-400 border border-red-700/50'
                    }`}>
                      {isUnlocked ? '✓ Freigeschaltet' : '✗ Gesperrt'}
                    </span>
                    <button
                      className="btn text-sm"
                      onClick={() => toggleLevel(level.key)}
                      disabled={isSaving}
                    >
                      {isUnlocked ? 'Sperren' : 'Freischalten'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-neutral-400 text-sm">Keine Levels gefunden</p>
        )}
        
        {/* Toasts übernehmen Statusmeldungen */}
      </div>

      {/* Schüler anlegen */}
      <div ref={studentsRef} className="card p-4">
        <div className="mb-2 font-medium">Schüler anlegen</div>
        <div className="flex gap-2">
          <input 
            className="input flex-1" 
            placeholder="Vorname Nachname" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addStudent()}
          />
          <input
            className="input flex-1"
            placeholder="Kurs / Lehrkraft (optional)"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addStudent()}
          />
          <button className="btn" onClick={addStudent} disabled={studentBusyId === '__add__'}>
            {studentBusyId === '__add__' ? 'Speichere…' : 'Anlegen'}
          </button>
        </div>
        {/* Statusmeldungen via Toasts */}
      </div>

      {/* Schülerliste */}
      <div className="card p-4">
        <div className="mb-2 font-medium">Schüler-Verwaltung</div>
        <div className="mb-3">
          <input
            className="input w-full"
            placeholder="Suchen…"
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
          />
        </div>
        {/* Bulk actions */}
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            className="btn text-sm"
            onClick={() => bulkDelete(visibleStudents.map(s => s.id), 'alle angezeigten Schüler')}
            disabled={bulkBusy || visibleStudents.length === 0}
            title={visibleStudents.length === 0 ? 'Keine angezeigten Schüler' : ''}
          >
            Alle angezeigten löschen
          </button>
          <button
            className="btn text-sm"
            onClick={() => bulkDelete(students.map(s => s.id), 'ALLE Schüler')}
            disabled={bulkBusy || students.length === 0}
            title={students.length === 0 ? 'Keine Schüler vorhanden' : ''}
          >
            Alle Schüler löschen
          </button>
        </div>
        {courses.length > 0 && (
          <div className="mb-3">
            <div className="mb-1 text-xs text-neutral-400">Kurse</div>
            <div className="flex flex-wrap gap-2">
              {courses.map((c) => (
                <label key={c} className="inline-flex items-center gap-1 text-xs text-neutral-200">
                  <input
                    type="checkbox"
                    className="accent-brand-500"
                    checked={activeCourses.includes(c)}
                    onChange={() => setActiveCourses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
            <div className="mt-1 flex gap-3 text-[11px] text-neutral-400">
              <button type="button" className="underline hover:text-neutral-200" onClick={() => setActiveCourses(courses)}>Alle</button>
              <button type="button" className="underline hover:text-neutral-200" onClick={() => setActiveCourses([])}>Keine</button>
            </div>
          </div>
        )}
        <ul className="space-y-1">
          {visibleStudents.map(s => (
            <li key={s.id} className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900/60 p-2 gap-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {editId === s.id ? (
                  <div className="flex flex-1 gap-2">
                    <input
                      className="input flex-1"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      autoFocus
                    />
                    <input
                      className="input flex-1"
                      placeholder="Kurs / Lehrkraft (optional)"
                      value={editCourse}
                      onChange={(e) => setEditCourse(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                    />
                  </div>
                ) : (
                  <div className="truncate">
                    <span>{s.displayName}</span>
                    {s.course ? (
                      <span className="ml-2 text-xs text-neutral-400">(Kurs: {s.course})</span>
                    ) : null}
                  </div>
                )}
                <span className="text-xs text-neutral-500 shrink-0">{s.id}</span>
              </div>
              <div className="relative flex items-center gap-2 shrink-0">
                {editId === s.id ? (
                  <>
                    <button className="btn text-sm" onClick={saveEdit} disabled={studentBusyId === s.id}>Speichern</button>
                    <button className="btn text-sm" onClick={cancelEdit} disabled={studentBusyId === s.id}>Abbrechen</button>
                  </>
                ) : (
                  <>
                    <button className="btn text-sm" onClick={() => startEdit(s)} disabled={studentBusyId === s.id}>Bearbeiten</button>
                    <div className="relative">
                      <button className="btn text-sm" onClick={async () => {
                        setOpenMenuFor(v => v === s.id ? null : s.id)
                        setResetRobots([selectedRobot])
                        await ensureLevelsLoaded(selectedRobot)
                      }} disabled={studentBusyId === s.id}>Aktionen</button>
                      {openMenuFor === s.id && (
                        <div className="actions-menu absolute right-0 mt-1 w-80 rounded-md border border-neutral-800 bg-neutral-900/95 shadow-xl z-10">
                          <div className="px-3 py-2 text-xs uppercase text-neutral-400">Roboter wählen</div>
                          <div className="px-3 pb-2 flex flex-wrap gap-3">
                            {robots.map(r => (
                              <label key={r.key} className="inline-flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  className="accent-brand-500"
                                  checked={resetRobots.includes(r.key)}
                                  onChange={async () => {
                                    setResetRobots(prev => {
                                      const next = prev.includes(r.key) ? prev.filter(x => x !== r.key) : [...prev, r.key]
                                      return next
                                    })
                                    await ensureLevelsLoaded(r.key)
                                  }}
                                />
                                <span>{r.name}</span>
                              </label>
                            ))}
                          </div>
                          <div className="border-t border-neutral-800" />
                          <div className="px-3 py-2 text-xs uppercase text-neutral-400">Levels zurücksetzen</div>
                          <div className="max-h-64 overflow-auto">
                            {resetRobots.length === 0 ? (
                              <div className="px-3 pb-3 text-sm text-neutral-500">Bitte mindestens einen Roboter wählen.</div>
                            ) : (
                              <div className="space-y-2 pb-2">
                                <button className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-800" onClick={async () => {
                                  for (const rk of resetRobots) await resetStudentProgress(s.id, rk, 'all')
                                }}>
                                  Alle gewählten Roboter: Alle Levels
                                </button>
                                {resetRobots.map(rk => (
                                  <div key={rk} className="border-t border-neutral-800 pt-2">
                                    <div className="px-3 py-1 text-xs text-neutral-400">{robots.find(r => r.key === rk)?.name}</div>
                                    <div className="max-h-40 overflow-auto">
                                      {(levelsByRobot[rk] || []).map((l, idx) => (
                                        <button key={l.key} className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-800" onClick={() => resetStudentProgress(s.id, rk, 'upto', idx)}>
                                          Levels 0–{idx} zurücksetzen
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="border-t border-neutral-800" />
                          <div className="px-3 py-2 text-xs uppercase text-neutral-400">XP</div>
                          <button className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-800" onClick={() => resetStudentXP(s.id, 'student')}>
                            XP zurücksetzen – gesamt
                          </button>
                          <button className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-800" onClick={async () => {
                            for (const rk of resetRobots) await resetStudentXP(s.id, 'robot', rk)
                          }}>
                            XP zurücksetzen – nur gewählte Roboter ({resetRobots.length || '0'})
                          </button>
                        </div>
                      )}
                    </div>
                    <button className="btn text-sm" onClick={() => deleteStudent(s.id)} disabled={studentBusyId === s.id}>Löschen</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
        {/* Show more/less control */}
        {!studentQuery && filteredStudents.length > 3 && (
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
            <span>
              {showAllStudents ? `${filteredStudents.length} von ${filteredStudents.length}` : `3 von ${filteredStudents.length}`} angezeigt
            </span>
            <button
              className="text-neutral-400 hover:text-neutral-200"
              onClick={() => setShowAllStudents(v => !v)}
            >
              {showAllStudents ? 'Weniger anzeigen' : 'Alle anzeigen'}
            </button>
          </div>
        )}
      </div>

      {/* Setup (ans Ende verschoben) */}
      <div ref={setupRef} className="card p-4">
        <div className="mb-2 font-medium">Setup</div>
        <button className="btn" onClick={initDb} disabled={initBusy}>
          {initBusy ? 'Initialisiere…' : 'Datenbank initialisieren'}
        </button>
        {setupInfo ? (
          <div className="mt-2 text-sm text-neutral-400">{setupInfo}</div>
        ) : null}
        {/* Statusmeldungen via Toasts */}
      </div>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
