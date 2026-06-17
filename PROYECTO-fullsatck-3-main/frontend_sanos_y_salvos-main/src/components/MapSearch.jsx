// src/components/MapSearch.jsx
import { useState } from 'react';
import { useGeoService } from '../hooks/useGeoService';
import './MapSearch.css';

export function MapSearch() {
  const { loading, error, data, searchNearby } = useGeoService();
  const [latitude, setLatitude] = useState(-33.8688);
  const [longitude, setLongitude] = useState(-71.2093);
  const [radius, setRadius] = useState(10);
  const [reportType, setReportType] = useState('ambos');

  const handleSearch = async (e) => {
    e.preventDefault();
    await searchNearby(latitude, longitude, radius, reportType);
  };

  return (
    <div className="map-search">
      <form onSubmit={handleSearch} className="search-form">
        <div className="input-group">
          <label htmlFor="latitude">Latitud</label>
          <input
            id="latitude"
            type="number"
            value={latitude}
            onChange={(e) => setLatitude(Number(e.target.value))}
            placeholder="Latitud"
            step="0.0001"
          />
        </div>

        <div className="input-group">
          <label htmlFor="longitude">Longitud</label>
          <input
            id="longitude"
            type="number"
            value={longitude}
            onChange={(e) => setLongitude(Number(e.target.value))}
            placeholder="Longitud"
            step="0.0001"
          />
        </div>

        <div className="input-group">
          <label htmlFor="radius">Radio (km)</label>
          <input
            id="radius"
            type="number"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            placeholder="Radio (km)"
            min="1"
            max="50"
          />
        </div>

        <div className="input-group">
          <label htmlFor="reportType">Tipo de Reporte</label>
          <select
            id="reportType"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="select-input"
          >
            <option value="ambos">Ambos</option>
            <option value="perdido">🔍 Perdido</option>
            <option value="encontrado">✅ Encontrado</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="search-btn">
          {loading ? '⏳ Buscando...' : '🔍 Buscar'}
        </button>
      </form>

      {error && <div className="error-message">⚠️ Error: {error}</div>}

      {data && (
        <div className="results-container">
          <h3>📍 Encontrados: {data.reportes?.length || 0}</h3>
          {data.reportes && data.reportes.length > 0 ? (
            <ul className="results-list">
              {data.reportes.map((reporte) => (
                <li key={reporte.id} className="result-item">
                  <div className="result-header">
                    <strong>{reporte.titulo}</strong>
                    <span className="distance">
                      {reporte.distancia_km?.toFixed(2)} km
                    </span>
                  </div>
                  <p className="result-description">{reporte.descripcion}</p>
                  <div className="result-meta">
                    <span>{reporte.tipo_animal}</span>
                    <span>{reporte.raza_probable}</span>
                    <span>{reporte.fecha_reporte}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-results">No se encontraron reportes en el área</p>
          )}
        </div>
      )}
    </div>
  );
}
