# Robotik Checklisten (Vercel / Next.js)

Ein modulares Tool für Schüler-Checklisten pro Roboter (RVR+ Sphero, Cutebot Pro, PiCar‑X). Dark-UI, Level‑Tabs, Fortschrittsbalken, Admin zum Anlegen von Schülern.

## Stack
- Next.js App Router, TypeScript, Tailwind
- Inhalte: YAML/Markdown im Ordner `checklists/` (Single Source of Truth)
- Speicherung: Vercel Postgres (optional). Fallback: lokal (nur Demo)

## Quickstart (lokal)
1. `npm install`
2. `npm run dev`
3. Öffnen: http://localhost:3000

Ohne DB werden Schüler leer angezeigt, Fortschritt wird nicht serverseitig gespeichert (nur Demo). Admin kann DB initialisieren und Schüler anlegen, wenn DB-Env gesetzt ist.

## Deployment auf Vercel
- Vercel Projekt anlegen und dieses Repo importieren
- Env Vars setzen:
  - `POSTGRES_URL` (oder `POSTGRES_URL_NON_POOLING`) aus Vercel Postgres/Neon
- Deploy starten
- Admin öffnen (`/admin`) und "Datenbank initialisieren" klicken

## Inhalte erweitern
- Neue Roboter-Checklisten anlegen unter `checklists/<robot-key>.yml` oder `.md`
- Roboterliste (`lib/robots.ts`) um `{ key, name }` ergänzen

## Architektur
- Checklisten werden aus Dateien geparst (`lib/checklist-loader.ts`) → Levels/Items
- Fortschritt pro Schüler/Roboter/Item in Tabelle `progress`
- Schülerverwaltung minimal (Tabelle `students`)

## Verzeichnisstruktur
- `app/` Seiten, API-Routen, Layout
- `components/` UI-Komponenten
- `lib/` DB, Schema, Loader
- `checklists/` Inhalte (YAML/MD)

## Hinweise
- Kein Code/Pin nötig für Schüler; Auswahl über Header
- Dark Mode standard
- Erweiterbar: weitere Item-Typen, CSV-Export, PWA, Badges
