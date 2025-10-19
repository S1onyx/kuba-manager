#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "Fehler: '$cmd' ist nicht installiert." >&2
    exit 1
  }
}

require_cmd node
require_cmd npm

echo "Installiere Abhängigkeiten und starte Entwicklungsserver..."

(
  cd "$ROOT_DIR/backend"
  npm install
  npm run dev
) &

(
  cd "$ROOT_DIR/frontend/admin"
  npm install
  npm run dev
) &

(
  cd "$ROOT_DIR/frontend/display"
  npm install
  npm run dev
) &

wait
