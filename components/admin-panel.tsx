"use client"
import { useEffect, useRef, useState } from 'react'
import { Toast, ToastStack } from './toast'
import { useRouter } from 'next/navigation'

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
  const [robots] = useState<Robot[]>([
    { key: 'rvr_plus', name: 'RVR+ Sphero' },
    { key: 'cutebot_pro', name: 'Cutebot Pro (Micro:Bit)' },
    { key: 'picarx', name: 'PiCar-X (SunFounder, Raspberry Pi 5)' },
  ])
  const [levels, setLevels] = useState<Level[]>([])
  const [levelLocks, setLevelLocks] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)

  async function refreshStudents() {
    const res = await fetch('/api/admin/students')
    const data = await res.json()
    setStudents(data.students || [])
  }

  async function loadLevels(robotKey: string) {
    try {
      // Load checklist to get all levels
      const checklistRes = await fetch(`/api/checklist?robot=${robotKey}`)
      const checklistData = await checklistRes.json()
      if (checklistData.checklist?.levels) {
        setLevels(checklistData.checklist.levels)
      }
      
      // Load current locks
      const locksRes = await fetch(`/api/admin/levels?robot=${robotKey}`)
      const locksData = await locksRes.json()
      setLevelLocks(locksData.locks || {})
    } catch (error) {
      console.error('Error loading levels:', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      refreshStudents()
      loadLevels(selectedRobot)
    }
  }, [isAuthenticated, selectedRobot])

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
    const res = await fetch('/api/admin/init', { method: 'POST' })
    const r = await res.json()
    setSetupInfo(r.ok ? '✓ Datenbank erfolgreich initialisiert' : r.error || '❌ Fehler')
    setTimeout(() => setSetupInfo(''), 3000)
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
          levelKey,
          unlocked: newState
        })
      })
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        throw new Error(j?.error || 'API-Fehler')
      }
      
      setLevelLocks({ ...levelLocks, [levelKey]: newState })
      pushToast(`✓ Level "${levelKey}" erfolgreich ${newState ? 'freigeschaltet' : 'gesperrt'} und gespeichert`, 'success')
    } catch (error: any) {
      console.error('Error toggling level:', error)
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
          updates: levels.map(l => ({ levelKey: l.key, unlocked: true }))
        })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        throw new Error(j?.error || 'API-Fehler')
      }
      // Optimistisch UI aktualisieren
      const next: Record<string, boolean> = { ...levelLocks }
      for (const l of levels) next[l.key] = true
      setLevelLocks(next)
      pushToast('✓ Alle Levels erfolgreich freigeschaltet und gespeichert','success')
    } catch (error: any) {
      console.error('Error unlocking all levels:', error)
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
          updates: levels.map(l => ({ levelKey: l.key, unlocked: false }))
        })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        throw new Error(j?.error || 'API-Fehler')
      }
      const next: Record<string, boolean> = { ...levelLocks }
      for (const l of levels) next[l.key] = false
      setLevelLocks(next)
      pushToast('✓ Alle Levels erfolgreich gesperrt und gespeichert','success')
    } catch (error: any) {
      console.error('Error locking all levels:', error)
      const msg = typeof error?.message === 'string' ? error.message : 'Fehler beim Speichern der Levels'
      pushToast(`❌ ${msg}`,'error')
    } finally {
      setIsSaving(false)
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
      {/* Zurück-Button */}
      <div>
        <button 
          className="btn flex items-center gap-2"
          onClick={() => router.push('/')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Zurück zur Hauptseite
        </button>
      </div>

      {/* Tabs werden via Portal in den Header (header-secondary) injiziert */}
      <HeaderTabsPortal
        activeTab={activeTab}
        onLevels={() => scrollToRef(levelRef)}
        onStudents={() => scrollToRef(studentsRef)}
        onSetup={() => scrollToRef(setupRef)}
      />

      {/* Level-Verwaltung */}
      <div ref={levelRef} className="card p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-medium text-lg">Level-Verwaltung</h3>
              {isSaving && (
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Wird gespeichert...</span>
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
            <label className="block text-sm text-neutral-400 mb-2">Roboter wählen:</label>
            <select 
              className="select w-full"
              value={selectedRobot}
              onChange={(e) => setSelectedRobot(e.target.value)}
            >
              {robots.map(robot => (
                <option key={robot.key} value={robot.key}>{robot.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {levels.length > 0 ? (
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
              <div className="flex items-center gap-2 shrink-0">
                {editId === s.id ? (
                  <>
                    <button className="btn text-sm" onClick={saveEdit} disabled={studentBusyId === s.id}>Speichern</button>
                    <button className="btn text-sm" onClick={cancelEdit} disabled={studentBusyId === s.id}>Abbrechen</button>
                  </>
                ) : (
                  <>
                    <button className="btn text-sm" onClick={() => startEdit(s)} disabled={studentBusyId === s.id}>Bearbeiten</button>
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
        <button className="btn" onClick={initDb}>Datenbank initialisieren</button>
        {/* Statusmeldungen via Toasts */}
      </div>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

// Portiert die Admin-Tabs in den Header-Sekundärbereich
function HeaderTabsPortal({ activeTab, onLevels, onStudents, onSetup }: { activeTab: 'levels'|'students'|'setup'; onLevels: () => void; onStudents: () => void; onSetup: () => void }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setTarget(document.getElementById('header-secondary'))
    return () => setTarget(null)
  }, [])
  if (!target) return null
  return (require('react-dom').createPortal(
    <div className="mx-auto max-w-5xl">
      <div className="flex gap-2 p-2">
        <button
          className={`px-4 py-1.5 text-sm rounded-full border transition ${activeTab === 'levels' ? 'border-brand-500 bg-brand-600/20 text-brand-100' : 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:bg-neutral-800'}`}
          onClick={onLevels}
        >Level-Verwaltung</button>
        <button
          className={`px-4 py-1.5 text-sm rounded-full border transition ${activeTab === 'students' ? 'border-brand-500 bg-brand-600/20 text-brand-100' : 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:bg-neutral-800'}`}
          onClick={onStudents}
        >Schüler-Verwaltung</button>
        <button
          className={`px-4 py-1.5 text-sm rounded-full border transition ${activeTab === 'setup' ? 'border-brand-500 bg-brand-600/20 text-brand-100' : 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:bg-neutral-800'}`}
          onClick={onSetup}
        >Setup</button>
      </div>
    </div>,
    target
  ))
}
