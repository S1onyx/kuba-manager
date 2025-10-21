# Kunstrad Scoreboard

Ein schlankes Setup für die Spielstandsanzeige im Kunstrad-Basketball.
Das Projekt besteht aus drei Oberflächen sowie einem kleinen Node.js-Backend:

- `frontend/admin`: Steuerpanel für Teamnamen, Punkte (+1/+2/+3) und Spieluhr (Start, Pause, Zeit setzen).
- `frontend/display`: Public Display für die Halle mit Teamnamen, Spielstand und Restzeit.
- `frontend/public`: Öffentliche Turnierübersicht mit Live-Spiel, Gruppen- und KO-Tabellen sowie Team-Statistiken (mobilfreundlich).
- `backend`: REST- und WebSocket-Server, der den Scoreboard-Zustand verwaltet.

## Entwicklung starten

```bash
./start.sh
```

Das Skript installiert automatisch die Abhängigkeiten und startet alle vier
Entwicklungsserver parallel:

- Backend: http://localhost:3000
- Admin-Panel: http://localhost:5173
- Display: http://localhost:5174
- Public Interface: http://localhost:5175

Die Frontends sprechen das Backend standardmäßig über `http://localhost:3000`
(die REST-Routen liegen dort unter `/api/...`). Falls ein anderer Host oder
Port benötigt wird, passe `frontend/admin/.env` und `frontend/display/.env`
entsprechend an.

## Funktionsumfang

- Teamnamen eingeben und sofort live anzeigen lassen
- Punkte pro Team um 1, 2 oder 3 erhöhen oder direkt auf einen Wunschwert setzen
- Spieluhr starten, pausieren und auf eine beliebige Restzeit setzen
- Zeitstrafen je Team mit Namen und Dauer (1, 2 oder individuelle Minuten) verwalten – laufen automatisch mit der Spielzeit mit und werden nach Ablauf markiert
- Halbzeitmarke sowie optionale Nachspielzeit festlegen; bei Halbzeit startet automatisch ein konfigurierbarer Pausen-Timer, der zweite Durchgang muss manuell gestartet werden, Nachspielzeit läuft als Stoppuhr weiter und endet erst nach manuellem Stopp
- Turniere mit Gruppen- und KO-Phasen verwalten, Spiele zuordnen und Gruppentabellen live (inklusive aktuellem Spiel) berechnen
- Turniere als öffentlich oder privat markieren – nur öffentliche Wettbewerbe erscheinen im Public-Dashboard
- Spiele sichern (Teamnamen, Spielstand, Strafen, Zeiten) und im Admin-Dashboard in der Historie einsehen; über „Neues Spiel“ wird ein frisches Match mit Standardwerten vorbereitet
- Sofortige Synchronisation zwischen Steuerpanel und Hallenanzeige via WebSocket
- Öffentliche Turnierseite mit Live-Spielstand, automatischen Gruppentabellen, KO-Übersicht, Top-Team-Statistiken und den jüngsten Spielergebnissen; aktualisiert sich automatisch bei neuen Ergebnissen
