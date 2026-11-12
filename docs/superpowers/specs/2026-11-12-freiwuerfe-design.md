# Freiwürfe erfassen + Freiwurfquote

## Ziel / Warum

Freiwürfe sollen im Spiel explizit dokumentiert werden (wer wirft, wie viele, Treffer/Fehlwurf), damit es eine echte Freiwurfquote pro Spieler und pro Team gibt. Beamer und Public zeigen eine laufende Freiwurf-Serie live, im gleichen Stil wie das Freiwurf-Stechen.

## Ziele

- Eigene Freiwurf-Karte in der Live-Steuerung (Admin): Serie starten mit Team, Werfer, Anzahl (1 oder 2, Standard 2), dann pro Wurf Treffer/Fehlwurf.
- Treffer = +1 Punkt für das Team/den Werfer.
- Optionale Kopplung an Zeitstrafe: Checkbox "Freiwürfe für Gegner" im Strafen-Formular, **Standard aus**. Wenn an: nach Buchen der Strafe wird eine Serie für das gegnerische Team angelegt (Anzahl wählbar 1/2, Standard 2; Werfer wird in der Freiwurf-Karte gewählt).
- Beamer (Display) und Public (CurrentMatchCard) zeigen die aktive Serie: Teamname, Werfer, Punkte pro Wurf (grün Treffer, rot Fehlwurf, leer offen). Optik wie `ShootoutView`.
- Freiwurfquote (Treffer/Versuche, %) pro Spieler und Team in den Public-Statistiken.
- Würfe aus dem Freiwurf-Stechen zählen ebenfalls in die Quote.

## Nicht-Ziele

- Keine eigene DB-Tabelle, keine Migration.
- Alte Spiele werden nicht nachträglich umgerechnet; ohne Versuche wird die Quote als "—" angezeigt.
- Reglement-Text (3.3 sagt "ein Freiwurf") wird nicht angepasst.
- Export-Tab, Turnier-Abschlussansichten (Display/Public) bekommen vorerst keine Freiwurf-Werte.

## Anti-Ziele

- `+1` darf **nicht** mehr implizit als Freiwurf zählen. Die Quote basiert nur auf explizit erfassten Würfen.
- Keine Verfälschung bestehender Punkte-Statistiken (Punkte, `breakdown`, Strafen bleiben wie bisher).

## Ansätze

- **A) Eigener Freiwurf-Zustand + Zähler in Spielerstats (gewählt):** aktive Serie im Scoreboard-State analog `shootout`, Zähler `freeThrowsAttempted`/`freeThrowsMade` je Stat-Eintrag. Landen automatisch im Spiel-Snapshot; Turnier-Summary aggregiert sie wie Punkte. Gleiches Muster wie Stechen.
- B) Würfe als Events im `scoringLog`, Quote daraus ableiten: verworfen, Log ist auf 200 Einträge gekappt (Datenverlust), 0-Punkte-Fehlwürfe passen nicht zur Delta-Logik.
- C) Eigene DB-Tabelle: verworfen, Mehraufwand und Fremdkörper, da alle Stats aus Snapshots kommen.

## Design

### Backend – State (`backend/src/scoreboard/`)

- Neues Feld `state.freeThrows` (Default `null`) in `createDefaultState`:
  ```
  { team: 'a'|'b', playerId: number|null, playerName: string|null,
    total: 1|2, attempts: [{ id, hit, at }], startedAt, source: 'manual'|'penalty' }
  ```
- Neues Modul `freeThrows.js` (Muster wie `shootout.js`, eigene `FreeThrowError`-Codes):
  - `startFreeThrows({ team, playerId, total = 2, source })` – Fehler, wenn schon eine **offene** Serie existiert; `total` nur 1 oder 2; Spieler muss zum Team gehören (oder `null` = Team).
  - `setFreeThrowShooter({ playerId })` – nur solange noch kein Wurf erfasst ist.
  - `recordFreeThrow({ hit })` – Fehler, wenn Serie voll. Treffer → `addPoints(team, 1, { playerId, shotType: 'free', type: 'freethrow', description: 'Freiwurf' })`. Zähler erhöhen.
  - `undoFreeThrow()` – letzten Wurf zurücknehmen inkl. Punkt und Zähler.
  - `closeFreeThrows()` – abgeschlossene Serie ausblenden; offene Serie ohne Würfe abbrechen; offene Serie mit Würfen → Fehler (erst zurücknehmen).
