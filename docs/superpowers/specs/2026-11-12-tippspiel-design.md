# Tippspiel „CallIt“ – Design

Stand: 2026-11-12 · Ziel: einsatzbereit für das nächste Turnier (2–6 Wochen)

## 1. Intent

Zuschauer und Teams sollen pro Turnier ein Tippspiel spielen: Spielstände tippen, Sonderwetten abgeben, live im Ranking mitfiebern – fast ausschließlich am Handy. Das Ranking soll per Knopfdruck auf dem Beamer in der Halle laufen und die Stimmung anheizen. Der Admin steuert alles (an/aus, Punkte, Sperren, Nutzer) über das bestehende Admin-Panel.

Das ersetzt die Idee „Wettsystem mit Coins“ aus dem README (keine virtuelle Währung, keine Admin-Zuteilung von Coins).

## 2. Ziele / Nicht-Ziele / Anti-Ziele

**Ziele**
- Eigene Oberfläche unter `https://callit.kunstradbasketball.de`, mobil-first.
- Login per Nickname + Passwort; ein Konto für alle Turniere, Beitritt pro Turnier.
- Tippen auf jedes Spiel, dessen beide Teams feststehen, bis zum Anpfiff.
- Punkte für Tendenz, Differenz, exaktes Ergebnis; Joker; Underdog-Bonus; KO-Weiterkommer.
- Sonderwetten: Turniersieger, Topscorer (Punkte), meiste Strafsekunden, Gruppensieger, Gesamtkörbe.
- Rankings: gesamt + Kategorien, live während laufender Spiele.
- Statistiken pro Spiel und gesamt (Verteilung, Quoten, Heatmap, Trefferquoten).
- Beamer-Ansicht des Rankings per Knopf im Admin.
- Prominenter Einstieg auf der Hauptseite (`kunstradbasketball.de`) und in der Turnierseite.
- Alle Werte im Admin änderbar.

**Nicht-Ziele (vorerst)**
- Echtgeld, Coins, Preise-Abwicklung.
- E-Mail, Push-Benachrichtigungen, Social Login, Chat.
- „Die Masse“ als virtueller Tipper, Awards, Finalpaarung-Wette.
- Service Worker / Offline-Modus.

**Anti-Ziele (wäre ein Fehlschlag, auch wenn es „funktioniert“)**
- Tipp nach Anpfiff noch möglich (auch nicht über die API).
- Fremde Tipps vor der Sperre einsehbar → Abschreiben.
- Ranking auf Beamer und Handy zeigt unterschiedliche Stände.
- Server-Neustart am Turniertag loggt alle Tipper aus.
- Bedienung am Handy fummelig (kleine Buttons, Tastatur für Zahlen, Scroll-Chaos).

## 3. Rahmenbedingungen (Ist-Zustand)

- Backend: Express 5 + sql.js (SQLite-Datei), Socket.IO, ES-Module. Schema in `backend/src/db/schema.js` (idempotentes `CREATE TABLE IF NOT EXISTS` + `ensureColumn`).
- Spielplan: `tournament_schedule` (Schlüssel `tournament_id` + `code`, `phase`, `stage_label`, `scheduled_at`, `home_slot`/`away_slot` bzw. `home_source`/`away_source` für KO-Platzhalter). Auflösung der Paarungen in `services/tournaments/structure.js`.
- Ergebnisse: `games` mit `schedule_code`; der neueste Eintrag je Code zählt (wie `structure.js`). Freiwurf-Stechen addiert Punkte auf den Spielstand; `snapshot_json.$.shootout.regularScoreA/B` enthält den Stand nach regulärer Zeit.
- Live-Zustand: `scoreboard/stateStore.js` (`tournamentId`, `scheduleCode`, `isRunning`, `scoreA/B`, `playerStats`), Änderungen über `addSubscriber`/`notifySubscribers`, an Clients als `scoreboard:update`.
- Spielerstatistik: `points`, `scores`, `penaltySeconds` je Spieler (Aggregation in `services/tournaments/summary.js`).
- Beamer: `DISPLAY_VIEWS = ['scoreboard', 'bracket']`, umgeschaltet per `POST /api/scoreboard/display`.
- Admin-Auth: Bearer-Token, Sessions nur im Speicher (`backend/src/auth/index.js`), Rate-Limit-Muster vorhanden.
- Frontends: React 19 + Vite 8 + i18next, 9 Locales (cs, de, en, fr, gsw, hu, ja, swg, zh), Tests mit `node:test`.
- Deployment: je Frontend ein nginx-Image, Caddy-Block je Subdomain, GitHub-Workflow baut Images per Matrix.
- Typische Spielstände sind niedrig (2:0, 4:0, 0:0, selten zweistellig) → exakte Treffer sind relativ häufig.

