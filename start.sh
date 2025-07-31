#!/bin/bash

# Hilfsfunktion zur Ausgabe von Fehlermeldungen und Beenden des Skripts
error_exit() {
  echo "Fehler: $1" >&2
  exit 1
}

# .env laden
export $(grep -v '^#' .env | xargs)

# Prüfen, ob die benötigten Programme installiert sind
command -v node >/dev/null 2>&1 || error_exit "Node.js ist nicht installiert. Bitte installieren Sie Node.js."
command -v npm >/dev/null 2>&1 || error_exit "npm ist nicht installiert. Bitte installieren Sie npm."
command -v docker >/dev/null 2>&1 || error_exit "Docker ist nicht installiert. Bitte installieren Sie Docker."
command -v docker-compose >/dev/null 2>&1 || error_exit "Docker Compose ist nicht installiert. Bitte installieren Sie Docker Compose."


DEV_MODE=false
RESET_DB=false

# Parameter verarbeiten
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev)
      DEV_MODE=true
      shift
      ;;
    --resetDB)
      RESET_DB=true
      shift
      ;;
    *)
      echo "Unbekannte Option: $1"
      exit 1
      ;;
  esac
done

if [ "$DEV_MODE" = true ]; then
  echo "Starte lokale Entwicklungsumgebung mit Docker (nur Datenbanken)..."

  # .env.dev laden
  if [ -f .env.dev ]; then
    export $(grep -v '^#' .env.dev | xargs)
  else
    echo ".env.dev nicht gefunden, verwende .env"
  fi

  # Frontend-Backend URL für die Entwicklung setzen
  BACKEND_URL="http://localhost:3000/api"
  echo "Setze VITE_BACKEND_URL auf $BACKEND_URL in den Frontend .env Dateien"
  
  # Funktion zum Setzen der Umgebungsvariablen in den Frontend .env Dateien
  set_vite_backend_url() {
    local frontend_dir="$1"
    local env_file="$frontend_dir/.env"
    if [ -f "$env_file" ]; then
      sed -i "s/^VITE_BACKEND_URL=.*/VITE_BACKEND_URL=$BACKEND_URL/" "$env_file"
    else
      echo "Erstelle $env_file"
      echo "VITE_BACKEND_URL=$BACKEND_URL" > "$env_file"
    fi
  }

  set_vite_backend_url "frontend/admin"
  set_vite_backend_url "frontend/public"
  set_vite_backend_url "frontend/display"

  # Docker Compose Umgebung starten (nur Datenbanken)
  docker-compose -f docker-compose.dev.yml up -d

  # Warten, bis die Datenbank bereit ist
  echo "Warte auf Datenbank..."
  until docker exec -i kuba-postgres pg_isready -U admin -d kuba; do
    sleep 1
  done
  echo "Datenbank bereit."

  # Datenbank initialisieren, falls --resetDB Flag gesetzt ist
  if [ "$RESET_DB" = true ]; then
    echo "Setze Datenbank zurück..."
    docker-compose -f docker-compose.dev.yml down -v # löscht die Volumes

    # Volumes neu erstellen
    docker volume create pg_data
    docker volume create redis_data

    # Docker Compose Umgebung starten (nur Datenbanken)
    docker-compose -f docker-compose.dev.yml up -d

    # Warten, bis die Datenbank bereit ist
    echo "Warte auf Datenbank..."
    until docker exec -i kuba-postgres pg_isready -U admin -d kuba; do
      sleep 1
    done
    echo "Datenbank bereit."

    # Initialisierungsskripte ausführen mit Logging
    echo "Führe Datenbank-Skripte aus..."
    docker exec -i kuba-postgres psql -U admin -d kuba -f /docker-entrypoint-initdb.d/01-schema.sql 2>&1
    docker exec -i kuba-postgres psql -U admin -d kuba -f /docker-entrypoint-initdb.d/02-seed.sql 2>&1
    echo "Datenbank-Skripte ausgeführt."
  fi

  # Frontend und Backend separat starten
  echo "Starte Frontend und Backend Entwicklungsserver..."
  (cd backend && npm install && npm run dev) &
  (cd frontend/admin && npm install && npm run dev) &
  (cd frontend/public && npm install && npm run dev) &
  (cd frontend/display && npm install && npm run dev) &

  wait
else
  echo "Starte Docker-Compose Umgebung..."

  if [ "$RESET_DB" = true ]; then
    echo "Setze Datenbank zurück..."
    docker-compose down -v # löscht die Volumes

    # Volumes neu erstellen
    docker volume create pg_data
    docker volume create redis_data

    # Initialisierungsskripte ausführen
    docker-compose up postgres # startet nur postgres
    
    # Warten, bis die Datenbank bereit ist
    echo "Warte auf Datenbank..."
    until docker exec -i kuba-postgres pg_isready -U admin -d kuba; do
      sleep 1
    done
    echo "Datenbank bereit."

    # Initialisierungsskripte ausführen mit Logging
    echo "Führe Datenbank-Skripte aus..."
    docker exec -i kuba-postgres psql -U admin -d kuba -f /docker-entrypoint-initdb.d/01-schema.sql 2>&1
    docker exec -i kuba-postgres psql -U admin -d kuba -f /docker-entrypoint-initdb.d/02-seed.sql 2>&1
    echo "Datenbank-Skripte ausgeführt."

    docker-compose down # fährt die DB wieder runter
  fi

  docker-compose up
fi

#Nachinstallationsschritte

# Datenbank initialisieren, falls --resetDB Flag gesetzt ist
mkdir -p ./postgres/docker-entrypoint-initdb.d

cat <<EOF > ./postgres/docker-entrypoint-initdb.d/01-schema.sql
CREATE TABLE IF NOT EXISTS matches (id SERIAL PRIMARY KEY, teamA VARCHAR(255), teamB VARCHAR(255), score VARCHAR(255));
EOF

cat <<EOF > ./postgres/docker-entrypoint-initdb.d/02-seed.sql
INSERT INTO matches (teamA, teamB, score) VALUES ('Red', 'Blue', '12:9');
INSERT INTO matches (teamA, teamB, score) VALUES ('Green', 'Yellow', '5:7');
EOF