- Abgeschlossene Serie (`attempts.length === total`) bleibt sichtbar, bis Admin schließt oder die Spieluhr gestartet wird (`start` setzt `freeThrows = null`, wenn abgeschlossen). Eine neue Serie darf eine abgeschlossene ersetzen.
- Snapshot liefert `freeThrows` mit `status: { made, taken, done }`.
- Stat-Einträge (`createEmptyStat`, Merge in `setTeamPlayers`, `cloneStats`) bekommen `freeThrowsAttempted`, `freeThrowsMade`. Gezählt auf Team-Total-Eintrag und Spieler- bzw. Unknown-Eintrag (wie Strafen).
- Stechen: `recordShootoutAttempt` / `undoShootoutAttempt` erhöhen/verringern dieselben Zähler.
- `inferShotType(1)` liefert nicht mehr `'free'`, sondern `'single'`. `+1`/`-1` berühren die Freiwurf-Zähler nicht.
- `resetScores` setzt `freeThrows = null` (Stats werden ohnehin zurückgesetzt).
- `resultSignature` berücksichtigt Anzahl erfasster Freiwürfe, damit "gespeichert/geändert" stimmt.
- Spiel speichern ist blockiert, solange eine Serie offen ist (nicht alle Würfe erfasst) – analog offenem Stechen (`routes/scoreboard.js` Save-Check und `frontend/admin/src/utils/gameStatus.js`).

### Backend – Routen

- `POST /scoreboard/freethrows/start` `{ team, playerId, total }`
- `POST /scoreboard/freethrows/shooter` `{ playerId }`
- `POST /scoreboard/freethrows/attempt` `{ hit }`
- `POST /scoreboard/freethrows/undo`
- `POST /scoreboard/freethrows/close`
- `POST /scoreboard/penalties` akzeptiert zusätzlich `freeThrows: 0|1|2` (Default 0). Bei >0 wird nach `addPenalty` eine Serie für das **gegnerische** Team mit `playerId: null`, `source: 'penalty'` gestartet. Ist schon eine offene Serie aktiv: Strafe wird trotzdem gebucht, Response enthält Hinweis-Code (Freiwürfe nicht angelegt).
- Validierung wie bestehende Routen (Team a/b, Spieler im Kader, `total` ∈ {1,2}).

### Backend – Turnier-Summary (`services/tournaments/summary.js`)

- Spieler-Aggregat: `freeThrowsAttempted`, `freeThrowsMade` summieren; `freeThrowPct` = made/attempted oder `null`. Freiwurfversuche zählen als "Impact".
- Neue Bestenliste `leaders.topFreeThrowShooters`: mind. 2 Versuche, sortiert nach Quote, dann Treffer, dann Name; Top 15.
- Team-Stats (`createStatsEntry` / Team-Übersicht): `freeThrowsAttempted`, `freeThrowsMade`, `freeThrowPct` aus dem Team-Total-Eintrag (`isTeamTotal`) der Snapshot-`playerStats`.

### Admin (`frontend/admin`)

- `FreeThrowCard.jsx` in `control/`, eingebunden in `ControlTab.jsx` (nahe ScoreControlCard). Ohne Serie: Team, Werfer (inkl. "Ganzes Team"), Anzahl 1/2 (Standard 2), "Freiwürfe starten". Mit Serie: Werfer änderbar bis zum ersten Wurf, Punkte-Anzeige, Buttons Treffer / Fehlwurf / Zurücknehmen / Schließen.
- `PenaltyManagerCard.jsx`: Checkbox "Freiwürfe für Gegner" (aus), bei an zusätzlich Auswahl 1/2 (Standard 2).
- API-Funktionen in `utils/api.js` analog Stechen.

### Display (`frontend/display`)

- `FreeThrowPanel.jsx` neben `ShootoutPanel`, gleiche Optik (Dots), ein Teamblock mit Werfername, Slots = `total`. In `ScoreboardPage.jsx` anzeigen, wenn `freeThrows` gesetzt.

### Public (`frontend/public`)

- `FreeThrowView.jsx` in `CurrentMatchCard.jsx` analog `ShootoutView`.
- `PlayerStatsTable.jsx`: Spalten "FW" (made/attempted) und "FW-%" (sortierbar), Bestenliste "Beste Freiwurfquote".
- `TeamStatsGrid.jsx`: Kennzahl FW-%.

### i18n

- Neue Keys in allen 9 Locales (cs, de, en, fr, gsw, hu, ja, swg, zh) für admin, display, public.

### Tests

- Backend `node --test`: Serie starten/werfen/zurücknehmen/schließen, Validierungen, Punkte + Zähler, Stechen zählt in Quote, `+1` zählt nicht, Strafe mit `freeThrows` legt Serie für Gegner an, Summary-Aggregation inkl. Quote und Bestenliste.

## Dem Builder überlassen

- Genaue Texte/Übersetzungen, Styling-Details im Rahmen der Stechen-Optik.
- Platzierung der Karte im ControlTab.
- Hinweistext bei abgelehnter Serien-Anlage über Strafe.

## Eigene Entscheidungen (nicht explizit vom Nutzer)

- `+1`/`-1` bleiben als Korrektur, ohne Freiwurf-Statistik.
- Werfer pro Serie (nicht pro Wurf), änderbar bis zum ersten Wurf.
- Abgeschlossene Serie bleibt sichtbar bis Schließen oder Uhrstart.
- Offene Serie blockiert Spiel speichern.
- Bestenliste ab 2 Versuchen.
- Quote "—" bei 0 Versuchen (alte Spiele).
