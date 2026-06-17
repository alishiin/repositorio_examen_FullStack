import { useState, useCallback } from 'react';
import { matchServiceClient } from '../services/api';

/**
 * Hook para gestionar análisis de imágenes de mascotas
 * Usa IA (Gemini) para encontrar coincidencias
 * @returns { analyzeImage, loading, result, error }
 */
export const useMatchAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyzeImage = useCallback(async (reportId, petType, imageFile) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!reportId || !petType || !imageFile) {
        throw new Error('Faltan parámetros: reportId, petType, imageFile');
      }

      if (!['perro', 'gato'].includes(petType.toLowerCase())) {
        throw new Error('Tipo de mascota debe ser "perro" o "gato"');
      }

      console.log(`🔍 Analizando imagen: ${reportId}, ${petType}`);

      const data = await matchServiceClient.analyzeWithImage(reportId, petType, imageFile);
      
      setResult(data);
      console.log('✅ Análisis completado:', data);
      return data;
    } catch (err) {
      console.error('❌ Error en análisis:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analyzeImage,
    loading,
    result,
    error,
  };
};

export default useMatchAnalysis;
