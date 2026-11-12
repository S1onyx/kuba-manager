# Freiwürfe + Reglement-Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neues Reglement (Stand 12.11.2026) auf der Public-Seite + explizite Freiwurf-Serien mit Freiwurfquote.

**Architecture:** Freiwurf-Serie als eigener Scoreboard-State (`state.freeThrows`) analog `shootout`; Zähler `freeThrowsAttempted/Made` in den Stat-Einträgen, die über den Spiel-Snapshot in die Turnier-Summary laufen. Reglement-Inhalt bleibt in `frontend/public/src/components/reglement/content.<lang>.js`.

**Tech Stack:** Node/Express + `node:test` (Backend), React/Vite + react-i18next (Frontends).

**Spec:** `docs/superpowers/specs/2026-11-12-freiwuerfe-design.md`

## Global Constraints

- Anzahl Freiwürfe pro Serie: nur 1 oder 2, Standard 2.
- Kopplung an Zeitstrafe optional, Standard aus.
- `+1` zählt nicht als Freiwurf; Stechen-Würfe zählen in die Quote.
- Uhr: Serienstart pausiert laufende Uhr; nach letztem Wurf startet sie automatisch (wenn Restzeit/Nachspielzeit übrig, keine Halbzeitpause).
- Fertige Serie: 10 s nach `completedAt` clientseitig ausblenden.
- i18n: alle 9 Locales (cs, de, en, fr, gsw, hu, ja, swg, zh) in admin/display/public.
- Keine DB-Migration, keine neuen Dependencies.

## Review Focus

- Serie mit Würfen abbrechen → muss abgelehnt werden (Punkte/Stats würden sonst inkonsistent). Test in Task 3.
- Zurücknehmen eines Treffers → Punkt **und** Zähler zurück. Test in Task 3.
- Strafe mit Freiwürfen, während Serie offen → Strafe gebucht, keine zweite Serie. Test in Task 3.
- Auto-Start nach letztem Wurf bei Restzeit 0 ohne Nachspielzeit → Uhr bleibt aus. Test in Task 3.
- Alte Snapshots ohne `freeThrows*` Felder → Summary liefert 0/0 und `freeThrowPct: null`, kein NaN. Test in Task 4.

---

### Task 1: Reglement-Seite aktualisieren

**Files:**
- Replace: `frontend/public/public/reglement/reglement-kunstrad-basketball.pdf`, `Reglement Kufa Basketball.pdf` (Quelle `~/Downloads/Reglement Kufa Basketball.pdf`)
- Create: `frontend/public/public/reglement/handsignale.png` (Seite 6 des PDFs, gerendert)
- Modify: `frontend/public/src/components/reglement/content.*.js` (alle 9), `frontend/public/src/components/Reglement.jsx` (Block-Typ `image`)

- [ ] Inhalt 1:1 nach neuem PDF strukturieren: 1.1–1.4, 2.1–2.10, 3.1–3.2 (im PDF fälschlich 4.1/4.2 → auf Web korrigiert), Tippfehler "generische" → "gegnerische" auf Web korrigiert.
- [ ] `renderBody` um `{ type: 'image', src, alt }` erweitern; 3.2 Handsignale zeigt Bild.
- [ ] Übersetzungen der 8 weiteren Sprachen auf neuen Inhalt bringen.
- [ ] `cd frontend/public && npm run build` → ok. Commit.

### Task 2: Stat-Zähler + `+1` ohne Freiwurf + Stechen zählt

**Files:** Modify `backend/src/scoreboard/stateStore.js`, `backend/src/scoreboard/shootout.js`; Test `backend/test/freeThrowStats.test.js`

**Produces:** `applyFreeThrowToStats(teamKey, playerId, hit, direction = 1)` exportiert aus `stateStore.js`; Stat-Felder `freeThrowsAttempted`, `freeThrowsMade` (Team-Total + Spieler/Unknown).

- [ ] Test: `+1` via `addPoints('a', 1)` → `scoringLog.at(-1).shotType === 'single'`, Team-Total `freeThrowsAttempted === 0`.
- [ ] Test: Stechen-Treffer + Fehlwurf für Spieler 1 → Spieler `freeThrowsAttempted 2, Made 1`; Undo beides → 0/0.
- [ ] Implementieren (`createEmptyStat`, `setTeamPlayers`-Merge, `inferShotType(1) → 'single'`, Shootout-Hooks). Tests grün, Commit.

