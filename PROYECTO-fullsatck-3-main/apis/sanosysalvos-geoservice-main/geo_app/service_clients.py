"""
Clientes HTTP para comunicarse con otros microservicios.

Usa Circuit Breaker para proteger contra fallos en cascada.
"""

import logging
from typing import Optional, Dict, Any
from decouple import config
from geo_app.circuit_breaker import (
    safe_request,
    user_service_breaker,
    pet_service_breaker,
    CircuitBreakerException
)

logger = logging.getLogger(__name__)

# URLs de servicios externos
USER_SERVICE_URL = config('USER_SERVICE_URL', default='http://localhost:8002/api/v1')
PET_SERVICE_URL = config('PET_SERVICE_URL', default='http://localhost:8003/api/v1')
REQUEST_TIMEOUT = 5  # segundos


class UserServiceClient:
    """Cliente para el servicio de usuarios."""
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene información de un usuario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Dict con datos del usuario o None si falla
        """
        try:
            url = f"{USER_SERVICE_URL}/users/{user_id}/"
            response = safe_request(
                user_service_breaker,
                "GET",
                url,
                timeout=REQUEST_TIMEOUT
            )
            return response.json()
            
        except CircuitBreakerException:
            logger.error(f"Circuit breaker OPEN: No se puede contactar User Service para {user_id}")
            return None
        except Exception as e:
            logger.error(f"Error en User Service: {str(e)}")
            return None
    
    @staticmethod
    def validate_user_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Valida un JWT token con el servicio de usuarios.
        
        Args:
            token: JWT token
            
        Returns:
            Dict con datos del usuario o None si es inválido
        """
        try:
            url = f"{USER_SERVICE_URL}/auth/verify-token/"
            response = safe_request(
                user_service_breaker,
                "POST",
                url,
                json={"token": token},
                timeout=REQUEST_TIMEOUT
            )
            return response.json()
            
        except CircuitBreakerException:
            logger.warning("Circuit breaker OPEN: No se puede verificar token")
            return None
        except Exception as e:
            logger.error(f"Error validando token: {str(e)}")
            return None


class PetServiceClient:
    """Cliente para el servicio de mascotas."""
    
    @staticmethod
    def get_pet_by_id(pet_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene información de una mascota.
        
        Args:
            pet_id: ID de la mascota
            
        Returns:
            Dict con datos de la mascota o None si falla
        """
        try:
            url = f"{PET_SERVICE_URL}/pets/{pet_id}/"
            response = safe_request(
                pet_service_breaker,
                "GET",
                url,
                timeout=REQUEST_TIMEOUT
            )
            return response.json()
            
        except CircuitBreakerException:
            logger.error(f"Circuit breaker OPEN: No se puede contactar Pet Service para {pet_id}")
            return None
        except Exception as e:
            logger.error(f"Error en Pet Service: {str(e)}")
            return None
    
    @staticmethod
    def get_report_by_id(report_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene información de un reporte.
        
        Args:
            report_id: ID del reporte
            
        Returns:
            Dict con datos del reporte o None si falla
        """
        try:
            url = f"{PET_SERVICE_URL}/reports/{report_id}/"
            response = safe_request(
                pet_service_breaker,
                "GET",
                url,
                timeout=REQUEST_TIMEOUT
            )
            return response.json()
            
        except CircuitBreakerException:
            logger.error(f"Circuit breaker OPEN: No se puede contactar Pet Service para {report_id}")
            return None
        except Exception as e:
            logger.error(f"Error en Pet Service: {str(e)}")
            return None
    
    @staticmethod
    def notify_nearby_matches(reporte_id: str, matches: list) -> bool:
        """
        Notifica al servicio de mascotas sobre reportes cercanos.
        
        Args:
            reporte_id: ID del reporte de origen
            matches: Lista de reportes cercanos
            
        Returns:
            True si la notificación se envió exitosamente
        """
        try:
            url = f"{PET_SERVICE_URL}/reports/{reporte_id}/notify-matches/"
            response = safe_request(
                pet_service_breaker,
                "POST",
                url,
                json={"matches": matches},
                timeout=REQUEST_TIMEOUT
            )
            return response.status_code < 400
            
        except CircuitBreakerException:
            logger.warning(f"Circuit breaker OPEN: No se puede notificar a Pet Service")
            return False
        except Exception as e:
            logger.error(f"Error notificando matches: {str(e)}")
            return False


# Ejemplo de uso en views:
"""
# En views.py
from geo_app.service_clients import PetServiceClient, UserServiceClient

def buscar_cercanos(self, request):
    # ... tu lógica ...
    
    # Buscar reportes cercanos
    reportes_cercanos = your_function_to_find_reports()
    
    # Intentar notificar al Pet Service (graceful degradation si falla)
    matches = [r['id'] for r in reportes_cercanos]
    success = PetServiceClient.notify_nearby_matches(reporte_id, matches)
    
    if not success:
        # El servicio falló pero nosotros seguimos respondiendo
        logger.warning(f"No se notificó al Pet Service, pero la búsqueda fue exitosa")
    
    return Response({'reportes': reportes_cercanos})
"""
