#!/usr/bin/env bash
# Levanta TODOS los servicios de Sanos y Salvos en background.
# Logs en logs/<servicio>.log
# Para detener: ./stop-all.sh

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
PROYECTO="$ROOT/PROYECTO-fullsatck-3-main"
LOGS="$ROOT/logs"
PIDS="$ROOT/.pids"

mkdir -p "$LOGS" "$PIDS"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Iniciando Sanos y Salvos...${NC}"

# ---------------------------------------------------------------------
# Helper para microservicios Django.
# Usa el venv existente si lo hay; si no, intenta crearlo con uv.
# ---------------------------------------------------------------------
start_django() {
    local name=$1
    local path=$2
    local port=$3
    local asgi_module=$4  # opcional: si esta seteado, se usa daphne

    echo -e "${YELLOW}-> Iniciando $name en puerto $port...${NC}"

    cd "$path"

    if [ ! -d ".venv" ]; then
        echo "  Creando venv para $name (primera vez, esto puede tardar)..."
        if command -v uv &> /dev/null; then
            uv venv .venv
            source .venv/bin/activate
            uv pip install \
                --index-url https://pypi.ci.artifacts.walmart.com/artifactory/api/pypi/external-pypi/simple \
                --allow-insecure-host pypi.ci.artifacts.walmart.com \
                -r requirements.txt > "$LOGS/$name-install.log" 2>&1
        else
            python3 -m venv .venv
            source .venv/bin/activate
            pip install -r requirements.txt > "$LOGS/$name-install.log" 2>&1
        fi
    else
        source .venv/bin/activate
    fi

    python manage.py migrate --noinput >> "$LOGS/$name.log" 2>&1

    if [ -n "$asgi_module" ]; then
        nohup daphne -p $port "$asgi_module" >> "$LOGS/$name.log" 2>&1 &
    else
        nohup python manage.py runserver 0.0.0.0:$port >> "$LOGS/$name.log" 2>&1 &
    fi
    echo $! > "$PIDS/$name.pid"
    deactivate
    cd "$ROOT"
}

# ---------------------------------------------------------------------
# Microservicios Django
# ---------------------------------------------------------------------
start_django "auth"         "$PROYECTO/apis/microservicios_auth_user-main/auth_user_services/AuthService" 8001
start_django "user"         "$PROYECTO/apis/microservicios_auth_user-main/auth_user_services/UserService" 8002
start_django "geo"          "$PROYECTO/apis/sanosysalvos-geoservice-main"                                 8003
start_django "chat"         "$PROYECTO/apis/chat-services-main"                                           8004 "chat_service.asgi:application"
start_django "match"        "$PROYECTO/apis/MatchService-main"                                            8005
start_django "media"        "$PROYECTO/apis/Media-Service-main"                                           8006
start_django "notification" "$PROYECTO/apis/NotificacionesServices-main"                                  8007

# ---------------------------------------------------------------------
# BFF Node (Express)
# ---------------------------------------------------------------------
echo -e "${YELLOW}-> Iniciando BFF en puerto 5000...${NC}"
cd "$PROYECTO/frontend_sanos_y_salvos-main/backend"
if [ ! -d "node_modules" ]; then
    echo "  Instalando deps del BFF..."
    npm install > "$LOGS/bff-install.log" 2>&1
fi
nohup npm start > "$LOGS/bff.log" 2>&1 &
echo $! > "$PIDS/bff.pid"
cd "$ROOT"

# ---------------------------------------------------------------------
# Frontend Vite
# ---------------------------------------------------------------------
echo -e "${YELLOW}-> Iniciando Frontend en puerto 5173...${NC}"
cd "$PROYECTO/frontend_sanos_y_salvos-main"
if [ ! -d "node_modules" ]; then
    echo "  Instalando deps del Frontend..."
    npm install > "$LOGS/frontend-install.log" 2>&1
fi
nohup npm run dev > "$LOGS/frontend.log" 2>&1 &
echo $! > "$PIDS/frontend.pid"
cd "$ROOT"

echo ""
echo -e "${GREEN}Todos los servicios iniciados${NC}"
echo ""
echo "Estado:"
echo "  Frontend:    http://localhost:5173"
echo "  BFF:         http://localhost:5000"
echo "  Swagger:     http://localhost:5000/api-docs"
echo "  Auth:        http://localhost:8001"
echo "  User:        http://localhost:8002"
echo "  Geo:         http://localhost:8003"
echo "  Chat (WS):   ws://localhost:8004"
echo "  Match:       http://localhost:8005"
echo "  Media:       http://localhost:8006"
echo "  Notif:       http://localhost:8007"
echo ""
echo "Logs en: $LOGS/<servicio>.log"
echo "Para detener: ./stop-all.sh"
echo ""
echo "Esperando 8 segundos a que los servicios esten listos..."
sleep 8

# Verificacion rapida
echo ""
echo "Verificando salud:"
for port in 5000 5173 8001 8002 8003 8005 8006 8007; do
    if curl -s --max-time 2 "http://localhost:$port" > /dev/null 2>&1; then
        echo -e "  ${GREEN}OK${NC}  localhost:$port"
    else
        echo -e "  ${RED}--${NC}  localhost:$port (revisa logs)"
    fi
done

echo ""
echo "Abriendo navegador..."
case "$(uname -s)" in
    Darwin) open http://localhost:5173 ;;
    Linux)  xdg-open http://localhost:5173 2>/dev/null || true ;;
    *)      echo "Abre manualmente: http://localhost:5173" ;;
esac
