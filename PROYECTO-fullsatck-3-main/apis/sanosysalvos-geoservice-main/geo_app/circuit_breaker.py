"""
Circuit Breaker para llamadas a microservicios externos.

Protege contra fallos en cascada cuando otros microservicios están inactivos.
Implementa el patrón Circuit Breaker con tres estados: CLOSED, OPEN, HALF_OPEN.
"""

import logging
import requests
from functools import wraps
from time import time
from enum import Enum
from typing import Callable, Any

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Estados posibles del circuit breaker."""
    CLOSED = "closed"          # Funcionando, permite requests 
    OPEN = "open"              # En fallo, rechaza requests
    HALF_OPEN = "half_open"    # Probando, permite 1 request de prueba


class CircuitBreakerException(Exception):
    """Excepción cuando el circuit breaker está OPEN."""
    pass


class ServiceCircuitBreaker:
    """
    Circuit Breaker para llamadas HTTP a servicios externos.
    
    Parámetros:
        - failure_threshold: Número de fallos antes de abrir (default: 5)
        - recovery_timeout: Segundos antes de probar recovery (default: 60)
        - expected_exception: Excepciones que cuentan como fallo (default: Exception)
    
    Uso:
        breaker = ServiceCircuitBreaker(failure_threshold=5, recovery_timeout=60)
        
        @breaker.call()
        def call_external_service():
            return requests.get("http://other-service/api/data")
    """
    
    def __init__(
        self, 
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: tuple = (Exception,)
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
        
        logger.info(
            f"Circuit Breaker inicializado - "
            f"Threshold: {failure_threshold}, Timeout: {recovery_timeout}s"
        )
    
    def call(self):
        """Decorador para envolver llamadas a servicios externos."""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs) -> Any:
                return self._execute(func, *args, **kwargs)
            return wrapper
        return decorator
    
    def _execute(self, func: Callable, *args, **kwargs) -> Any:
        """Ejecuta la función con lógica del circuit breaker."""
        
        # Estado OPEN: rechazar requests
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
                self.success_count = 0
                logger.info("Circuit Breaker: Cambiando a HALF_OPEN, intentando recovery...")
            else:
                logger.warning(f"Circuit Breaker OPEN - Rechazando request a {func.__name__}")
                raise CircuitBreakerException(
                    f"Service '{func.__name__}' is unavailable. Circuit breaker is OPEN."
                )
        
        # Intentar ejecutar
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
            
        except self.expected_exception as e:
            self._on_failure()
            logger.error(f"Error en {func.__name__}: {str(e)}")
            raise
    
    def _on_success(self):
        """Maneja un éxito."""
        self.failure_count = 0
        
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            
            if self.success_count >= 2:  # 2 éxitos consecutivos = recovery
                self.state = CircuitState.CLOSED
                logger.info("Circuit Breaker: Recovery exitoso, estado CLOSED")
    
    def _on_failure(self):
        """Maneja un fallo."""
        self.failure_count += 1
        self.last_failure_time = time()
        self.success_count = 0
        
        logger.warning(
            f"Circuit Breaker: Fallo {self.failure_count}/{self.failure_threshold}"
        )
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.error(f"Circuit Breaker: ABIERTO. Demasiados fallos ({self.failure_count})")
    
    def _should_attempt_reset(self) -> bool:
        """Verifica si pasó el tiempo para intentar recovery."""
        if self.last_failure_time is None:
            return False
        
        return (time() - self.last_failure_time) >= self.recovery_timeout
    
    def get_status(self) -> dict:
        """Retorna el estado actual del circuit breaker."""
        return {
            "state": self.state.value,
            "failure_count": self.failure_count,
            "failure_threshold": self.failure_threshold,
            "recovery_timeout": self.recovery_timeout,
            "last_failure_time": self.last_failure_time
        }


# Circuit breakers para servicios externos
user_service_breaker = ServiceCircuitBreaker(
    failure_threshold=5,
    recovery_timeout=60
)

pet_service_breaker = ServiceCircuitBreaker(
    failure_threshold=5,
    recovery_timeout=60
)


# Helper para hacer requests seguros a servicios externos
def safe_request(
    service_breaker: ServiceCircuitBreaker,
    method: str,
    url: str,
    timeout: int = 5,
    **kwargs
) -> requests.Response:
    """
    Realiza una request HTTP con circuit breaker.
    
    Args:
        service_breaker: Circuit breaker instance
        method: HTTP method (GET, POST, etc)
        url: URL destino
        timeout: Timeout en segundos
        **kwargs: Argumentos adicionales para requests
    
    Returns:
        requests.Response si es exitoso
    
    Raises:
        CircuitBreakerException: Si el breaker está OPEN
        requests.RequestException: Si hay error en la request
    """
    @service_breaker.call()
    def _request():
        response = requests.request(
            method,
            url,
            timeout=timeout,
            **kwargs
        )
        response.raise_for_status()  # Lanza excepción si status >= 400
        return response
    
    return _request()


def get_all_breakers_status() -> dict:
    """Retorna el estado de todos los circuit breakers."""
    return {
        "user_service": user_service_breaker.get_status(),
        "pet_service": pet_service_breaker.get_status()
    }