## 4. Approaches

| Ansatz | Beschreibung | Trade-off |
|---|---|---|
| **A – eigenes Frontend (gewählt)** | `frontend/callit`, eigener Container, Caddy-Block `callit.kunstradbasketball.de`; Backend-Modul im bestehenden Backend | Saubere Trennung, eigenes mobiles UX, Public-Bundle bleibt schlank. Kostet einen weiteren Container + Pipeline-Eintrag + DNS-Eintrag. |
| B – Tab im Public | Caddy mappt `callit.*` auf Public-Frontend, Hostname-Weiche | Weniger Infrastruktur, aber Login/Tipp-Logik bläht Public für alle auf, vermischt Zuständigkeiten. |
| C – separates Backend | Eigener Service mit eigener DB | Unnötig: braucht Live-Zustand und Ergebnisse direkt aus dem bestehenden Backend. |

Entscheidung: **A** (vom Nutzer gewählt), plus präsenter Link auf der Hauptseite.

## 5. Entschiedene Punkte (vom Nutzer)

- Eigenes Frontend, präsenter Link auf der Public-Hauptseite.
- KO-Spiele: Tipp = Stand nach regulärer Zeit (Unentschieden erlaubt). Bei Unentschieden-Tipp zusätzlich Weiterkommer wählen → Bonus.
- Fremde Tipps erst nach Sperre sichtbar; vorher nur Anzahl abgegebener Tipps.
- Extras: Joker, Underdog-Bonus, Sonderwetten Gruppensieger + Gesamtkörbe. **Ohne** Finalpaarung, ohne „Masse“/Awards.
- „Meiste Körbe“ = meiste **Punkte** (wie Topscorer-Liste im Public).
- Punkte-Defaults wie unten; alles im Admin änderbar.

## 6. Spielregeln & Punkte

### 6.1 Spieltipps

Basispunkte (nicht kumulativ, höchste zutreffende Stufe zählt):

| Stufe | Default |
|---|---|
| Exakt (Stand nach regulärer Zeit) | 4 |
| Richtige Differenz (inkl. Unentschieden mit falschem Stand) | 3 |
| Richtige Tendenz (Sieg A / Unentschieden / Sieg B) | 2 |
| Falsch | 0 |

Zusätze:
- **KO-Weiterkommer** (nur KO-/Platzierungsspiele, nur bei Unentschieden-Tipp und tatsächlichem Remis nach regulärer Zeit): +1, wenn gewähltes Team weiterkommt/gewinnt (Sieger inkl. Stechen).
- **Phasen-Multiplikator**: Default Gruppe ×1, KO ×1, Platzierung ×1, Finale ×2. Finale = Spiel der letzten KO-Runde um Platz 1.
- **Joker**: Default 1 Joker pro Phasengruppe (Gruppenphase; KO inkl. Platzierung). Verdoppelt die Spielpunkte. Setzen/Umsetzen nur solange das betroffene Spiel (und das bisherige Joker-Spiel) nicht gesperrt ist.
- **Underdog-Bonus**: +1, wenn Tendenz richtig und höchstens 25 % aller Tipps dieses Spiels dieselbe Tendenz hatten. Nur wenn das Spiel mindestens 5 Tipps hat (kleine Stichproben verzerren).

Formel je Spiel:
```
spielpunkte = (basis + ko_bonus) × phasen_multiplikator × (joker ? 2 : 1) + underdog_bonus
```

### 6.2 Sonderwetten

| Wette | Default-Punkte | Auswertung |
|---|---|---|
| Turniersieger | 10 | Platz 1 der Endplatzierung |
| Topscorer | 6 | Spieler mit den meisten Punkten im Turnier |
| Meiste Strafsekunden | 6 | Spieler mit den meisten Strafsekunden |
| Gruppensieger (je Gruppe) | 3 | Platz 1 der Gruppentabelle |
| Gesamtkörbe | 5 | Summe aller Punkte des Turniers (reguläre Zeit, ohne Stechen); wer am nächsten liegt |

- Gleichstand (mehrere Topscorer, mehrere am nächsten an Gesamtkörben): alle Treffer erhalten volle Punkte.
- Frist: Default alle Sonderwetten bis Anpfiff des ersten Turnierspiels; je Wette im Admin auf festen Zeitpunkt änderbar.
- Spielerauswahl: nur Spieler aus Kadern der Turnierteams.
- Auswertung automatisch aus Turnierdaten; Admin kann Ergebnis je Wette manuell überschreiben.
- Vorläufige Auswertung während des Turniers (aktueller Topscorer etc.) fließt ins Live-Ranking als „vorläufig“ – im Ranking getrennt ausweisbar.

