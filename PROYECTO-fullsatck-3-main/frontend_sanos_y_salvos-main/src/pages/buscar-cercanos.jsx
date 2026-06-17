// src/pages/buscar-cercanos.jsx
import { ReportForm } from '../components/ReportForm/ReportForm';
import { useAuth } from '../hooks/useAuth';
import './buscar-cercanos.css';

export default function BuscarCercanos({ onClose }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="buscar-cercanos-page">
        <div className="page-content">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="buscar-cercanos-page">
        <div className="page-header">
          <button className="close-btn" onClick={onClose} title="Volver">
            ✕
          </button>
          <div className="header-content">
            <h1>📝 Crear Reporte de Mascota</h1>
            <p>Publica tu reporte de mascota perdida o encontrada para que otros puedan ayudar</p>
          </div>
        </div>

        <div className="page-content">
          <div className="auth-required">
            <div className="auth-icon">🔐</div>
            <h2>Debes iniciar sesión</h2>
            <p>Para reportar una mascota perdida o encontrada, necesitas tener una cuenta activa.</p>
            
            <button 
              className="login-button"
              onClick={onClose}
            >
              ← Volver y Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="buscar-cercanos-page">
      <div className="page-header">
        <button className="close-btn" onClick={onClose} title="Volver">
          ✕
        </button>
        <div className="header-content">
          <h1>📝 Crear Reporte de Mascota</h1>
          <p>Publica tu reporte de mascota perdida o encontrada para que otros puedan ayudar</p>
        </div>
      </div>

      <div className="page-content">
        <ReportForm onSuccess={onClose} />
      </div>
    </div>
  );
}