### Task 3: Freiwurf-Modul, Uhr, Routen, Strafen-Kopplung, Speichersperre

**Files:** Create `backend/src/scoreboard/freeThrows.js`; Modify `stateStore.js` (Default `freeThrows: null`, Snapshot-Status, `resultSignature`), `scoring.js` (`resetScores`), `index.js`, `routes/scoreboard.js`; Test `backend/test/freeThrows.test.js`

**Produces:** `startFreeThrows({ team, playerId, total, source })`, `setFreeThrowShooter({ playerId })`, `recordFreeThrow({ hit })`, `undoFreeThrow()`, `closeFreeThrows()`, `FreeThrowError`; Snapshot `freeThrows.status = { made, taken, done }`, `freeThrows.completedAt`.
Routen: `POST /scoreboard/freethrows/{start,shooter,attempt,undo,close}`; `POST /scoreboard/penalties` mit `freeThrows: 0|1|2` → Response = State, bei offener Serie zusätzlich `freeThrowsSkipped: true`.

- [ ] Tests: Start mit `total` 3 → Fehler; Start bei laufender Uhr → `isRunning false`; Treffer → +1 Punkt, `scoringLog.at(-1).type === 'freethrow'`; 2. Wurf → `done`, `completedAt` gesetzt, `isRunning true`; Restzeit 0 ohne Nachspielzeit → bleibt aus; Undo Treffer → Punkt + Zähler zurück; Close mit Würfen offen → Fehler; Shooter-Wechsel nach 1. Wurf → Fehler; Strafe mit `freeThrows: 2` → Serie für Gegner, `source 'penalty'`; zweite Strafe mit Freiwürfen bei offener Serie → `freeThrowsSkipped`.
- [ ] Save-Route: offene Serie → 409 `FREE_THROWS_OPEN`.
- [ ] Implementieren, Tests grün, Commit.

### Task 4: Turnier-Summary

**Files:** Modify `backend/src/services/tournaments/summary.js`, `standings.js` (`createStatsEntry`/`addMatchStats`); Test `backend/test/freeThrowSummary.test.js`

**Produces:** Spieler: `freeThrowsAttempted`, `freeThrowsMade`, `freeThrowPct` (0..1 | null); `leaders.topFreeThrowShooters` (≥2 Versuche, Quote desc, Made desc, Name); Teams: `freeThrowsAttempted`, `freeThrowsMade`, `freeThrowPct`.

- [ ] Aggregations-Helfer als reine Funktion testbar machen (Snapshot-Liste rein, Werte raus) – Test inkl. alter Snapshot ohne Felder.
- [ ] Implementieren, Tests grün, Commit.

### Task 5: Admin

**Files:** Create `frontend/admin/src/components/dashboard/control/FreeThrowCard.jsx`; Modify `ControlTab.jsx`, `PenaltyManagerCard.jsx`, `hooks/useScoreboardCore.js`, `utils/forms.js`, `utils/api.js`, `utils/gameStatus.js`, `test/gameStatus.test.mjs`, Locales.

- [ ] `gameStatus`: offene Serie → `'blocked'` (Test).
- [ ] Karte (Start: Team, Werfer, 1/2; laufend: Werfer bis 1. Wurf, Dots, Treffer/Fehlwurf/Zurück/Schließen), Strafen-Checkbox + 1/2 (Form-Felder `freeThrows: false`, `freeThrowCount: '2'`).
- [ ] `npm test && npm run build`, Commit.

### Task 6: Display + Public

**Files:** Create `frontend/display/src/components/scoreboard/FreeThrowPanel.jsx`, `frontend/public/src/components/FreeThrowView.jsx`; Modify `ScoreboardPage.jsx`, `CurrentMatchCard.jsx`, `PlayerStatsTable.jsx`, `TeamStatsGrid.jsx`, Locales.

- [ ] Hook/Helper `isFreeThrowVisible(freeThrows, now)` (sichtbar wenn offen oder `now - completedAt < 10000`) mit Test in display + public.
- [ ] Panels im Stechen-Stil, Spalten FW / FW-% + Bestenliste, Team FW-%.
- [ ] `npm test && npm run build` in beiden, Commit.

### Task 7: Abschluss

- [ ] Alle Tests + Builds, manueller Durchlauf lokal (`./start.sh`), README-Funktionsumfang ergänzen.