### 6.3 Fairness-Überlegung

Bei ~20 Spielen: max. ~80 Spielpunkte (+Joker/Finale) vs. ~30–35 Sonderpunkte → Sonderwetten ≈ 25–30 %, spannend, aber nicht allein entscheidend. Exakt nur knapp über Differenz, weil niedrige Stände exakte Treffer häufig machen. Spätere Beitritte: verpasste Spiele = 0 Punkte.

### 6.4 Ranking-Reihenfolge

Gesamtpunkte ↓ → Anzahl exakt ↓ → Anzahl Differenz ↓ → Anzahl Tendenz ↓ → Sonderpunkte ↓ → geteilter Platz.

- Disqualifizierte Teilnehmer erscheinen nicht im Ranking; gesperrte Nutzer können sich nicht anmelden.
- Rangveränderung (↑↓) = Vergleich mit dem Ranking vor dem aktuell laufenden bzw. zuletzt beendeten Spiel.
- Teilnehmer ohne einen einzigen Tipp erscheinen im Ranking mit 0 Punkten am Ende.

## 7. Sperren

Ein Spiel ist gesperrt, sobald eine der Bedingungen eintritt (serverseitig geprüft, persistiert):
1. **Anpfiff**: Live-Zustand hat `tournamentId` + `scheduleCode` dieses Spiels und `isRunning` wird erstmals `true`.
2. **Ergebnis gespeichert**: `games`-Eintrag mit diesem `schedule_code` existiert.
3. **Geplante Zeit** (optional, Default **aus**, weil Turniere Verzug haben): `scheduled_at` erreicht.
4. **Manuell** durch Admin.

Admin kann ein Spiel entsperren (z. B. falscher Code geladen); das Override hebt Anpfiff-, Live- und Uhrzeit-Sperre auf und gilt, bis das Scoreboard ein anderes Spiel lädt. Ein gespeichertes Ergebnis sperrt immer. Zusätzlich wird bei jedem Tipp synchron geprüft, ob die Uhr für dieses Spiel gerade läuft.

Tippbar nur wenn: Tippspiel für Turnier aktiv, Nutzer Teilnehmer und nicht gesperrt, beide Teams des Spiels aufgelöst, Spiel nicht gesperrt.

**Paarungsänderung**: Tipp speichert `home_team_id`/`away_team_id`. Ändert sich die Paarung vor der Sperre (z. B. korrigiertes Gruppenergebnis), wird der Tipp ungültig und das Spiel erscheint wieder als „offen“ mit Hinweis.

## 8. Datenmodell (neue Tabellen, Präfix `callit_`)

```
callit_users           id, nickname (UNIQUE COLLATE NOCASE), password_hash, is_banned, created_at, last_login_at
callit_sessions        token_hash (PK, sha256), user_id, created_at, expires_at
callit_tournaments     tournament_id (PK), enabled, registration_open, join_code (NULL = ohne Code),
                       settings_json, rules_text, updated_at
callit_participants    id, tournament_id, user_id, joined_at, is_disqualified, UNIQUE(tournament_id, user_id)
callit_tips            id, tournament_id, user_id, schedule_code, score_home, score_away,
                       advance ('home'|'away'|NULL), is_joker, home_team_id, away_team_id,
                       created_at, updated_at, UNIQUE(tournament_id, user_id, schedule_code)
callit_locks           tournament_id, schedule_code, state ('locked'|'unlocked'), reason, changed_at,
                       PK(tournament_id, schedule_code)
callit_special_tips    tournament_id, user_id, bet_key, value_json, updated_at, UNIQUE(tournament_id, user_id, bet_key)
callit_special_results tournament_id, bet_key, value_json, updated_at, PK(tournament_id, bet_key)  -- nur manuelle Overrides
```

`bet_key`: `winner`, `top_scorer`, `most_penalty_seconds`, `group_winner:<stage_label>`, `total_baskets`.

`settings_json` enthält Punkte, Multiplikatoren, Joker-, Underdog-, Sonderwetten- und Sperr-Optionen; fehlende Werte = Defaults aus Code.

**Punkte werden nicht gespeichert**, sondern bei Bedarf aus Tipps + Ergebnissen berechnet (reine Funktionen, gecacht pro Turnier-Version). Ergebniskorrekturen wirken damit automatisch und Beamer/Handy sind immer konsistent.

## 9. Backend

