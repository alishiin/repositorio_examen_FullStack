import { useState, useCallback } from 'react';
import { notificationsServiceClient } from '../services/api';

/**
 * Hook para gestionar envío de notificaciones
 * Envía notificaciones de matches a usuarios
 * @returns { sendNotification, loading, notificationSent, error }
 */
export const useNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [notificationSent, setNotificationSent] = useState(null);
  const [error, setError] = useState(null);

  const sendNotification = useCallback(async (userId, userEmail, matchId, petName) => {
    setLoading(true);
    setError(null);
    setNotificationSent(null);

    try {
      // Validar parámetros
      if (!userId || !userEmail || !matchId || !petName) {
        throw new Error('Faltan parámetros: userId, userEmail, matchId, petName');
      }

      // Validar email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        throw new Error('Email inválido');
      }

      console.log(`📧 Enviando notificación a ${userEmail}`);

      const data = await notificationsServiceClient.triggerMatchNotification({
        userId,
        userEmail,
        matchId,
        petName,
      });

      if (data.success) {
        setNotificationSent(data);
        console.log('✅ Notificación enviada:', data);
        return data;
      } else {
        throw new Error(data.error || 'Error enviando notificación');
      }
    } catch (err) {
      console.error('❌ Error enviando notificación:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sendNotification,
    loading,
    notificationSent,
    error,
  };
};

export default useNotifications;
