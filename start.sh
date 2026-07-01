#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Use Homebrew node (ad-hoc signed, can load native addons like rollup)
# Codex/OpenAI bundled node uses Hardened Runtime which blocks third-party .node binaries
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"

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

# Install all dependencies first (parallel)
(cd "$ROOT_DIR/backend" && npm install --no-audit) &
(cd "$ROOT_DIR/frontend/admin" && npm install --no-audit) &
(cd "$ROOT_DIR/frontend/display" && npm install --no-audit) &
(cd "$ROOT_DIR/frontend/public" && npm install --no-audit) &
(cd "$ROOT_DIR/frontend/audio" && npm install --no-audit) &
wait

# Re-sign native binaries (macOS Team ID fix)
find "$ROOT_DIR/frontend" -name "*.node" -exec codesign --force --sign - {} \; 2>/dev/null || true

# Start all dev servers
(cd "$ROOT_DIR/backend" && npm run dev) &
(cd "$ROOT_DIR/frontend/admin" && npm run dev) &
(cd "$ROOT_DIR/frontend/display" && npm run dev) &
(cd "$ROOT_DIR/frontend/public" && npm run dev) &
(cd "$ROOT_DIR/frontend/audio" && npm run dev) &

wait
