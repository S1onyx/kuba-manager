#!/usr/bin/env bash
# Restore des backend-data Volumes aus einem Backup.
#
# Usage (auf dem Deploy-Server, aus dem Repo-Verzeichnis):
#   ./scripts/restore-backup.sh ~/kuba-backups/kuba-backend-data-YYYYMMDD-HHMMSS.tar.gz
#
# Achtung: Stoppt den Backend-Container, ersetzt ALLE Daten im Volume
# (SQLite, Audio-Bibliothek, Poster, Registration-Audio) und startet neu.
set -euo pipefail

BACKUP_FILE="${1:?Usage: $0 <pfad/zum/backup.tar.gz>}"
VOLUME="kuba_backend-data"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup nicht gefunden: $BACKUP_FILE" >&2
  exit 1
fi

echo "=== Preflight: Archiv pruefen ==="
tar tzf "$BACKUP_FILE" > /dev/null

echo "=== Sicherheitskopie des aktuellen Stands ==="
SAFETY="$HOME/kuba-backups/pre-restore-$(date +%Y%m%d-%H%M%S).tar.gz"
mkdir -p "$HOME/kuba-backups"
docker run --rm -v "$VOLUME":/data:ro -v "$HOME/kuba-backups":/backup alpine \
  tar czf "/backup/$(basename "$SAFETY")" -C /data .
echo "Aktueller Stand gesichert als: $SAFETY"

echo "=== Backend stoppen ==="
docker compose stop backend

echo "=== Volume leeren und Backup einspielen ==="
docker run --rm -v "$VOLUME":/data -v "$(cd "$(dirname "$BACKUP_FILE")" && pwd)":/backup alpine \
  sh -c "rm -rf /data/* /data/.[!.]* 2>/dev/null || true; tar xzf /backup/$(basename "$BACKUP_FILE") -C /data"

echo "=== Backend starten ==="
docker compose start backend
sleep 3
docker compose ps backend

echo "Fertig. Falls Probleme: Rollback mit $0 $SAFETY"
