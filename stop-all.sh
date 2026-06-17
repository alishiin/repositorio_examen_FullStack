#!/usr/bin/env bash
# Detiene todos los servicios iniciados por start-all.sh

ROOT="$(cd "$(dirname "$0")" && pwd)"
PIDS="$ROOT/.pids"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Deteniendo servicios...${NC}"

if [ -d "$PIDS" ]; then
    for pidfile in "$PIDS"/*.pid; do
        [ -f "$pidfile" ] || continue
        name=$(basename "$pidfile" .pid)
        pid=$(cat "$pidfile")
        if kill -0 $pid 2>/dev/null; then
            kill $pid 2>/dev/null && echo "  OK  $name detenido (PID $pid)"
        else
            echo "  --  $name ya no corria"
        fi
        rm -f "$pidfile"
    done
fi

# Catch-all para procesos hijos del nohup (npm/runserver crean subprocesos).
# IMPORTANTE: filtrado defensivo - no tocamos procesos ajenos al proyecto.
pkill -f "manage.py runserver 0.0.0.0:800" 2>/dev/null || true
pkill -f "daphne -p 8004" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*backend/server" 2>/dev/null || true
pkill -f "nodemon.*server.js" 2>/dev/null || true

echo -e "${GREEN}Listo${NC}"
