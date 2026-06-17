from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .clients import disparar_notificacion, listar_reportes_opuestos
from .gemini_service import GeminiPetAnalyzer
from .matching import calcular_score
from .models import MatchResult, PetAnalysis


# Umbral minimo para considerar un match (de 0 a 100).
SCORE_UMBRAL = 50


@method_decorator(csrf_exempt, name='dispatch')
class AnalyzePetImageView(APIView):
    def post(self, request):
        # 1. Capturar los datos enviados en la peticion HTTP
        report_id = request.data.get('report_id')
        pet_type = request.data.get('pet_type')   # 'perro' o 'gato'
        image_file = request.FILES.get('image')     # El archivo de la foto

        # Validar que vengan los parametros obligatorios
        if not report_id or not pet_type or not image_file:
            return Response(
                {"error": "Faltan parámetros requeridos (report_id, pet_type, image)"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # 2. Analisis con Gemini (mockeable, modo degradado si no hay API key)
            descripcion_ia = GeminiPetAnalyzer.analyze_pet_image(image_file)

            # 3. Persistir el analisis
            analysis_record = PetAnalysis.objects.create(
                report_id=report_id,
                pet_type=pet_type,
                ai_description=descripcion_ia,
            )

            return Response({
                "message": "Imagen analizada exitosamente por Gemini",
                "report_id": analysis_record.report_id,
                "pet_type": analysis_record.pet_type,
                "descripcion_automatica": descripcion_ia,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Error interno en el microservicio: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name='dispatch')
class FindMatchesView(APIView):
    """POST /api/match/find-matches/

    Body esperado:
        report_id       str (requerido)
        tipo_reporte    'perdido' | 'encontrado' (requerido)
        tipo_animal     str
        raza_probable   str (opcional)
        color           str (opcional)
        tamano          str (opcional) - tambien acepta 'tamano'
        latitud         float
        longitud        float
        fecha_reporte   str ISO (opcional)
        titulo          str (opcional, usado en notificacion)
        user_id         str|int (opcional, para no notificarse a si mismo)

    Response:
        { matches: [{reporte, score, reasons}], total: int }
    """

    def post(self, request):
        data = request.data
        report_id = data.get('report_id')
        tipo_reporte = (data.get('tipo_reporte') or '').lower()

        if not report_id or tipo_reporte not in ('perdido', 'encontrado'):
            return Response(
                {'error': 'report_id y tipo_reporte (perdido/encontrado) son requeridos'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        candidatos = listar_reportes_opuestos(tipo_reporte)
        if not candidatos:
            tipo_opuesto = 'encontrado' if tipo_reporte == 'perdido' else 'perdido'
            return Response({
                'matches': [],
                'total': 0,
                'message': (
                    f'No hay reportes de tipo "{tipo_opuesto}" para cotejar. '
                    'El match cruza reportes perdidos con encontrados.'
                ),
            })

        # Scoring
        scored = []
        for cand in candidatos:
            cand_id = str(cand.get('reporte_id') or cand.get('id') or '')
            if not cand_id or cand_id == str(report_id):
                continue
            score, reasons = calcular_score(data, cand)
            if score >= SCORE_UMBRAL:
                scored.append({'reporte': cand, 'score': score, 'reasons': reasons})

        scored.sort(key=lambda m: m['score'], reverse=True)
        top_matches = scored[:5]

        # Persistir + notificar (errores no rompen la respuesta)
        own_user_id = str(data.get('user_id') or '')
        titulo = data.get('titulo') or f'Reporte {report_id}'
        for match in top_matches:
            try:
                cand_id = str(match['reporte'].get('reporte_id') or match['reporte'].get('id'))
                lost_id, found_id = (
                    (report_id, cand_id) if tipo_reporte == 'perdido' else (cand_id, report_id)
                )
                mr, created = MatchResult.objects.get_or_create(
                    lost_report_id=lost_id,
                    found_report_id=found_id,
                    defaults={'score': match['score'], 'reasons': match['reasons']},
                )
                if not created:
                    mr.score = match['score']
                    mr.reasons = match['reasons']
                    mr.save()

                # Notificar al autor del OTRO reporte (no a si mismo)
                cand_user = match['reporte'].get('usuario_id') or match['reporte'].get('user_id')
                if cand_user and str(cand_user) != own_user_id:
                    disparar_notificacion(
                        user_id=cand_user,
                        match_id=mr.id,
                        pet_name=titulo,
                        score=match['score'],
                    )
            except Exception as e:
                print(f'[find-matches] Error guardando match: {e}')

        return Response({'matches': top_matches, 'total': len(top_matches)})
