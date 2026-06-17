import os
import logging
from google import genai
from PIL import Image
import io

logger = logging.getLogger(__name__)

# Lee la API key desde el entorno (.env carga via Django settings o `export`).
# Si esta vacia, el servicio entra en modo degradado: NO llama a Gemini
# y devuelve un mensaje claro al frontend.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

if not GEMINI_API_KEY:
    logger.warning(
        "GEMINI_API_KEY no esta seteada. MatchService funcionara en modo degradado "
        "(sin llamadas reales a Gemini)."
    )


class GeminiPetAnalyzer:

    @classmethod
    def analyze_pet_image(cls, image_file):
        """
        Envia la foto a Gemini para que genere una descripcion detallada en texto.

        La API key se lee de la env var `GEMINI_API_KEY`. Si esta vacia, el
        cliente fallara al autenticarse y caera en el branch de error de auth,
        devolviendo un mensaje legible al frontend (modo degradado).
        """
        try:
            # Releemos la key en cada llamada (permite override en runtime y
            # facilita tests que parchan el entorno).
            api_key = os.environ.get("GEMINI_API_KEY", "")
            client = genai.Client(api_key=api_key)

            # Convertir bytes a formato de imagen procesable
            pil_image = Image.open(io.BytesIO(image_file.read()))
            image_file.seek(0)  # Resetear el puntero de la imagen

            prompt = (
                "Eres un asistente especializado en la busqueda de mascotas. "
                "Analiza detalladamente la foto de esta mascota perdida/encontrada y genera un parrafo descriptivo en espanol "
                "ideal para una ficha de busqueda. Se muy preciso con los colores (ej: negro con patas blancas), tipo de orejas, "
                "raza aparente y tamano.\n"
                "REGLA ESTRICTA DE FORMATO: Devuelve UNICAMENTE el parrafo descriptivo. No incluyas saludos, introducciones "
                "como 'Aqui tienes el parrafo', ni encabezados en negrita como 'PERRO PERDIDO/ENCONTRADO:'. Comienza directamente con la descripcion."
            )

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[pil_image, prompt],
            )
            return response.text

        except Exception as e:
            error_str = str(e).lower()
            logger.error(f"Error en Gemini: {str(e)}", exc_info=True)

            # Manejo de error 503: Servicio saturado
            if "503" in str(e) or "service unavailable" in error_str or "overloaded" in error_str:
                return "El servicio de IA esta temporalmente saturado. Reintentando automaticamente..."

            # Manejo de error de autenticacion
            elif "401" in str(e) or "unauthorized" in error_str or "invalid" in error_str and "api" in error_str:
                return "Error de autenticacion con el servicio de IA. Contacta al administrador."

            # Manejo de timeout
            elif "timeout" in error_str or "timed out" in error_str:
                return "El analisis de la imagen tardo demasiado. Por favor, intenta con una imagen de menor tamano."

            # Manejo de error de imagen
            elif "image" in error_str or "PIL" in str(e):
                return "No se pudo procesar la imagen. Asegurate que sea un formato valido (JPG, PNG)."

            # Fallback generico
            else:
                logger.warning(f"Usando fallback para Gemini. Error: {str(e)}")
                return "No se pudo generar la descripcion automatica en este momento. Por favor, describe la mascota manualmente."
