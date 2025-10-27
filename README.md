# Kunstrad Scoreboard

Ein schlankes Setup für die Spielstandsanzeige im Kunstrad-Basketball.
Das Projekt besteht aus vier Oberflächen sowie einem kleinen Node.js-Backend:

- `frontend/admin`: Steuerpanel für Teamnamen, Punkte (+1/+2/+3) und Spieluhr (Start, Pause, Zeit setzen).
- `frontend/display`: Public Display für die Halle mit Teamnamen, Spielstand und Restzeit.
- `frontend/public`: Öffentliche Turnierübersicht mit Live-Spiel, Gruppen- und KO-Tabellen sowie Team-Statistiken (mobilfreundlich).
- `frontend/audio`: Audio-Frontend auf einer eigenen Subdomain, das automatisch eingehende Spiel- und manuell ausgelöste Sounds abspielt.
- `backend`: REST- und WebSocket-Server, der den Scoreboard-Zustand verwaltet.
- `plausible-ce`: Docker-Konfiguration für die Self-Hosted-Plausible-Instanz auf `dashboard.kunstradbasketball.de`.

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
- Audio Interface: http://localhost:5176

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
- Öffentliche Turnierseite mit Live-Spielstand, automatischen Gruppentabellen, KO-Übersicht sowie separaten Tabs für Ergebnisse, Spielplan, Team- und Spielerstatistiken; aktualisiert sich automatisch bei neuen Ereignissen
- Pro Team 4–5 Spieler verwalten, Scoring- und Straf-Aktionen mit Spielern verknüpfen und aggregierte Statistiken im Dashboard auswerten
- Audioverwaltung im Admin-Panel: Für Spielstart, Pause, Ende, Körbe der Teams sowie Fouls lassen sich individuelle MP3-Sounds hochladen, aktivieren/deaktivieren und testen; zusätzlich können beliebige Sounds in einer Bibliothek gespeichert und manuell ausgelöst werden. Die Wiedergabe erfolgt über die eigenständige Audio-Domain.


## Geplante Features
- User Management mit Admin, User und Beamer Accounts. Bestätigung der Accounts durch den Admin. Login ins Admin Panel und Beamer Anzeige. Optionaler Login in Public Interface. Speicherung der Sessions in Cookies (24h)
- Wettsystem: Eingeloggte User können virtuelle Coins auf den Sieger der geplanten matches setzen. Beim richtigen Tipp gewinn von Betrag X (guter Algorithums nötig). Eigener Tab mit Tippspieltabelle! Hier sollen user gerankt werden, wer am ende am besten getippt hat. (Gewinner tipp, unentschieden und genauer Endstand) Coins kann man nur durch Admins über das admin panel zugeschrieben bkeommen. Im admin panel soll das usermanagement sein.

## Deployment (Docker & Caddy)

Das Repository enthält eine komplette Container-Orchestrierung mit Caddy als Reverse Proxy. Alle Services laufen in eigenen Images, die per GitHub Actions nach Docker Hub gepusht und anschließend automatisch auf dem Server aktualisiert werden können.

## Spieler-Management & Statistiken

- Im Admin-Dashboard gibt es einen eigenen Tab "Spieler", über den sich pro Team 4–5 Akteure mit Rückennummer und optionaler Position erfassen oder bearbeiten lassen.
- Beim Buchen von Punkten oder Strafen kannst du nun einen Spieler auswählen; die Werte landen automatisch in den Team- und Spielerstatistiken. Negative Korrekturen beeinflussen die Statistiken nicht.
- Öffentlichen Zuschauern stehen neue Tabs für Ergebnisse, Spielplan, Gruppenübersicht, Team- und Spielerstatistiken zur Verfügung – optimiert für mobile Geräte.
- Die Spieler-Tabellen werden aus den gespeicherten Snapshot-Daten erzeugt; ein "Spiel beenden" konserviert die Werte dauerhaft in der Historie.

### Container-Layout & Ports

- `backend` (Node.js API & WebSocket, Port 3000 über Caddy erreichbar)
- `public-frontend` (öffentliche Turnierübersicht, ausgeliefert über Port 80)
- `display-frontend` (Beameransicht, Port 8081)
- `admin-frontend` (Scoreboard-Steuerung, Port 8082)
- `audio-frontend` (Audio-Ausgabe, Port 8083)
- `plausible` (Self-Hosted Plausible Dashboard, intern Port 8000 – extern über `dashboard.kunstradbasketball.de`)
- `caddy` (Reverse Proxy, mapped Ports `80:80`, `8081:8081`, `8082:8082`, `8083:8083`, `3000:3000`)

Caddy leitet `/api/*` auf das Backend durch und stellt die drei Oberflächen unter den genannten Ports bereit. HTTPS ist deaktiviert, damit die Dienste sofort per IP erreichbar sind; Zertifikate lassen sich jederzeit nachrüsten.

### Vorbereitung auf dem Server

1. Voraussetzungen installieren: `docker`, `docker compose`, `git`.
2. Repository einmalig klonen (Deployment-Key liegt bereits unter `/var/www/kuba/.ssh/kuba-deploy`):  
   ```bash
   git clone git@github.com:<repo-owner>/kuba-manager.git /var/www/kuba
   ```
3. Konfiguration setzen:
   ```bash
   cd /var/www/kuba
   cp .env.example .env
   # .env bearbeiten und IMAGE_REGISTRY (z. B. docker.io/<dein-user>) sowie optional IMAGE_TAG setzen
   ```
