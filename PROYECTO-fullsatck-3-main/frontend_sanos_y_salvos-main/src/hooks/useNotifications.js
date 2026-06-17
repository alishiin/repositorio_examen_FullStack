import { useState, useCallback, useMemo } from 'react';
import { notificationsServiceClient } from '../services/api';

/**
 * Hook para gestionar notificaciones in-app (FASE 1B) + envio de notificaciones.
 *
 * Expone:
 *  - notifications (array)
 *  - unreadCount (number)
 *  - loading
 *  - error
 *  - fetchNotifications(userId)  -> GET al BFF
 *  - markAsRead(notificationId)  -> POST al BFF
 *  - sendNotification(userId, userEmail, matchId, petName)  -> POST trigger-match (compat)
 *  - notificationSent (resultado del ultimo sendNotification, compat)
 */
export const useNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [notificationSent, setNotificationSent] = useState(null);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const fetchNotifications = useCallback(async (userId) => {
    if (!userId) return [];
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsServiceClient.listNotifications(userId);
      // DRF puede devolver lista pura o {results: []} segun pagination.
      const list = Array.isArray(data) ? data : (data?.results || []);
      setNotifications(list);
      return list;
    } catch (err) {
      console.error('Error fetchNotifications:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return null;
    try {
      const data = await notificationsServiceClient.markAsRead(notificationId);
      // Actualizacion optimista local: marca la notif en el state.
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      return data;
    } catch (err) {
      console.error('Error markAsRead:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  const sendNotification = useCallback(async (userId, userEmail, matchId, petName) => {
    setLoading(true);
    setError(null);
    setNotificationSent(null);

    try {
      if (!userId || !userEmail || !matchId || !petName) {
        throw new Error('Faltan parametros: userId, userEmail, matchId, petName');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        throw new Error('Email invalido');
      }

      console.log(`Enviando notificacion a ${userEmail}`);

      const data = await notificationsServiceClient.triggerMatchNotification({
        userId,
        userEmail,
        matchId,
        petName,
      });

      if (data.success) {
        setNotificationSent(data);
        console.log('Notificacion enviada:', data);
        return data;
      } else {
        throw new Error(data.error || 'Error enviando notificacion');
      }
    } catch (err) {
      console.error('Error enviando notificacion:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // FASE 1B (in-app)
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    // compat existente
    sendNotification,
    notificationSent,
    // comunes
    loading,
    error,
  };
};

export default useNotifications;
