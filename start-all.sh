#!/usr/bin/env bash
# Levanta TODOS los servicios de Sanos y Salvos en background.
# Logs en logs/<servicio>.log
# Para detener: ./stop-all.sh

set -ex

# ---------------------------------------------------------------------
# Parseo de flags
# ---------------------------------------------------------------------
FRESH=false
NO_SEED=false
NO_BROWSER=false

for arg in "$@"; do
    case $arg in
        --fresh)      FRESH=true ;;
        --no-seed)    NO_SEED=true ;;
        --no-browser) NO_BROWSER=true ;;
        -h|--help)
            cat <<'EOF'
Uso: ./start-all.sh [opciones]

Opciones:
  --fresh        Borra TODAS las DBs SQLite y recrea desde cero (perdida de datos).
                 Pide confirmacion. Tambien corre seed-demo (usuarios de prueba).
  --no-seed      No corre seed-admins (admin/admin123 en cada servicio).
  --no-browser   No abre el navegador al final.
  -h, --help     Muestra esta ayuda.

Sin opciones: arranca todo + seed-admins idempotente (no destruye datos).
EOF
            exit 0
            ;;
        *)
            echo "Flag desconocido: $arg (usa -h para ver opciones)"
            exit 1
            ;;
    esac
done

ROOT="$(cd "$(dirname "$0")" && pwd)"
PROYECTO="$ROOT/PROYECTO-fullsatck-3-main"
LOGS="$ROOT/logs"
PIDS="$ROOT/.pids"

export SECRET_KEY='django-insecure-sanos-y-salvos-dev-key'
export SIMPLE_JWT_SECRET_KEY="$SECRET_KEY"
export DEBUG=True

mkdir -p "$LOGS" "$PIDS"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ---------------------------------------------------------------------
# --fresh: wipe de todas las DBs SQLite (con confirmacion)
# ---------------------------------------------------------------------
if [ "$FRESH" = true ]; then
    echo ""
    echo -e "${YELLOW}--fresh: vas a borrar TODAS las bases de datos SQLite${NC}"
    echo "  Los reportes, usuarios, notificaciones y matches se perderan."
    read -p "  Continuar? [y/N] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "  Cancelado."
        exit 0
    fi
    find "$PROYECTO" -name "db.sqlite3" -type f -delete 2>/dev/null || true
    echo -e "  ${GREEN}Bases de datos borradas. Se recrearan con migrate.${NC}"
    echo ""
fi

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
    local python_bin=""

    echo -e "${YELLOW}-> Iniciando $name en puerto $port...${NC}"

    cd "$path"

    if [ ! -d ".venv" ]; then
        echo "  Creando venv para $name (primera vez, esto puede tardar)..."
        python_bin="$(command -v python.exe || command -v py || command -v python3 || command -v python)"
        if [ -z "$python_bin" ]; then
            echo "  No se encontro Python para crear el entorno de $name."
            exit 1
        fi
        "$python_bin" -m venv .venv
    fi

    if [ -x ".venv/Scripts/python.exe" ]; then
        python_bin=".venv/Scripts/python.exe"
    elif [ -x ".venv/bin/python" ]; then
        python_bin=".venv/bin/python"
    else
        python_bin="$(command -v python.exe || command -v py || command -v python3 || command -v python)"
    fi

    if [ -z "$python_bin" ]; then
        echo "  No se encontro Python para ejecutar $name."
        exit 1
    fi

    if ! "$python_bin" -m pip --version >/dev/null 2>&1; then
        "$python_bin" -m ensurepip --upgrade >> "$LOGS/$name-install.log" 2>&1
    fi

    "$python_bin" -m pip install -r requirements.txt >> "$LOGS/$name-install.log" 2>&1
    "$python_bin" manage.py migrate --noinput >> "$LOGS/$name.log" 2>&1

    if [ -n "$asgi_module" ]; then
        nohup "$python_bin" -m daphne -b 0.0.0.0 -p $port "$asgi_module" >> "$LOGS/$name.log" 2>&1 &
    else
        nohup "$python_bin" manage.py runserver 0.0.0.0:$port >> "$LOGS/$name.log" 2>&1 &
    fi
    echo $! > "$PIDS/$name.pid"
    cd "$ROOT"
}

# ---------------------------------------------------------------------
# Microservicios Django
# ---------------------------------------------------------------------
start_django "auth"         "$PROYECTO/apis/microservicios_auth_user-main/auth_user_services/AuthService" 8001
start_django "user"         "$PROYECTO/apis/microservicios_auth_user-main/auth_user_services/UserService" 8002
start_django "geo"          "$PROYECTO/apis/sanosysalvos-geoservice-main"                                 8003
start_django "chat"         "$PROYECTO/apis/chat-services-main"                                           8004 "chat_service_proj.asgi:application"
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

# ---------------------------------------------------------------------
# Seed automatico de superusers admin (idempotente)
# ---------------------------------------------------------------------
if [ "$NO_SEED" = false ]; then
    echo ""
    echo -e "${YELLOW}Creando superusers admin/admin123 en todos los servicios...${NC}"
    if "$ROOT/entrega/05-demo/seed-admins.sh" --quiet > /tmp/seed-admins.log 2>&1; then
        echo -e "  ${GREEN}OK${NC} Superusers listos en los 7 microservicios (admin/admin123)"
    else
        echo -e "  ${RED}WARN${NC} seed-admins fallo (ver /tmp/seed-admins.log)"
    fi

    if [ "$FRESH" = true ]; then
        echo -e "${YELLOW}--fresh: creando usuarios demo en UserService...${NC}"
        if "$ROOT/entrega/05-demo/seed-demo.sh" --quiet > /tmp/seed-demo.log 2>&1; then
            echo -e "  ${GREEN}OK${NC} Usuario demo listo: demo@example.cl / demo1234"
        else
            echo -e "  ${RED}WARN${NC} seed-demo fallo (ver /tmp/seed-demo.log)"
        fi
    fi
fi

if [ "$NO_BROWSER" = false ]; then
    echo ""
    echo "Abriendo navegador..."
    case "$(uname -s)" in
        Darwin) open http://localhost:5173 ;;
        Linux)  xdg-open http://localhost:5173 2>/dev/null || true ;;
        *)      echo "Abre manualmente: http://localhost:5173" ;;
    esac
fi