import os
import logging
from google import genai
from PIL import Image
import io

logger = logging.getLogger(__name__)

class GeminiPetAnalyzer:

    @classmethod
    def analyze_pet_image(cls, image_file):
        """
        Envía la foto a Gemini para que genere una descripción detallada en texto.
        """
        try:
            # PEGAMOS TU CLAVE DIRECTO AQUÍ (Asegúrate de mantener las comillas)
            MI_API_KEY = "AQ.Ab8RN6KvFlMYnU9k3spWY4FhiUbyzHVxp-wLMeqQ9S_8DkFMyQ"

            # Inicializamos el cliente pasándole la clave de forma explícita
            client = genai.Client(api_key=MI_API_KEY)

            # Convertir bytes a formato de imagen procesable
            pil_image = Image.open(io.BytesIO(image_file.read()))
            image_file.seek(0) # Resetear el puntero de la imagen

            prompt = (
                    "Eres un asistente especializado en la búsqueda de mascotas. "
                    "Analiza detalladamente la foto de esta mascota perdida/encontrada y genera un párrafo descriptivo en español "
                    "ideal para una ficha de búsqueda. Sé muy preciso con los colores (ej: negro con patas blancas), tipo de orejas, "
                    "raza aparente y tamaño.\n"
                    "REGLA ESTRICTA DE FORMATO: Devuelve ÚNICAMENTE el párrafo descriptivo. No incluyas saludos, introducciones "
                    "como 'Aquí tienes el párrafo', ni encabezados en negrita como 'PERRO PERDIDO/ENCONTRADO:'. Comienza directamente con la descripción."
            )

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[pil_image, prompt]
            )
            return response.text
        
        except Exception as e:
            error_str = str(e).lower()
            logger.error(f"Error en Gemini: {str(e)}", exc_info=True)
            
            # Manejo de error 503: Servicio saturado
            if "503" in str(e) or "service unavailable" in error_str or "overloaded" in error_str:
                return "⚠️ El servicio de IA está temporalmente saturado. Reintentando automáticamente..."
            
            # Manejo de error de autenticación
            elif "401" in str(e) or "unauthorized" in error_str or "invalid" in error_str and "api" in error_str:
                return "⚠️ Error de autenticación con el servicio de IA. Contacta al administrador."
            
            # Manejo de timeout
            elif "timeout" in error_str or "timed out" in error_str:
                return "⚠️ El análisis de la imagen tardó demasiado. Por favor, intenta con una imagen de menor tamaño."
            
            # Manejo de error de imagen
            elif "image" in error_str or "PIL" in str(e):
                return "⚠️ No se pudo procesar la imagen. Asegúrate que sea un formato válido (JPG, PNG)."
            
            # Fallback genérico con generador básico
            else:
                logger.warning(f"Usando fallback para Gemini. Error: {str(e)}")
                return "⚠️ No se pudo generar la descripción automática en este momento. Por favor, describe la mascota manualmente."