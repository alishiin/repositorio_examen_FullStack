#!/usr/bin/env bash
# Crea datos minimos de demo: superuser admin + 1 usuario normal.
# REQUIERE: UserService corriendo (puerto 8002) y migrate aplicado.

set -e

QUIET=false
[ "$1" = "--quiet" ] && QUIET=true

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
USER_PATH="$ROOT/PROYECTO-fullsatck-3-main/apis/microservicios_auth_user-main/auth_user_services/UserService"
export SECRET_KEY='django-insecure-sanos-y-salvos-dev-key'
export SIMPLE_JWT_SECRET_KEY="$SECRET_KEY"
export DEBUG=True

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$USER_PATH"

if [ ! -d ".venv" ]; then
    echo "ERROR: no existe .venv en $USER_PATH"
    echo "Corre primero ./start-all.sh"
    exit 1
fi

if [ -x ".venv/Scripts/python.exe" ]; then
    PYTHON_BIN=".venv/Scripts/python.exe"
elif [ -x ".venv/bin/python" ]; then
    PYTHON_BIN=".venv/bin/python"
else
    echo "ERROR: no se encontro python dentro de .venv"
    exit 1
fi

echo -e "${YELLOW}Creando superuser admin...${NC}"
"$PYTHON_BIN" manage.py shell << 'PYEOF'
from users.models import User
User.objects.filter(email='admin@sanosysalvos.cl').delete()
u = User.objects.create_superuser(
    username='admin',
    email='admin@sanosysalvos.cl',
    password='admin123',
    full_name='Administrador',
    rut='11111111-1',
    phone='911111111',
    commune='Santiago',
    address='Av Demo Admin 1',
)
print(f"  -> creado: {u.email}")
PYEOF

echo -e "${YELLOW}Creando usuario demo...${NC}"
"$PYTHON_BIN" manage.py shell << 'PYEOF'
from users.models import User
User.objects.filter(email='demo@example.cl').delete()
u = User.objects.create_user(
    username='demo',
    email='demo@example.cl',
    password='demo1234',
    full_name='Usuario Demo',
    rut='12345678-5',
    phone='912345678',
    commune='Providencia',
    address='Av Demo 123',
)
print(f"  -> creado: {u.email}")
PYEOF

if [ "$QUIET" = true ]; then
    exit 0
fi

echo ""
echo -e "${GREEN}Datos demo creados:${NC}"
echo "  Admin:  admin@sanosysalvos.cl / admin123"
echo "  Demo:   demo@example.cl       / demo1234"
echo ""
echo "Django Admin: http://localhost:8002/admin/"
