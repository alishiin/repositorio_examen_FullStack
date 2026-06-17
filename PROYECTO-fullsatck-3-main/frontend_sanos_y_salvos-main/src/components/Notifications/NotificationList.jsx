import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import './NotificationList.css';

export default function NotificationList() {
  const { user } = useAuth();
  const { notifications, loading, error, fetchNotifications, markAsRead } = useNotifications();
  const userId = user?.id || user?.usuario_id;

  useEffect(() => {
    if (userId) fetchNotifications(userId);
  }, [userId, fetchNotifications]);

  if (loading) return <p className="notif-list-loading">Cargando notificaciones...</p>;
  if (error) return <p className="notif-list-error">{error}</p>;

  return (
    <div className="notification-list">
      <h3>
        <span aria-hidden="true">{'\u{1F514}'}</span> Mis Notificaciones
      </h3>
      {notifications.length === 0 ? (
        <p className="empty">No tienes notificaciones aun</p>
      ) : (
        <ul>
          {notifications.map((n) => (
            <li key={n.id} className={`notif-card ${n.read ? 'read' : 'unread'}`}>
              <div className="notif-header">
                <span className="notif-type">{n.notification_type}</span>
                <small>{new Date(n.created_at).toLocaleString()}</small>
              </div>
              <h4>{n.title}</h4>
              <p>{n.message}</p>
              {!n.read && (
                <button
                  type="button"
                  onClick={() => markAsRead(n.id)}
                  className="mark-read-btn"
                >
                  Marcar como leida
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
