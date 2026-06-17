from django.db import models


class PetAnalysis(models.Model):
    # IDs de referencia cross-service. Usamos CharField porque otros servicios
    # pueden enviar prefijos tipo "rep_001" o UUIDs, no solo enteros.
    report_id = models.CharField(
        max_length=100,
        unique=True,
        help_text="ID del reporte (puede venir como string con prefijo)",
    )
    pet_type = models.CharField(max_length=50, help_text="perro, gato, etc.")

    # Texto descriptivo que devuelve Gemini.
    ai_description = models.TextField(
        help_text="Descripcion detallada generada automaticamente por Gemini"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reporte {self.report_id} - {self.pet_type}"


class MatchResult(models.Model):
    # Relaciona el reporte de la mascota perdida con el de la encontrada.
    lost_report_id = models.CharField(max_length=100)
    found_report_id = models.CharField(max_length=100)

    is_confirmed = models.BooleanField(
        default=False, help_text="Confirmado por los usuarios"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Coincidencia: Reporte {self.lost_report_id} con {self.found_report_id}"
