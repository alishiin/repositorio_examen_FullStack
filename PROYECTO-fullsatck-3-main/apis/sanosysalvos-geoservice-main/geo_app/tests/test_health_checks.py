"""
Tests de Health Checks para observabilidad y monitoreo.

Valida:
- /health → Estado general
- /ready → Listo para recibir requests
- /alive → Vivo (liveness)
"""

from rest_framework.test import APITestCase, APIClient
from rest_framework import status


class HealthCheckAPITestCase(APITestCase):
    """
    Suite de tests para los endpoints de Health Check.
    
    Valida:
    - /health → Estado general
    - /ready → Listo para recibir requests
    - /alive → Vivo (liveness)
    """

    def setUp(self):
        """Configurar cliente API."""
        self.client = APIClient()

    def test_health_check_endpoint(self):
        """✅ Test: GET /health retorna health status."""
        response = self.client.get('/health')
        
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE])
        data = response.json()
        self.assertIn('status', data)

    def test_ready_check_endpoint(self):
        """✅ Test: GET /ready verifica readiness."""
        response = self.client.get('/ready')
        
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE])
        data = response.json()
        # Verifica que tiene key 'status' o 'ready'
        self.assertTrue('status' in data or 'ready' in data)

    def test_alive_check_endpoint(self):
        """✅ Test: GET /alive verifica liveness."""
        response = self.client.get('/alive')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        # Verifica que tiene algún indicador de que está vivo
        self.assertTrue('status' in data or 'alive' in data or 'ready' in data)
