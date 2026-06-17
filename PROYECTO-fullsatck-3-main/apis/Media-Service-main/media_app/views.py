from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, parsers
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import PetImage
from .serializers import PetImageSerializer

@method_decorator(csrf_exempt, name='dispatch')
class ImageUploadView(APIView):
    # 'MultiPartParser' permite recibir archivos adjuntos en formularios binarios
    parser_classes = (parsers.MultiPartParser, parsers.FormParser)

    def post(self, request, *args, **kwargs):
        serializer = PetImageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            # Retorna la información de la imagen incluyendo su nueva URL pública
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)