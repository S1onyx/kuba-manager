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
