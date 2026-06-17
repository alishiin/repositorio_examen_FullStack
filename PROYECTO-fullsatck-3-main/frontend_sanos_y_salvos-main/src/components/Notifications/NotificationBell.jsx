import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import './NotificationBell.css';

const POLL_INTERVAL_MS = 30000;
const MAX_DROPDOWN_ITEMS = 5;

export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, fetchNotifications, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const userId = user?.id || user?.usuario_id;

  // Auto-fetch al montar y cada 30s.
  useEffect(() => {
    if (!userId) return undefined;
    fetchNotifications(userId);
    const interval = setInterval(() => fetchNotifications(userId), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [userId, fetchNotifications]);

  // Cerrar al hacer click fuera.
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="bell-btn"
        onClick={() => setOpen(!open)}
        aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
      >
        <span aria-hidden="true">{'\u{1F514}'}</span>
        {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="bell-dropdown" role="dialog" aria-label="Notificaciones recientes">
          <div className="dropdown-header">
            <h4>Notificaciones</h4>
            <button
              type="button"
              onClick={() => fetchNotifications(userId)}
              title="Refrescar"
              className="dropdown-refresh-btn"
            >
              {'\u21BB'}
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="dropdown-empty">No tienes notificaciones</p>
          ) : (
            <ul className="dropdown-list">
              {notifications.slice(0, MAX_DROPDOWN_ITEMS).map((n) => (
                <li
                  key={n.id}
                  className={`notif-item ${n.read ? 'read' : 'unread'}`}
                  onClick={() => !n.read && markAsRead(n.id)}
                >
                  <strong>{n.title}</strong>
                  <p>{n.message}</p>
                  <small>{new Date(n.created_at).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