Neue Module:
- `services/callit/scoring.js` – reine Funktionen: Spielpunkte, Sonderwetten, Ranking, Kategorien. Kern der Tests.
- `services/callit/stats.js` – Verteilungen, Quoten, Heatmap, Profile.
- `services/callit/locks.js` – Sperrlogik; registriert sich als Subscriber am `stateStore` und persistiert Anpfiff-Sperren.
- `services/callit/auth.js` – Registrierung, Login, DB-Sessions (30 Tage, Token nur als SHA-256 gespeichert), Rate-Limit pro IP+Nickname und Registrierungen pro IP, Middleware `requireCallitUser`.
- `services/callit/index.js` – Teilnahme, Tipps, Sonderwetten, Admin-Funktionen.
- `routes/callit.js` (öffentlich/Nutzer) und `routes/callitAdmin.js` (hinter `requireAdmin`).

Validierung: Spielstände ganzzahlig 0–99, Nickname 3–20 Zeichen (Buchstaben inkl. Umlaute, Ziffern, Leerzeichen, `_-.`), Passwort min. 8 Zeichen, bcrypt (vorhandenes `bcryptjs`). Alle SQL-Statements parametrisiert. Fehlermeldungen generisch mit `code`.

### API (Auszug)

Nutzer (`/api/callit`):
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /me`, `DELETE /me` (Konto löschen)
- `GET /tournaments` – Turniere mit aktivem Tippspiel
- `GET /tournaments/:id` – Regeln, öffentliche Settings, eigene Teilnahme, Sonderwetten-Optionen
- `POST /tournaments/:id/join` `{ joinCode? }`
- `GET /tournaments/:id/matches` – alle Spiele mit Status (offen/gesperrt/beendet/Teams unklar), eigenem Tipp, Tipp-Anzahl, Stats wenn gesperrt
- `PUT /tournaments/:id/tips/:code` `{ scoreHome, scoreAway, advance?, joker? }`
- `PUT /tournaments/:id/specials/:betKey` `{ value }`
- `GET /tournaments/:id/ranking?category=` – öffentlich (ohne Login), inkl. Live-Flag und Rangveränderung
- `GET /tournaments/:id/matches/:code/stats` – nur nach Sperre
- `GET /tournaments/:id/users/:userId` – Profil, Tipps nur gesperrter Spiele

Admin (`/api/callit-admin`, `requireAdmin`):
- `GET/PUT /tournaments/:id` – aktivieren, Anmeldung offen/zu, Beitrittscode, Settings, Regel-/Preistext
- `GET /tournaments/:id/participants`, `PATCH /users/:id` (umbenennen, sperren), `POST /users/:id/reset-password` (einmalig angezeigtes Temp-Passwort), `DELETE /tournaments/:id/participants/:userId`, `DELETE /users/:id`
- `POST /tournaments/:id/matches/:code/lock|unlock`
- `GET /tournaments/:id/matches/:code/tips` – alle Tipps (auch vor Sperre, nur Admin)
- `PUT/DELETE /tournaments/:id/specials/:betKey/result` – Override
- `GET /tournaments/:id/export.csv`

Socket: Event `callit:update` `{ tournamentId, version, live }` bei Tipp-Abgabe (nur Zähler), Sperre, Ergebnis, Live-Spielstandänderung (gedrosselt ≤ 1/s). Clients laden daraufhin nach. Keine Tipps im Socket-Payload.

Beamer: `DISPLAY_VIEWS` um `callit` erweitern.

## 10. Frontend `frontend/callit`

Stack wie `frontend/public` (React 19, Vite, i18next, socket.io-client, Hash-Routing). Dev-Port 5177. Dockerfile analog Public.

Navigation (unten fixiert, große Touch-Ziele):
- **Tippen** – Liste der Spiele gruppiert nach Phase/Zeit; Banner „X Tipps offen · nächstes Spiel in mm:ss“; Karten mit Teams, Stepper +/– je Team (kein Tastatur-Zwang), Auto-Speichern mit Statusanzeige, Joker-Schalter, Weiterkommer-Auswahl bei KO-Unentschieden, Status-Chip (offen/gespeichert/gesperrt/LIVE/beendet + erzielte Punkte). Filter „nur offene“. Sonderwetten als eigener Abschnitt oben, solange offen.
- **Ranking** – Kategorien: Gesamt, Spiele, Sonderwetten, Exakt-König, Underdog-König, je Phase. Eigener Platz hervorgehoben und angepinnt. LIVE-Badge + ↑↓ während laufendem Spiel.
- **Stats** – je Spiel: Tendenzverteilung (Balken %), Quote = 1/Anteil, Top-Ergebnisse, Durchschnittstipp, Heatmap; nach Spielende: Treffer je Stufe, Namen der exakten Treffer, „Nur X % hatten das“; live: „Wenn's so bleibt“. Gesamt: Verteilung Sonderwetten inkl. Quoten, beste Trefferquoten, Optimisten/Pessimisten.
- **Ich** – Profil, eigene Statistiken, Punkteverlauf, Logout, Konto löschen, Sprache.

Login/Registrierung als Vollbild-Formular, Token in `localStorage`. Deep-Link `#/t/:id` → nach Login direkt Beitritt. PWA-Manifest + Icons (Homescreen), kein Service Worker.

