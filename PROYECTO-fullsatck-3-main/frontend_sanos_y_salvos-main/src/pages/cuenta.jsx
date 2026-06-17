// src/pages/cuenta.jsx
import { useAuth } from '../hooks/useAuth';
import './cuenta.css';

export default function Cuenta({ onNavigate }) {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="cuenta-page">
        <h2>No autenticado</h2>
        <p>Por favor inicia sesión para ver tu cuenta</p>
      </div>
    );
  }

  const handleLogout = () => {
    if (window.confirm('¿Deseas cerrar sesión?')) {
      logout();
      onNavigate('home');
    }
  };

  return (
    <div className="cuenta-page">
      <div className="cuenta-container">
        <div className="cuenta-header">
          <div className="user-avatar">👤</div>
          <h1>Mi Cuenta</h1>
        </div>

        <div className="cuenta-info">
          <div className="info-section">
            <h2>Información Personal</h2>
            
            <div className="info-grid">
              <div className="info-item">
                <label>Nombre Completo</label>
                <p>{user?.full_name || user?.nombre || 'No especificado'}</p>
              </div>

              <div className="info-item">
                <label>Email</label>
                <p>{user?.email || user?.correo || 'No especificado'}</p>
              </div>

              {user?.rut && (
                <div className="info-item">
                  <label>RUT</label>
                  <p>{user.rut}</p>
                </div>
              )}

              {user?.phone && (
                <div className="info-item">
                  <label>Teléfono</label>
                  <p>{user.phone}</p>
                </div>
              )}

              {user?.commune && (
                <div className="info-item">
                  <label>Comuna</label>
                  <p>{user.commune}</p>
                </div>
              )}

              {user?.address && (
                <div className="info-item">
                  <label>Dirección</label>
                  <p>{user.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="cuenta-actions">
          <button className="btn-primary" onClick={() => onNavigate('home')}>
            ← Volver al inicio
          </button>
          <button className="btn-danger" onClick={handleLogout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
