# RVR+ Blockprogrammierung – Checkliste für Schüler:innen  
*(Sphero RVR+ mit Sphero Edu – Block-Programmierung)*

> **So benutzt du diese Checkliste:**  
> – Hake ab, was du **selbstständig** geschafft hast.  
> – Du darfst die Reihenfolge ändern.  
> – Schreibe deine eigenen Ideen unten jeweils dazu.

---

## Level 0 – Start & Verbindung

**Ziel:** RVR+ verbinden, ausrichten und ein erstes Programm starten.

- [ ] Ich habe den **RVR+ mit Sphero Edu verbunden** und kann ihn in der App sehen.  
- [ ] Ich weiß, wie man den RVR+ **ausrichtet / „aimt“**, sodass **0° nach vorne** zeigt.  
- [ ] Ich habe ein neues Programm im Modus **„Blocks“** erstellt.  
- [ ] Ich habe ein erstes Programm geschrieben, das z.B. die **LED-Farbe ändert** oder eine kurze Bewegung macht.

> Meine eigene erste Aktion:  
> `________________________________________`

---

## Level 1 – Bewegung & Sequenzen

**Ziel:** Den RVR+ gezielt fahren lassen (vorwärts, drehen, stoppen).  
Du nutzt vor allem Bewegungs-Blöcke wie **„Roll“** (Geschwindigkeit, Richtung, Dauer).

**Aufgaben:**

- [ ] **Gerade Fahrt**  
  RVR+ fährt bei Programmstart:
  - geradeaus (Heading z.B. 0°),  
  - mit einer von dir gewählten **Geschwindigkeit**,  
  - für eine bestimmte **Zeit**,  
  - und bleibt dann stehen.

- [ ] **Vor & Zurück**  
  RVR+ fährt:
  - zuerst **vorwärts**,  
  - dann **rückwärts** (Heading z.B. 180°),  
  - ohne dass du manuell lenkst (nur Programm).

- [ ] **Einfache Form**  
  RVR+ fährt eine **einfache Figur**, z.B. ein „L“ oder ein „S“, nur mit mehreren „Roll“-Blöcken.

> Meine eigene Bewegungs-Idee (z.B. Slalom um Hindernisse):  
> `________________________________________`

---

## Level 2 – Schleifen (Wiederholen)

**Ziel:** Wiederholungen nutzen, statt immer die gleichen Blöcke zu kopieren.  
Du nutzt Blöcke wie **„wiederhole X mal“** oder **„wiederhole fortlaufend“**.

**Aufgaben:**

- [ ] **Quadrat mit Schleife**  
  RVR+ fährt ein **Quadrat**, indem du:
  - eine Bewegung (vorwärts + drehen) programmierst  
  - und diese Abfolge mit `wiederhole 4-mal` wiederholst  
  - (nicht viermal copy-paste).

- [ ] **Dauerpatrouille**  
  RVR+ fährt im Kreis oder hin und her, solange das Programm läuft:
  - Du nutzt eine **Endlosschleife** (`wiederhole fortlaufend`).  
  - Er macht immer wieder dieselbe Bewegungsfolge.

- [ ] **Eigene Figur mit Schleife**  
  Ich habe eine **eigene Figur** (z.B. Dreieck, Acht, Zickzack) programmiert, die mit einer Schleife läuft.

> Welche Figur ich gemacht habe:  
> `________________________________________`

---

## Level 3 – LEDs & visuelles Feedback

**Ziel:** LEDs nutzen, um zu sehen, was der Roboter „denkt“ oder in welchem Zustand er ist.  
RVR+ hat mehrfarbige LEDs (z.B. vorne, hinten).

**Aufgaben:**

- [ ] **Start-Signal**  
  Bei Programmstart:
  - RVR+ zeigt eine **Startfarbe** (z.B. grün),  
  - dann beginnt er mit der Bewegung.

- [ ] **LEDs abhängig von der Bewegung**  
  Während das Programm läuft:
  - Wenn RVR+ **geradeaus fährt** → LEDs haben eine bestimmte Farbe,  
  - wenn er **dreht** → LEDs haben eine andere Farbe.

- [ ] **Eigenes Status-Farb-System**  
  Ich habe mir **selbst überlegt**, was meine LED-Farben bedeuten (z.B. rot = Gefahr, blau = Fahrt, grün = fertig) und das im Programm umgesetzt.

> Meine LED-Regeln:  
> `________________________________________`

---

## Level 4 – Sensoren lesen (Farbe, Licht, Bewegung)

**Ziel:** Sensorwerte sichtbar machen und im Programm verwenden.  
Wichtige Sensoren beim RVR+:  
- **Farbsensor** (unten) – erkennt Farben/Untergrund  
- **Lichtsensor** – misst Umgebungshelligkeit  
- **Bewegungssensor / IMU** – erkennt Neigung / Beschleunigung

**Aufgaben (mindestens 2 davon erledigen):**

- [ ] **Farbsensor → LED-Farbe**  
  - RVR+ steht über verschieden farbigen Flächen (z.B. Papier).  
  - Dein Programm liest die erkannte **Farbe** aus.  
  - Die **LEDs leuchten in der erkannten Farbe**.

- [ ] **Lichtsensor → hell/dunkel**  
  - Dein Programm liest den **Lichtwert**.  
  - Bei **hell** zeigt RVR+ z.B. eine helle Farbe,  
  - bei **dunkel** eine dunkle Farbe oder er stoppt.