## 11. Admin-Panel

Neuer Tab „Tippspiel“ in `CONTROL_TABS`, Turnierauswahl wie bestehende Tabs:
- Aktivieren, Anmeldung offen/zu, Beitrittscode, Regel-/Preistext.
- Punkte, Multiplikatoren, Joker, Underdog, Sonderwetten (an/aus, Punkte, Frist), Sperre zur geplanten Zeit.
- Spielliste mit Sperrstatus, Tipp-Anzahl, Sperren/Entsperren, Tipps einsehen.
- Sonderwetten: automatische Auswertung + Override.
- Teilnehmer: Suche, umbenennen, Passwort zurücksetzen, sperren/disqualifizieren, entfernen.
- Ranking-Vorschau, CSV-Export.
- Button „Ranking auf Beamer“ / „Zurück zum Scoreboard“.

## 12. Beamer (`frontend/display`)

Neue Seite für `displayView === 'callit'`: Top 10 groß, LIVE-Badge und Rangpfeile während laufendem Spiel, QR-Code + URL zum Mitmachen, Laufband mit Highlights („3 Tipper exakt bei A–B“). Turnier: Admin-Button übergibt `tournamentId`, im Live-Zustand als `displayCallitTournamentId` gehalten (Live-`tournamentId` ist zwischen Spielen evtl. leer). QR-Code über Bibliothek `qrcode` (vor Aufnahme Dependency-Vetting).

## 13. Public (`frontend/public`)

- Hauptseite/Overview: auffällige Karte „Tippspiel – jetzt mitmachen“ für Turniere mit aktivem Tippspiel (Link auf `callit…/#/t/:id`), inkl. aktueller Top 3.
- Turnierdetailseite: Banner + Link.
- Public-API liefert dafür Flag `callitEnabled`.

## 14. Infrastruktur

- Caddy: Block `callit.kunstradbasketball.de` (gleiche Header/Proxys wie Public) + HTTP-Redirect-Liste.
- `docker-compose.yml`: Service `callit-frontend`; Workflow-Matrix: Image `kuba-callit`.
- `start.sh`: Dev-Server Callit.
- DNS-A-Record `callit` → Server (manuell durch Nutzer).
- README/AGENTS.md aktualisieren.

## 15. i18n

Alle neuen Texte in allen 9 Locales für callit, admin, display, public; `i18n:check`-Skript analog Public.

## 16. Tests

- Backend `node:test`: Scoring (alle Stufen, KO-Bonus, Multiplikator, Joker, Underdog-Schwelle/Mindestanzahl, Gleichstände, Sonderwetten inkl. Ties), Sperrlogik (Anpfiff, Ergebnis, Override), API (Auth, Tipp nach Sperre abgelehnt, Sichtbarkeit vor Sperre, Paarungsänderung).
- Frontends `node:test` für Utils (Countdown, Quoten, Formatierung), `npm run build` aller Frontends.

## 17. Calls des Designers (vom Nutzer prüfen)

- Ranking und Nicknames öffentlich sichtbar ohne Login (nötig für Beamer/Public).
- Sonderwetten-Frist für alle Wetten Default = Anpfiff erstes Turnierspiel.
- Sperre zur geplanten Zeit Default aus (Verzug); Sperre bei Anpfiff ist maßgeblich.
- Joker: 1 für Gruppenphase, 1 für KO-Phase.
- Underdog: ≤ 25 %, min. 5 Tipps, Bonus nicht multipliziert.
- Gesamtkörbe ohne Freiwurf-Stechen.
- Beitrittscode Default aus.
- Kein „Passwort vergessen“; Admin setzt zurück.
- Punkte berechnet statt gespeichert.
- QR-Code per Bibliothek `qrcode` im Display.

## 18. Offen für den Builder

Komponenten-Schnitt, Caching-Strategie der Berechnung, genaue Layouts/Farben (an Public-Stil anlehnen), Throttle-Details, Reihenfolge der Umsetzung im Plan.
