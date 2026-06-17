import { useState, useCallback } from 'react';
import { mediaServiceClient } from '../services/api';

/**
 * Hook para gestionar carga de imágenes
 * Maneja multipart/form-data y progreso de carga
 * @returns { uploadImage, loading, uploadedImage, error, progress }
 */
export const useMediaUpload = () => {
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const uploadImage = useCallback(async (imageFile, description = '') => {
    setLoading(true);
    setError(null);
    setUploadedImage(null);
    setProgress(0);

    try {
      if (!imageFile) {
        throw new Error('No se proporcionó archivo de imagen');
      }

      if (!imageFile.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen válida');
      }

      // Validar tamaño (máximo 10MB)
      const MAX_SIZE = 10 * 1024 * 1024;
      if (imageFile.size > MAX_SIZE) {
        throw new Error('La imagen es demasiado grande (máximo 10MB)');
      }

      console.log(`📸 Cargando imagen: ${imageFile.name}`);
      setProgress(30); // Simulación

      const data = await mediaServiceClient.uploadPetImage(imageFile, description);
      
      setUploadedImage(data);
      setProgress(100);
      console.log('✅ Imagen cargada exitosamente:', data);
      return data;
    } catch (err) {
      console.error('❌ Error en carga:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    uploadImage,
    loading,
    uploadedImage,
    error,
    progress,
  };
};

export default useMediaUpload;
