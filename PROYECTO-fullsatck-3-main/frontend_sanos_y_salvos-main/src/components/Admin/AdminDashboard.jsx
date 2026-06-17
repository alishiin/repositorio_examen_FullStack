import './AdminDashboard.css';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/client';

export default function AdminDashboard() {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      if (response.success) {
        setDashData(response.data);
      }
    } catch (err) {
      setError('Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard-loading">Cargando dashboard...</div>;
  if (error) return <div className="dashboard-error">{error}</div>;
  if (!dashData) return null;

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>

      {/* Estadísticas principales */}
      <div className="stats-grid">
        <div className="stat-card pending">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <div className="stat-value">{dashData.totalPending}</div>
            <div className="stat-label">Pendientes de Revisión</div>
          </div>
        </div>

        <div className="stat-card missing">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <div className="stat-value">{dashData.totalMissing}</div>
            <div className="stat-label">Mascotas Perdidas</div>
          </div>
        </div>

        <div className="stat-card found">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <div className="stat-value">{dashData.totalFound}</div>
            <div className="stat-label">Mascotas Encontradas</div>
          </div>
        </div>

        <div className="stat-card recovered">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <div className="stat-value">{dashData.totalRecovered}</div>
            <div className="stat-label">Mascotas Recuperadas</div>
          </div>
        </div>
      </div>

      {/* Este mes */}
      <div className="monthly-section">
        <h3>Este Mes</h3>
        <div className="monthly-stats">
          <div className="month-stat">
            <span className="month-label">Reportes Perdidas:</span>
            <span className="month-value">{dashData.thisMonth.missing}</span>
          </div>
          <div className="month-stat">
            <span className="month-label">Reportes Encontradas:</span>
            <span className="month-value">{dashData.thisMonth.found}</span>
          </div>
          <div className="month-stat">
            <span className="month-label">Recuperadas:</span>
            <span className="month-value">{dashData.thisMonth.recovered}</span>
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="recent-activity">
        <h3>Actividad Reciente</h3>
        <div className="activity-list">
          {dashData.recentActivity.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {activity.type === 'missing' ? 'P' : 'E'}
              </div>
              <div className="activity-details">
                <div className="activity-title">
                  {activity.type === 'missing' ? 'Mascota Perdida' : 'Mascota Encontrada'}: <strong>{activity.petName}</strong>
                </div>
                <div className="activity-info">
                  {activity.reporter} • {new Date(activity.date).toLocaleDateString()} • <span className={`status-badge ${activity.status}`}>{activity.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
