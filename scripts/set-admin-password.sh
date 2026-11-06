#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

command -v gh >/dev/null 2>&1 || { echo "Fehler: 'gh' ist nicht installiert." >&2; exit 1; }
[ -d "$ROOT_DIR/backend/node_modules/bcryptjs" ] || (cd "$ROOT_DIR/backend" && npm install --no-audit)

read -r -s -p "Neues Admin-Passwort (mind. 12 Zeichen): " PASSWORD; echo
read -r -s -p "Passwort wiederholen: " CONFIRM; echo

if [ "$PASSWORD" != "$CONFIRM" ]; then
  echo "Fehler: Passwörter stimmen nicht überein." >&2
  exit 1
fi
if [ "${#PASSWORD}" -lt 12 ]; then
  echo "Fehler: Passwort muss mindestens 12 Zeichen haben." >&2
  exit 1
fi

HASH_B64="$(cd "$ROOT_DIR/backend" && ADMIN_PASSWORD_INPUT="$PASSWORD" node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD_INPUT, 12);
process.stdout.write(Buffer.from(hash).toString('base64'));
")"
unset PASSWORD CONFIRM

printf '%s' "$HASH_B64" | gh secret set ADMIN_PASSWORD_HASH --repo S1onyx/kuba-manager
echo "ADMIN_PASSWORD_HASH gesetzt. Wird beim nächsten Deploy aktiv."
