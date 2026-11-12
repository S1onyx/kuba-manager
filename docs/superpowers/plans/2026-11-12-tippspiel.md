# Tippspiel „CallIt“ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tippspiel pro Turnier unter `callit.kunstradbasketball.de` mit Admin-Steuerung, Live-Ranking, Statistiken und Beamer-Ansicht.

**Architecture:** Neues Backend-Modul `services/callit/*` + `routes/callit.js` / `routes/callitAdmin.js` im bestehenden Express-Backend (sql.js), Punkte als reine Funktionen aus Tipps + Turnierdaten (`getTournamentSchedule`, `getTournamentSummary`). Neues Frontend `frontend/callit` (React/Vite), Erweiterungen in admin, display, public.

**Tech Stack:** Node 22, Express 5, sql.js, bcryptjs, Socket.IO, React 19, Vite 8, i18next, node:test.

**Spec:** `docs/superpowers/specs/2026-11-12-tippspiel-design.md`

## Global Constraints

- UI-Texte in allen 9 Locales: cs, de, en, fr, gsw, hu, ja, swg, zh; `npm run i18n:check` grün.
- Keine neuen Backend-Dependencies; Frontend nur `qrcode` (Display, nach Vetting).
- Alle SQL-Statements parametrisiert; keine Tokens/Passwörter in Logs.
- Spielstand-Tipps ganzzahlig 0–99; Nickname 3–20 Zeichen `[\p{L}\p{N} _.-]`; Passwort 8–200 Zeichen.
- Sessions 30 Tage, Token in DB nur als SHA-256.
- Punkte-Defaults: exakt 4, Differenz 3, Tendenz 2, KO-Weiterkommer 1, Multiplikator Finale 2, Joker 1 je Phasengruppe (group / ko), Underdog +1 bei ≤ 25 % und ≥ 5 Tipps; Sonder: winner 10, top_scorer 6, most_penalty_seconds 6, group_winner 3, total_baskets 5.
- Commits ohne KI-Attribution.

## Review Focus

- Tipp-Request trifft nach Anpfiff ein (Race) → 409 `CALLIT_MATCH_LOCKED`; Test in Task 3.
- Paarung ändert sich nach Tippabgabe → Tipp zählt nicht, Spiel wieder offen; Test in Task 1/3.
- KO-Spiel mit Stechen: Vergleich gegen `regularScore`, Weiterkommer gegen Endsieger; Test in Task 1.
- Spieler-Sonderwette bei Gleichstand mehrerer Topscorer → alle Treffer; Test in Task 1.
- Fremde Tipps vor Sperre über Stats/Profil-Endpunkt nicht abrufbar; Test in Task 3.

---

### Task 1: Scoring-Engine (rein)

**Files:** Create `backend/src/services/callit/settings.js`, `backend/src/services/callit/scoring.js`; Test `backend/test/callitScoring.test.js`

**Produces:**
- `DEFAULT_SETTINGS`, `normalizeSettings(raw) -> Settings`
- `tendency(home, away) -> 'home'|'draw'|'away'`
- `scoreMatchTip(tip, result, ctx) -> { base, level: 'exact'|'diff'|'tendency'|'miss', koBonus, underdog, multiplier, joker, total }`
- `matchMultiplier(match, settings)`; `phaseGroupOf(match) -> 'group'|'ko'`
- `scoreSpecialTip(betKey, value, outcome, settings) -> number`
- `buildRanking(participants, perUser) -> rows` (Sortierung Spec 6.4, geteilte Plätze)

Tests: alle Stufen, KO-Bonus nur bei X-Tipp, Multiplikator × Joker, Underdog-Schwelle und Mindestanzahl, Ties bei Sonderwetten, Gesamtkörbe nächster Wert inkl. Gleichstand, Ranking-Tiebreaks.

### Task 2: Schema + Auth

**Files:** Modify `backend/src/db/schema.js`; Create `backend/src/services/callit/db.js`, `backend/src/services/callit/auth.js`; Test `backend/test/callitAuth.test.js`

**Produces:** Tabellen laut Spec §8; `registerUser`, `loginUser`, `resolveSession`, `logoutSession`, `deleteUser`, `requireCallitUser`, `optionalCallitUser`, Rate-Limits.

### Task 3: Service + Routen + Locks + Socket

**Files:** Create `backend/src/services/callit/index.js`, `locks.js`, `stats.js`, `backend/src/routes/callit.js`, `backend/src/routes/callitAdmin.js`; Modify `backend/src/index.js`, `backend/src/scoreboard/stateStore.js` (DISPLAY_VIEWS + `displayCallitTournamentId`), `backend/src/scoreboard/display.js`, `backend/src/routes/scoreboard.js`; Test `backend/test/callitApi.test.js`

API laut Spec §9. Socket-Event `callit:update`.

### Task 4: Frontend `frontend/callit`

Neues Vite-Projekt, Seiten Login, Turnierliste/Beitritt, Tippen, Ranking, Stats, Ich; PWA-Manifest; Tests für Utils.

### Task 5: Admin-Tab „Tippspiel“

`frontend/admin/src/components/dashboard/CallitTab.jsx` + Hook `useCallitAdmin.js` + API-Funktionen, Tab in `CONTROL_TABS`, Display-Option `callit`.

### Task 6: Beamer + Public

Display-Seite `CallitPage.jsx`, QR-Code; Public: Karte auf Hauptseite + Banner Turnierdetail.

### Task 7: Infrastruktur + Doku

Caddy, docker-compose, Workflow-Matrix, `start.sh`, README, AGENTS.md.

### Task 8: Review + Verifikation

Mehrere Review-Subagents (Backend/Security, Frontend/UX, i18n/Infra), Fixes, alle Tests + Builds, PR.