- [ ] **Neigung / Bewegung → Reaktion**  
  - Dein Programm nutzt z.B. **Neigung oder Bewegung** (Pitch/Roll/Beschleunigung):  
    - Wenn du den RVR+ anhebst oder die Fahrbahn kippst,  
    - ändert sich das Verhalten (z.B. LEDs, Bewegung, Sound falls vorhanden).

- [ ] **Eigener Sensor-Versuch**  
  Ich habe ein **eigenes Experiment** mit mindestens einem Sensor gebaut (z.B. „Lärm-Alarm“ mit Lichtwechsel, „Neigungs-Warnung“, etc.).

> Welcher Sensor + Idee:  
> `________________________________________`

---

## Level 5 – Bedingungen (Wenn … dann …)

**Ziel:** RVR+ reagiert selbstständig auf seine Umgebung.  
Du nutzt **If-Blöcke** wie `wenn … dann …` und `sonst`.

**Aufgaben (mindestens 2 davon erledigen):**

- [ ] **Farbe als Stopp-Signal**  
  - RVR+ fährt los.  
  - `wenn` der Farbsensor z.B. **rot** erkennt,  
    - **dann** stoppt er und ändert die LED-Farbe.

- [ ] **Hell/Dunkel beeinflusst das Fahrverhalten**  
  - `wenn` es **dunkel** ist (Lichtsensor unter einem Wert),  
    - fährt RVR+ **langsamer** oder bleibt stehen,  
  - `sonst` fährt er **schneller**.

- [ ] **Neigungs-Schutz**  
  - `wenn` der RVR+ zu stark geneigt wird oder eine starke Beschleunigung spürt,  
    - stoppt er oder wechselt in einen „Sicherheitsmodus“ (z.B. LEDs rot, langsame Fahrt).

- [ ] **Wenn–Dann–Sonst mit zwei Varianten**  
  - Du baust ein If–Else, z.B.:  
    - `wenn` Bodenfarbe = blau → links drehen  
    - `sonst` → rechts drehen.

> Meine eigene Wenn-Dann-Idee:  
> `________________________________________`

---

## Level 6 – Eigene Variablen („Gedächtnis“)

**Ziel:** RVR+ merkt sich etwas: Zähler, Runden, Modi.  
Du nutzt **Variablen** (selbst erstellte Namen) und veränderst sie im Programm.

**Aufgaben:**

- [ ] **Variable anlegen**  
  - Ich habe eine Variable erstellt, z.B. `runden`, `kollisionen`, `modus` oder `speed`.

- [ ] **Startwert setzen**  
  - Im Start-Block setze ich die Variable auf einen Startwert, z.B.  
    - `setze runden auf 0`.

- [ ] **Variable verändern**  
  - Im Programm wird die Variable verändert, z.B.:  
    - `ändere runden um 1`,  
    - oder `setze modus auf 1`.

- [ ] **Variable sichtbar nutzen**  
  - Ich nutze die Variable in:
    - einer **If-Bedingung** (z.B. `wenn runden = 3 dann stoppe`),  
    - oder zur **Geschwindigkeitsteuerung** (z.B. `speed` für Roll-Blöcke),  
    - oder ich zeige sie irgendwie an (z.B. LED-Signale, Ausgabe in der App).

- [ ] **Kleines Projekt mit Variable**  
  Ich habe ein **Mini-Projekt** gemacht, in dem eine Variable wirklich Sinn ergibt, z.B.:
  - RVR+ zählt, wie oft er eine „Runde“ fährt,  
  - oder wie oft er auf ein Signal reagiert,  
  - oder er hat zwei Fahrmodi (`modus`: 0 = vorsichtig, 1 = schnell).

> Meine Variable + Projekt:  
> `________________________________________`

---

## Level 7 – IR-Kommunikation (Bonus)

**Ziel:** RVR+ nutzt Infrarot, um mit einem anderen Roboter zu kommunizieren (z.B. Leader/Follower).  
Hinweis: IR beim RVR+ ist vor allem für **Kommunikation zwischen Robotern**, nicht für genaue Hindernis-Abstände gedacht.

**Aufgaben (nur wenn ein zweiter RVR/BOLT o.Ä. verfügbar ist):**

- [ ] Ich habe ein Programm, in dem **Roboter A** ein IR-Signal sendet.  
- [ ] Ich habe ein Programm, in dem **Roboter B** das IR-Signal empfängt.  
- [ ] Roboter B ändert sein Verhalten, wenn er das Signal empfängt (z.B. folgt er, fährt los, ändert LEDs).

> Meine IR-Idee (z.B. „Follower“, „Stopp-Signal“):  
> `________________________________________`

---

## Level 8 – Eigenes Projekt

**Ziel:** Du kombinierst mehrere Dinge, die du gelernt hast.

**Anforderungen an dein Projekt:**

- [ ] Nutzt **Bewegung** und mindestens **eine Schleife**.  
- [ ] Nutzt **mindestens einen Sensor** (Farbe, Licht oder Bewegung).  
- [ ] Enthält **mindestens eine If-Bedingung**.  
- [ ] Nutzt **optional** eine eigene Variable (Bonus).  
- [ ] Du kannst erklären:
  - Was soll RVR+ tun?  
  - Welche Sensoren nutzt er?  
  - Welche Entscheidungen trifft er?

> Titel meines Projekts:  
> `________________________________________`  

> Kurzbeschreibung in 2–3 Sätzen:  
> `________________________________________`  
> `________________________________________`

---
