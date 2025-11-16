# Robotik (Vercel / Next.js)

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

### Datenbank verbinden (Neon/Vercel Postgres)

1) `.env.local` anlegen (lokal) und Verbindungsdaten eintragen:

```
POSTGRES_URL=postgresql://<user>:<pass>@<host>/<db>?sslmode=require
# optional
POSTGRES_URL_NON_POOLING=...
# optional – falls nur vorhanden, wird automatisch genutzt
DATABASE_URL=...
```

2) App starten (`npm run dev`), zu `/admin` gehen und „Datenbank initialisieren“ klicken.

3) Einen Schüler anlegen, im Header auswählen und in der Checkliste abhaken/Antworten eingeben – Speicherung erfolgt serverseitig.

## Deployment auf Vercel
- Vercel Projekt anlegen und dieses Repo importieren
- Env Vars setzen:
  - `POSTGRES_URL` (oder `POSTGRES_URL_NON_POOLING`) aus Vercel Postgres/Neon
  - Alternativ `DATABASE_URL` – wird automatisch als Fallback verwendet
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
