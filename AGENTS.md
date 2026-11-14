# Projekt-Hinweise für Agents

## Tests & Builds
- Backend: `cd backend && npm test` (node:test, `test/*.test.js`). Tests, die Audio-Trigger auslösen, setzen `KUBA_DATA_DIR` auf ein Temp-Verzeichnis.
- Frontends (`frontend/admin|display|public`): `npm test` (node:test, `test/*.test.mjs`) und `npm run build` (Vite/rolldown).
- Lokal auf macOS: `/opt/homebrew/bin/node` verwenden (`PATH=/opt/homebrew/bin:$PATH`). Der Node aus `/Applications/Codex.app` lädt native Module (rolldown) wegen Code-Signatur nicht.
- Die eingecheckten `node_modules` der Frontends können für eine andere Plattform installiert sein; zum Bauen eine Kopie ohne `node_modules` anlegen und dort `npm ci` ausführen, statt die vorhandenen `node_modules` zu löschen.

## Konventionen
- UI-Texte in allen 9 Locales pflegen: cs, de, en, fr, gsw, hu, ja, swg, zh (admin, display, public jeweils `src/i18n/locales/*.json`).
- Reglement-Inhalt: `frontend/public/src/components/reglement/content.<lang>.js`, PDF unter `frontend/public/public/reglement/`. Word-PDFs immer über "Speichern unter → PDF" exportieren (nicht Drucken), sonst fehlen eingebettete Schriften.
- Lokaler Dev-Login (ohne `ADMIN_PASSWORD_HASH`): Benutzer `admin`, Passwort siehe `DEV_FALLBACK_PASSWORD` in `backend/src/auth/index.js`; API erwartet `Authorization: Bearer <token>`.
- Commits ohne KI-Attribution.

## Beamer: drei Displays
- Scoreboard-State `displays: { 1, 2, 3 }` (je `scoreboard` | `bracket` | `callit`, Standard 1 Spielstand, 2 Turnierbaum, 3 Tippspiel); `POST /scoreboard/display { view, display }`, ohne `display` → Display 1. `displayCallitTournamentId` gilt für alle.
- Display-App: welches Display ein Bildschirm ist, per Knopf (reihum 1→2→3, in localStorage `kuba-display-slot`) oder URL `?display=N` (`frontend/display/src/utils/displaySlot.js`).

## KO-Unentschieden: Verlängerung → Stechen
- Ablauf: Zeit abgelaufen + Gleichstand im KO-Spiel → Admin-Karte "Verlängerung" (oben im ControlTab) → 1 min Pause (nutzt `isHalftimeBreak`-Countdown, Auto-Start wie Halbzeit) → Verlängerung fest 5 min (`OVERTIME_SECONDS`; nicht aus `durationSeconds`, das "Zeit setzen" überschreibt) → bei Gleichstand Freiwurf-Stechen. Startet automatisch bei Zeitablauf/"Spiel beenden"; Audio: Pausen-Signal statt Schluss-Signal, Countdown vor Pausenende, Start-Signal, Schluss-Signal erst nach der Verlängerung.
- Backend: `backend/src/scoreboard/overtime.js` (+ `overtimeRules.js`), Zustand `state.overtime`; `startShootout` verlangt abgelaufene Verlängerung. Ergebnis-Kennzeichnung "n.V." über `overtimeSummary`/`resultSuffix` in `services/shared/shootout.js` ("n.F." hat Vorrang).
- CallIt wertet den Stand nach Verlängerung (vor Stechen), unverändert über `shootout.regularScoreA/B`.

## Tippspiel CallIt
- Backend: `backend/src/services/callit/*` (reine Punkte-Logik in `scoring.js`, Turnierdaten-Adapter in `context.js`, Sperren in `locks.js`), Routen `/api/callit` und `/api/callit-admin` (Admin-Login). Tests: `test/callitScoring.test.js`, `test/callitApi.test.js`.
- Frontend `frontend/callit` (Dev-Port 5177). Beamer-Ansicht `displayView = 'callit'` mit `displayCallitTournamentId`.
- Sonderwette `final_kickoff` (Startzeit Finale): Tipp/Ergebnis als Minuten seit Mitternacht in Europe/Berlin (`services/callit/time.js`). Ergebnis = erster Uhr-Start des Finales (Tabelle `callit_kickoffs`, erfasst in `locks.js`), Admin-Override hat Vorrang. Nächster Tipp gewinnt wie `total_baskets` (`NEAREST_BET_TYPES`).
- Socket-Clients mit `query.client = 'callit'` bekommen keinen Scoreboard-Stream, nur `callit:update`.
- DNS-A-Record `callit.kunstradbasketball.de` muss auf den Server zeigen, sonst bekommt Caddy kein Zertifikat.
