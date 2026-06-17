from django.db import models

class PetAnalysis(models.Model):
    # IDs de referencia a tus otros servicios (Report Service / Pet Service)
    report_id = models.IntegerField(unique=True, help_text="ID del reporte de la mascota en el otro servicio")
    pet_type = models.CharField(max_length=50, help_text="perro, gato, etc.")
    
    # Aquí guardaremos el texto descriptivo que nos devuelva Gemini
    ai_description = models.TextField(help_text="Descripción detallada generada automáticamente por Gemini")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reporte {self.report_id} - {self.pet_type}"

class MatchResult(models.Model):
    # Relaciona el reporte de la mascota perdida con el de la encontrada
    lost_report_id = models.IntegerField()
    found_report_id = models.IntegerField()
    
    is_confirmed = models.BooleanField(default=False, help_text="Confirmado por los usuarios")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Coincidencia: Reporte {self.lost_report_id} con {self.found_report_id}"