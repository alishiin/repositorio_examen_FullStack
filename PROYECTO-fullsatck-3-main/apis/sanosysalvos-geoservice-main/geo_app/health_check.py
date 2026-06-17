"""
Health Check endpoints para monitoreo de la aplicación.

Proporciona dos endpoints:
- /health → Verificar estado general del servicio
- /ready → Verificar si el servicio está listo para recibir requests
"""

import logging
from django.db import connection
from django.db.utils import OperationalError
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from geo_app.circuit_breaker import get_all_breakers_status

logger = logging.getLogger(__name__)


def check_database_health() -> dict:
    """Verifica que la BD está accesible."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return {
            "status": "healthy",
            "message": "Database connection successful"
        }
    except OperationalError as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }


def check_circuit_breakers_health() -> dict:
    """Verifica el estado de los circuit breakers."""
    breakers = get_all_breakers_status()
    
    all_healthy = all(
        breaker["state"] != "open"
        for breaker in breakers.values()
    )
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "breakers": breakers
    }


@require_http_methods(["GET"])
def health_check(request):
    """
    Endpoint: GET /health
    
    Verifica el estado general del servicio.
    Retorna 200 si está funcionando, 503 si hay problemas críticos.
    
    Usado por: Load balancers, monitoring systems, health dashboards
    
    Response:
    {
        "status": "healthy|degraded|unhealthy",
        "timestamp": "2026-04-19T10:30:45.123456Z",
        "version": "1.0.0",
        "checks": {
            "database": {...},
            "circuit_breakers": {...}
        }
    }
    """
    from django.utils.timezone import now
    
    database_health = check_database_health()
    breaker_health = check_circuit_breakers_health()
    
    # Determinar estado general
    if database_health["status"] == "unhealthy":
        overall_status = "unhealthy"
        http_status = 503
    elif breaker_health["status"] == "degraded":
        overall_status = "degraded"
        http_status = 200  # Aún respondemos, solo degradado
    else:
        overall_status = "healthy"
        http_status = 200
    
    response_data = {
        "status": overall_status,
        "timestamp": now().isoformat(),
        "version": "1.0.0",
        "checks": {
            "database": database_health,
            "circuit_breakers": breaker_health
        }
    }
    
    logger.info(f"Health check - Status: {overall_status}")
    
    return JsonResponse(response_data, status=http_status)


@require_http_methods(["GET"])
def readiness_check(request):
    """
    Endpoint: GET /ready
    
    Verifica si el servicio está listo para recibir requests.
    Retorna 200 si está listo, 503 si no.
    
    Usado por: Kubernetes readiness probes, service mesh
    
    Response:
    {
        "ready": true|false,
        "timestamp": "2026-04-19T10:30:45.123456Z",
        "reason": "Service is ready"
    }
    """
    from django.utils.timezone import now
    
    # Condiciones para estar "ready"
    database_health = check_database_health()
    is_database_ready = database_health["status"] == "healthy"
    
    # Aceptar requests incluso si los breakers están abiertos
    # (graceful degradation - el servicio sigue funcionando)
    is_ready = is_database_ready
    
    http_status = 200 if is_ready else 503
    
    response_data = {
        "ready": is_ready,
        "timestamp": now().isoformat(),
        "reason": "Service is ready" if is_ready else "Database is unavailable"
    }
    
    logger.info(f"Readiness check - Ready: {is_ready}")
    
    return JsonResponse(response_data, status=http_status)


@require_http_methods(["GET"])
def liveness_check(request):
    """
    Endpoint: GET /alive
    
    Simple check que el proceso está vivo.
    Retorna 200 si el servicio está corriendo.
    
    Usado por: Kubernetes liveness probes
    
    Response:
    {
        "alive": true,
        "timestamp": "2026-04-19T10:30:45.123456Z"
    }
    """
    from django.utils.timezone import now
    
    response_data = {
        "alive": True,
        "timestamp": now().isoformat()
    }
    
    return JsonResponse(response_data, status=200)
