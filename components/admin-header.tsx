"use client"
export function AdminHeader({ activeTab, onLevels, onStudents, onSetup }: { activeTab: 'levels'|'students'|'setup'; onLevels: () => void; onStudents: () => void; onSetup: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 p-3">
        <div className="font-semibold text-brand-300">Admin</div>
        <div className="ml-auto">
          <a className="btn" href="/">Zurück zum Hauptmenü</a>
        </div>
      </div>
      <div className="border-t border-neutral-800/80">
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
        </div>
      </div>
    </header>
  )
}