4. Stack starten oder aktualisieren:
   ```bash
   docker compose pull
   docker compose up -d --remove-orphans
   ```

Die SQLite-Datenbank des Backends wird im Named Volume `backend-data` persistent gespeichert.

### GitHub Secrets (Repository > Settings > Secrets and variables > Actions)

- `DOCKERHUB_USERNAME`: Docker-Hub-Nutzername (für `docker login`)
- `DOCKERHUB_TOKEN`: PAT mit Push-Rechten auf die gewünschten Repositories
- `DEPLOY_KEY`: privater SSH-Key, der Zugriff auf den Server erlaubt (Gegenstück liegt unter `/home/<user>/.ssh/kuba-deploy`)
- `SSH_USER`: Benutzername für den SSH-Login (z. B. `root` oder `deploy`)
- `SERVER_IP`: `46.224.14.124`
- `DEPLOY_PATH`: `/var/www/kuba`
- `ADMIN_PANEL_USERNAME`: Login-Name für das Admin-Frontend
- `ADMIN_PANEL_PASSWORD`: Passwort für das Admin-Frontend
- `ADMIN_PANEL_SESSION_KEY`: Optional individueller Storage-Key für das Admin-Frontend (Fallback `kuba-admin-session`)

### GitHub Workflows

- **Build and Deploy Containers** (`.github/workflows/build-and-deploy.yml`)  
  Läuft automatisch auf `main`-Pushes oder manuell. Baut alle Images (`backend`, `public`, `display`, `admin`), pusht sie nach Docker Hub (`latest` + Commit-SHA) und führt danach das Deployment-Skript auf dem Server aus.
- **Manage Remote Stack** (`.github/workflows/manage-stack.yml`)  
  Manueller Workflow mit Aktionen `start`, `stop`, `restart`, `update`, `status`. Ideal, um den Stack remote zu steuern, ohne sich per SSH einzuloggen.

### Lokaler Test mit Docker

Für lokale Builds wird eine Override-Datei mit `build`-Kontexten bereitgestellt:

```bash
cp .env.example .env
IMAGE_REGISTRY=local-test IMAGE_TAG=dev # optional anpassen
docker compose -f docker-compose.yml -f docker-compose.override.local.yml up --build
```

Damit entstehen dieselben Container wie in Produktion, ohne dass Images nach außen gepusht werden.

### Domain & HTTPS (Caddy)

1. Lege drei `A`-Records auf die Server-IP `46.224.14.124` an: `@` (Root-Domain), `admin`, `display` (optional auch `www`). 
2. Öffne Ports `80` und `443` in der Firewall, damit Caddy die ACME-Challenges für HTTPS lösen kann.
3. Passe bei Bedarf `caddy/Caddyfile` an, wenn weitere Subdomains benötigt werden – jede Domain hat dort einen `handle`-Block, der `/api/*` an das Backend und den Rest an das jeweilige Frontend weiterleitet.
4. Ziehe die Änderungen auf dem Server (`git pull`), setze neue Images (`docker compose pull`) und starte den Proxy neu (`docker compose up -d`).

Die Frontends verwenden künftig automatisch die aktuelle Ursprung-Domain für API-Aufrufe, solange sie unter Standardports (80/443) laufen; für lokale Entwicklung bleiben die bisherigen Ports unverändert.

### Plausible Analytics Dashboard

- DNS: Leite `dashboard.kunstradbasketball.de` via `A`-Record auf `46.224.14.124`.
- Server-Umgebung: Ergänze `.env` im Deployment-Verzeichnis um (siehe `.env.example`):

  ```env
  PLAUSIBLE_BASE_URL=https://dashboard.kunstradbasketball.de
  PLAUSIBLE_SECRET_KEY_BASE=<64-Byte-Secret>
  PLAUSIBLE_DB_PASSWORD=<starkes Passwort>
  PLAUSIBLE_CLICKHOUSE_DB=plausible
  PLAUSIBLE_DISABLE_HTTPS=true
  PLAUSIBLE_DISABLE_REGISTRATION=true # nach dem ersten Admin-Account
  ```

- Optional: Hinterlege SMTP-Variablen (`PLAUSIBLE_MAILER_*`, `PLAUSIBLE_SMTP_*`), wenn Plausible Mails versenden soll.
- Standardmäßig nutzt Plausible den `Bamboo.LocalAdapter` (keine ausgehenden Mails). Sobald du SMTP einsetzen möchtest, setze `PLAUSIBLE_MAILER_ADAPTER` und die passenden SMTP-Parameter in der `.env`.
- Deployment: Die CI/CD-Pipeline baut weiterhin nur die eigenen Images; das Plausible-Image wird beim `docker compose pull` automatisch aus `ghcr.io/plausible/community-edition` geladen.
- Robots: `dashboard.kunstradbasketball.de/robots.txt` liefert automatisch `Disallow: /`, damit das Analytics-Dashboard nicht indexiert wird.

Nach dem Rollout kannst du dich auf `https://dashboard.kunstradbasketball.de/` einloggen, den ersten Benutzer anlegen und danach die Registrierung sperren (`PLAUSIBLE_DISABLE_REGISTRATION=true`).

## Impressum hinterlegen

Im öffentlichen Dashboard gibt es jetzt einen „Impressum“-Button im Footer.
