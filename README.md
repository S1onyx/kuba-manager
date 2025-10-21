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


## Geplante Features

- In der Beameranzeige soll man über das admin panel auch andere dinge anzeigen lassen können. 1. Der Live stand (so wie jetzt), 2. Der Tunierbaum also bitte wenn vorhanden am anfang die tabellen der Gruppenphasen und dannd die ko Runden spiele, wenn vorhandn schon mit ergebnis und den partnern...
- Die Beameranzeige soll später im vollbildmodus startbar sein, es ist wichtig das immer alles auf einem bildschirm zu sehen ist!!!
- Im public interface soll das aktuelle Spiel in einem extra "Live" Tab angezeigt werden.
- Es wird ein impressum benötigt, da die applikation gehostet werden soll.
- Hosting: Alles soll in docker lauffähig sein. Dann über github workflow push auf dockerhub und dann update auf server. Mittels github workflows soll man die applikation auf dem server starten, stoppen und updaten können. Auf dem server soll dann einfach ein dockercompose file liegen. Denke am beten wäre caddy, aber keine Ahnung. Stell mir gerne Fragen, wenn irgendwas unklar ist. Ich habe einen vServer mit folgender ip: 46.224.14.124 Hierauf sollen später auch die verschiedenen interfaces über die ports erreichbar sein. Folgender Github Secrets stehen zu verfügung: DEPLOY_KEY, SSH_USER, SERVER_IP, DEPLOY_PATH
- Jedes Team besteht aus 4-5 Playern, genaues Tracking wer wann und wie lange eine Strafe hat. Wer Wann einen Korb geworfen hat. Extra Tab im Public interface mit Player Statistiken
- User Management mit Admin, User und Beamer Accounts. Bestätigung der Accounts durch den Admin. Login ins Admin Panel und Beamer Anzeige. Optionaler Login in Public Interface. Speicherung der Sessions in Cookies (24h)
- Wettsystem: Eingeloggte User können virtuelle Coins auf den Sieger der geplanten matches setzen. Beim richtigen Tipp gewinn von Betrag X (guter Algorithums nötig). Eigener Tab mit Tippspieltabelle! Hier sollen user gerankt werden, wer am ende am besten getippt hat. (Gewinner tipp, unentschieden und genauer Endstand) Coins kann man nur durch Admins über das admin panel zugeschrieben bkeommen. Im admin panel soll das usermanagement sein.

## Impressum hinterlegen

Im öffentlichen Dashboard gibt es jetzt einen „Impressum“-Button im Footer. Damit die Anwendung konform gehostet werden kann, ersetze die Platzhalter in `frontend/public/src/components/Impressum.jsx` durch deine tatsächlichen Betreiberangaben (Firma/Verein, Kontakt, Registerdaten etc.). Die Inhalte werden im Overlay angezeigt, sobald der Button geklickt wird.
