from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import PetAnalysis
from .gemini_service import GeminiPetAnalyzer

@method_decorator(csrf_exempt, name='dispatch')
class AnalyzePetImageView(APIView):
    def post(self, request):
        # 1. Capturar los datos enviados en la petición HTTP
        report_id = request.data.get('report_id')
        pet_type = request.data.get('pet_type')   # 'perro' o 'gato'
        image_file = request.FILES.get('image')     # El archivo de la foto

        # Validar que vengan los parámetros obligatorios
        if not report_id or not pet_type or not image_file:
            return Response(
                {"error": "Faltan parámetros requeridos (report_id, pet_type, image)"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 2. Llamar al servicio que conecta con Google Gemini para que analice la imagen
            descripcion_ia = GeminiPetAnalyzer.analyze_pet_image(image_file)

            # 3. Guardar el resultado del análisis en la base de datos local del microservicio
            analysis_record = PetAnalysis.objects.create(
                report_id=report_id,
                pet_type=pet_type,
                ai_description=descripcion_ia
            )

            # 4. Retornar la respuesta exitosa al cliente
            return Response({
                "message": "Imagen analizada exitosamente por Gemini",
                "report_id": analysis_record.report_id,
                "pet_type": analysis_record.pet_type,
                "descripcion_automatica": descripcion_ia
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Error interno en el microservicio: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )