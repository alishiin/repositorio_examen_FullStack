"""
Tests del Circuit Breaker para resiliencia y tolerancia a fallos.

Valida:
- Transiciones de estado (CLOSED → OPEN → HALF_OPEN → CLOSED)
- Conteo de fallos y resets
- Excepciones lanzadas cuando está OPEN
"""

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta

from geo_app.circuit_breaker import ServiceCircuitBreaker, CircuitBreakerException


class CircuitBreakerTestCase(TestCase):
    """
    Suite de tests para el Circuit Breaker.
    
    Valida:
    - Transiciones de estado (CLOSED → OPEN → HALF_OPEN → CLOSED)
    - Conteo de fallos y resets
    - Excepciones lanzadas cuando está OPEN
    """

    def setUp(self):
        """Configurar circuit breaker para cada test."""
        self.breaker = ServiceCircuitBreaker(
            failure_threshold=3,
            recovery_timeout=1,
            expected_exception=(Exception,)
        )

    def test_circuito_cerrado_exitoso(self):
        """✅ Test: Circuit CLOSED permite requests exitosos."""
        @self.breaker.call()
        def successful_call():
            return "success"
        
        result = successful_call()
        self.assertEqual(result, "success")
        self.assertEqual(self.breaker.state.value, "closed")

    def test_contar_fallos_acumulados(self):
        """✅ Test: Contador de fallos se incrementa."""
        @self.breaker.call()
        def failing_call():
            raise Exception("Service unavailable")
        
        # Primer fallo
        with self.assertRaises(Exception):
            failing_call()
        self.assertEqual(self.breaker.failure_count, 1)
        
        # Segundo fallo
        with self.assertRaises(Exception):
            failing_call()
        self.assertEqual(self.breaker.failure_count, 2)
        
        # Tercer fallo - dispara circuit breaker
        with self.assertRaises(Exception):
            failing_call()
        self.assertEqual(self.breaker.failure_count, 3)

    def test_circuito_abierto_rechaza_requests(self):
        """❌ Test: Circuit OPEN rechaza requests inmediatamente."""
        # Simular apertura del circuito acumulando fallos
        @self.breaker.call()
        def failing_call():
            raise Exception("Service unavailable")
        
        # Acumular suficientes fallos para abrir el circuito
        for _ in range(self.breaker.failure_threshold):
            try:
                failing_call()
            except Exception:
                pass
        
        # Ahora debería estar OPEN
        self.assertEqual(self.breaker.state.value, "open")
        
        # Siguiente intento debe rechazar
        @self.breaker.call()
        def call_when_open():
            return "should not execute"
        
        with self.assertRaises(CircuitBreakerException):
            call_when_open()

    def test_contar_exitos_consecutivos(self):
        """✅ Test: Contador de éxitos en HALF_OPEN mode."""
        # Configurar el breaker manualmente en half_open
        self.breaker.state = self.breaker.state.__class__.HALF_OPEN
        
        @self.breaker.call()
        def successful_call():
            return "success"
        
        # Primer éxito
        result = successful_call()
        self.assertEqual(result, "success")
        self.assertGreaterEqual(self.breaker.success_count, 1)
