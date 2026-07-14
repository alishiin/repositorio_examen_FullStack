#!/usr/bin/env bash
# Crea un superuser admin/admin123 en TODOS los microservicios Django.
# Cada microservicio tiene su propia DB (DB-per-service), asi que necesitamos
# un superuser independiente en cada uno para que el mismo login funcione en
# todos los Django admin (puertos 8001-8007).

set -e

QUIET=false
[ "$1" = "--quiet" ] && QUIET=true

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export SECRET_KEY='django-insecure-sanos-y-salvos-dev-key'
export SIMPLE_JWT_SECRET_KEY="$SECRET_KEY"
export DEBUG=True

SERVICES=(
  "PROYECTO-fullsatck-3-main/apis/microservicios_auth_user-main/auth_user_services/AuthService"
  "PROYECTO-fullsatck-3-main/apis/microservicios_auth_user-main/auth_user_services/UserService"
  "PROYECTO-fullsatck-3-main/apis/sanosysalvos-geoservice-main"
  "PROYECTO-fullsatck-3-main/apis/chat-services-main"
  "PROYECTO-fullsatck-3-main/apis/MatchService-main"
  "PROYECTO-fullsatck-3-main/apis/Media-Service-main"
  "PROYECTO-fullsatck-3-main/apis/NotificacionesServices-main"
)

for service_path in "${SERVICES[@]}"; do
  FULL_PATH="$ROOT/$service_path"
  NAME=$(basename "$service_path")

  if [ ! -d "$FULL_PATH/.venv" ]; then
    [ "$QUIET" = false ] && echo "[skip] $NAME - sin .venv (corre ./start-all.sh primero para crearlo)"
    continue
  fi

  [ "$QUIET" = false ] && echo "[$NAME] creando superuser admin/admin123..."
  cd "$FULL_PATH"

  if [ -x ".venv/Scripts/python.exe" ]; then
    PYTHON_BIN=".venv/Scripts/python.exe"
  elif [ -x ".venv/bin/python" ]; then
    PYTHON_BIN=".venv/bin/python"
  else
    echo "  [warn] $NAME no tiene python en .venv"
    cd "$ROOT"
    continue
  fi

  if [ "$NAME" = "UserService" ]; then
    # UserService tiene custom User con full_name/rut/phone/commune/address requeridos.
    "$PYTHON_BIN" manage.py shell <<'PYEOF' || echo "  [warn] fallo $NAME (ver mensaje arriba)"
from users.models import User
User.objects.filter(username='admin').delete()
User.objects.create_superuser(
    username='admin',
    email='admin@sanosysalvos.cl',
    password='admin123',
    full_name='Administrador',
    rut='11111111-1',
    phone='912345678',
    commune='Santiago',
    address='Av. Demo 123',
)
print('  OK')
PYEOF
  else
    # Resto usa User default de Django.
    "$PYTHON_BIN" manage.py shell <<'PYEOF' || echo "  [warn] fallo $NAME (ver mensaje arriba)"
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.filter(username='admin').delete()
User.objects.create_superuser('admin', 'admin@sanosysalvos.cl', 'admin123')
print('  OK')
PYEOF
  fi

  cd "$ROOT"
done

echo ""
if [ "$QUIET" = true ]; then
    exit 0
fi
echo "============================================"
echo "  Superusers creados en TODOS los servicios"
echo "============================================"
echo "  Usuario:  admin"
echo "  Password: admin123"
echo ""
echo "  Admins disponibles:"
echo "    http://localhost:8001/admin/  (AuthService)"
echo "    http://localhost:8002/admin/  (UserService)"
echo "    http://localhost:8003/admin/  (GeoService - reportes)"
echo "    http://localhost:8004/admin/  (ChatService)"
echo "    http://localhost:8005/admin/  (MatchService - matches/analisis)"
echo "    http://localhost:8006/admin/  (MediaService)"
echo "    http://localhost:8007/admin/  (NotificationService)"
