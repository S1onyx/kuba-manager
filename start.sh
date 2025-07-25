#!/bin/bash

echo "Starte lokale Entwicklungsumgebung..."

# .env laden
export $(grep -v '^#' .env | xargs)

# Backend (mit nodemon)
(cd backend && npm install && npm run dev) &

# Admin Frontend
(cd frontend/admin && npm install && npm run dev) &

# Public Frontend
(cd frontend/public && npm install && npm run dev) &

# Display Frontend
(cd frontend/display && npm install && npm run dev) &

wait