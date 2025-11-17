"use client"
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Student = { id: string; displayName: string }
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
  const [info, setInfo] = useState('')
  const [studentInfo, setStudentInfo] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [studentBusyId, setStudentBusyId] = useState<string | null>(null)
  
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
        body: JSON.stringify({ displayName: newName })
      })
      const r = await res.json()
      if (!res.ok || !r.ok) throw new Error(r?.error || 'Fehler')
      setStudentInfo('✓ Schüler erfolgreich angelegt')
      setStudents(prev => [r.student, ...prev])
      setName('')
    } catch (e: any) {
      setStudentInfo(`❌ ${e?.message || 'Fehler'}`)
    } finally {
      setTimeout(() => setStudentInfo(''), 3000)
      setStudentBusyId(null)
    }
  }

  function startEdit(student: Student) {
    setEditId(student.id)
    setEditName(student.displayName)
  }

  function cancelEdit() {
    setEditId(null)
    setEditName('')
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
        body: JSON.stringify({ displayName: newName })
      })
      const r = await res.json().catch(() => ({} as any))
      if (!res.ok || !r.ok) {
        throw new Error(r?.error || 'Fehler beim Aktualisieren')
      }
      setStudentInfo('✓ Schüler erfolgreich aktualisiert')
      setTimeout(() => setStudentInfo(''), 3000)
      cancelEdit()
      refreshStudents()
    } catch (e: any) {
      setStudentInfo(`❌ ${e?.message || 'Fehler beim Aktualisieren'}`)
      setTimeout(() => setStudentInfo(''), 3000)
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
      setStudentInfo('✓ Schüler erfolgreich gelöscht')
      setTimeout(() => setStudentInfo(''), 3000)
      if (editId === id) cancelEdit()
      refreshStudents()
    } catch (e: any) {
      setStudentInfo(`❌ ${e?.message || 'Fehler beim Löschen'}`)
      setTimeout(() => setStudentInfo(''), 3000)
    } finally {
      setStudentBusyId(null)
    }
  }

  async function initDb() {
    const res = await fetch('/api/admin/init', { method: 'POST' })
    const r = await res.json()
    setStudentInfo(r.ok ? '✓ Datenbank erfolgreich initialisiert' : r.error || '❌ Fehler')
    setTimeout(() => setStudentInfo(''), 3000)
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
      setInfo(`✓ Level "${levelKey}" erfolgreich ${newState ? 'freigeschaltet' : 'gesperrt'} und gespeichert`)
      
      // Clear success message after 3 seconds
      setTimeout(() => setInfo(''), 3000)
    } catch (error: any) {
      console.error('Error toggling level:', error)
      const msg = typeof error?.message === 'string' ? error.message : 'Fehler beim Speichern des Levels'
      setInfo(`❌ ${msg}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function unlockAllLevels() {
    setIsSaving(true)
    try {
      for (const level of levels) {
        const res = await fetch('/api/admin/levels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            robotKey: selectedRobot,
            levelKey: level.key,
            unlocked: true
          })
        })
        
        if (!res.ok) {
          const j = await res.json().catch(() => ({} as any))
          throw new Error(j?.error || 'API-Fehler')
        }
      }
      await loadLevels(selectedRobot)
      setInfo('✓ Alle Levels erfolgreich freigeschaltet und gespeichert')
      setTimeout(() => setInfo(''), 3000)
    } catch (error: any) {
      console.error('Error unlocking all levels:', error)
      const msg = typeof error?.message === 'string' ? error.message : 'Fehler beim Speichern der Levels'
      setInfo(`❌ ${msg}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function lockAllLevels() {
    setIsSaving(true)
    try {
      for (const level of levels) {
        const res = await fetch('/api/admin/levels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            robotKey: selectedRobot,
            levelKey: level.key,
            unlocked: false
          })
        })
        
        if (!res.ok) {
          const j = await res.json().catch(() => ({} as any))
          throw new Error(j?.error || 'API-Fehler')
        }
      }
      await loadLevels(selectedRobot)
      setInfo('✓ Alle Levels erfolgreich gesperrt und gespeichert')
      setTimeout(() => setInfo(''), 3000)
    } catch (error: any) {
      console.error('Error locking all levels:', error)
      const msg = typeof error?.message === 'string' ? error.message : 'Fehler beim Speichern der Levels'
      setInfo(`❌ ${msg}`)
    } finally {
      setIsSaving(false)
    }
  }

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

      {/* Level-Verwaltung */}
      <div className="card p-4">
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
        
        {/* Status-Nachricht für Level-Operationen */}
        {info && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            info.includes('✓') 
              ? 'bg-green-900/20 border border-green-700/50 text-green-300' 
              : info.includes('❌')
              ? 'bg-red-900/20 border border-red-700/50 text-red-300'
              : 'bg-neutral-800/50 border border-neutral-700 text-neutral-300'
          }`}>
            {info}
          </div>
        )}
      </div>

      {/* Setup */}
      <div className="card p-4">
        <div className="mb-2 font-medium">Setup</div>
        <button className="btn" onClick={initDb}>Datenbank initialisieren</button>
        {studentInfo && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            studentInfo.includes('✓') 
              ? 'bg-green-900/20 border border-green-700/50 text-green-300' 
              : 'bg-red-900/20 border border-red-700/50 text-red-300'
          }`}>
            {studentInfo}
          </div>
        )}
      </div>

      {/* Schüler anlegen */}
      <div className="card p-4">
        <div className="mb-2 font-medium">Schüler anlegen</div>
        <div className="flex gap-2">
          <input 
            className="input flex-1" 
            placeholder="Vorname Nachname" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addStudent()}
          />
          <button className="btn" onClick={addStudent} disabled={studentBusyId === '__add__'}>
            {studentBusyId === '__add__' ? 'Speichere…' : 'Anlegen'}
          </button>
        </div>
        {studentInfo && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            studentInfo.includes('✓') 
              ? 'bg-green-900/20 border border-green-700/50 text-green-300' 
              : 'bg-red-900/20 border border-red-700/50 text-red-300'
          }`}>
            {studentInfo}
          </div>
        )}
      </div>

      {/* Schülerliste */}
      <div className="card p-4">
        <div className="mb-2 font-medium">Schüler</div>
        <ul className="space-y-1">
          {students.map(s => (
            <li key={s.id} className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900/60 p-2 gap-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {editId === s.id ? (
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
                ) : (
                  <span className="truncate">{s.displayName}</span>
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
      </div>
    </div>
  )
}
