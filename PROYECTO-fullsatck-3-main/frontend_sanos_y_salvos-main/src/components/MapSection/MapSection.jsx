import { useState, useEffect, useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapSection.css';
import ReportDetailModal from '../ReportDetailModal/ReportDetailModal';
import { useAuth } from '../../hooks/useAuth';
import { resolveImageUrl } from '../../utils/imageUrl';

// Importar mapboxgl de forma compatible con Vite
import mapboxglModule from 'mapbox-gl';

const mapboxgl = mapboxglModule;

mapboxgl.accessToken = 'pk.eyJ1IjoiZmVyZ3VpbjIzIiwiYSI6ImNtbjYzOXJ2YzAxbWMyc3EzbTUwanVtZmEifQ.GUiPoeVUgf-HlTp7WLPYJg';

export default function MapSection({ setShowMap }) {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [geoStatus, setGeoStatus] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [filtro, setFiltro] = useState('ambos');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showReports, setShowReports] = useState(false);
  const [modalReport, setModalReport] = useState(null);
  const { user } = useAuth();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const userMarker = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_GEO_SERVICE_URL || 'http://localhost:5000/api';

  const centerOnUserLocation = () => {
    if (userLocation && map.current) {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 14,
        duration: 900,
      });
      userMarker.current?.togglePopup?.();
      return;
    }

    locateUser();
  };

  useEffect(() => {
    fetchLocations();
  }, [filtro]);

  useEffect(() => {
    locateUser();
  }, []);

  useEffect(() => {
    if (!mapReady || !map.current || !userLocation) return;

    userMarker.current?.remove();
    userMarker.current = new mapboxgl.Marker({ color: '#2D4059' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new mapboxgl.Popup({ offset: 24 }).setText('Tu ubicación actual'))
      .addTo(map.current);

    map.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      duration: 900,
    });
  }, [userLocation, mapReady]);

  const locateUser = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Tu navegador no soporta geolocalización.');
      return;
    }

    setGeoStatus('Solicitando ubicación...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setUserLocation(nextLocation);
        setGeoStatus('Ubicación actual obtenida correctamente.');

      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus('No concediste permiso de ubicación. Puedes usar el mapa manualmente.');
          return;
        }

        setGeoStatus('No fue posible obtener tu ubicación. Intenta nuevamente.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/ubicaciones/`;
      console.log('🔍 Fetching from:', url);
      
      const params = new URLSearchParams();
      if (filtro !== 'ambos') {
        params.append('tipo_reporte', filtro);
      }
      
      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
      console.log('📍 Full URL:', fullUrl);

      const response = await fetch(fullUrl);
      console.log('📊 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ API Response:', data);
      
      // Manejo de diferentes formatos de respuesta
      let reportes = [];
      if (data.results && Array.isArray(data.results)) {
        reportes = data.results;
      } else if (Array.isArray(data)) {
        reportes = data;
      }
      
      console.log(`📌 Total reportes: ${reportes.length}`);
      
      if (reportes.length > 0) {
        setLocations(reportes);
        setSelectedLocation(null);
        console.log('✅ Datos REALES cargados correctamente');
      } else {
        console.warn('⚠️ No hay reportes en la API');
        throw new Error('No hay reportes disponibles');
      }
    } catch (error) {
      console.error('❌ Error crítico:', error.message);
      console.log('📌 Mostrando fallback de demo ...');
      
      // FALLBACK - Solo mostrar si la API falla
      setSelectedLocation(null);
      const demoLocations = [
        {
          id: 1,
          latitud: -33.8688,
          longitud: -71.2093,
          titulo: 'Perro Perdido - Golden Retriever',
          descripcion: 'Se perdió en Providencia. Responde por Toby.',
          tipo_reporte: 'perdido',
          tipo_animal: 'perro',
          raza_probable: 'Golden Retriever',
          color: 'Dorado',
          tamaño: 'Grande',
          fecha_reporte: '2026-05-05'
        },
        {
          id: 2,
          latitud: -33.8736,
          longitud: -71.1873,
          titulo: 'Gato Encontrado - Blanco y Negro',
          descripcion: 'Encontrado en Las Condes.',
          tipo_reporte: 'encontrado',
          tipo_animal: 'gato',
          raza_probable: 'Criollo',
          color: 'Blanco y Negro',
          tamaño: 'Pequeño',
          fecha_reporte: '2026-05-07'
        }
      ];
      setLocations(demoLocations);
    } finally {
      setLoading(false);
    }
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-71.2093, -33.8688],
      zoom: 12
    });

    setMapReady(true);

    return () => {
      userMarker.current?.remove();
      if (map.current) map.current.remove();
      map.current = null;
      setMapReady(false);
    };
  }, []);

  // Agregar marcadores cuando cambien locations o selectedLocation
  useEffect(() => {
    if (!map.current || !showReports || locations.length === 0) {
      Object.values(markers.current).forEach((marker) => marker.remove());
      markers.current = {};
      return;
    }

    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    locations.forEach(location => {
      const el = document.createElement('div');
      el.className = 'mapbox-marker';
      el.innerHTML = location.tipo_reporte === 'perdido' ? '🔍' : '✅';
      el.style.fontSize = selectedLocation?.id === location.id ? '32px' : '24px';
      el.style.cursor = 'pointer';
      el.style.filter = selectedLocation?.id === location.id 
        ? 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' 
        : 'drop-shadow(0 0 3px rgba(0,0,0,0.3))';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.longitud, location.latitud])
        .addTo(map.current);

      el.addEventListener('click', () => {
        setSelectedLocation(location);
        map.current.flyTo({
          center: [location.longitud, location.latitud],
          zoom: 15,
          duration: 1000
        });
      });

      markers.current[location.id] = marker;
    });

  }, [locations, selectedLocation, showReports]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <section className="map-section">
      <button className="close-btn" onClick={() => setShowMap(false)}>✕</button>
      <button
        type="button"
        className="recenter-map-btn"
        onClick={centerOnUserLocation}
        aria-label="Centrar mi ubicación actual"
        title="Centrar mi ubicación actual"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="2.2" fill="currentColor" />
          <path d="M12 2.8v3.1M12 18.1v3.1M2.8 12h3.1M18.1 12h3.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span>Centrar ubicación</span>
      </button>
      
      <div className="map-wrapper">
        <div ref={mapContainer} className="mapbox-container"></div>

        {/* Sidebar con filtros y reportes */}
        <div className={`map-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>

          {sidebarOpen && (
            <>
              <div className="sidebar-filters">
                <h3>🔍 Filtros</h3>

                <button type="button" className="geo-btn geo-btn-focus" onClick={centerOnUserLocation}>
                  <span aria-hidden="true">📍</span>
                  <span>Centrar mi ubicación actual</span>
                </button>

                <button type="button" className="geo-btn" onClick={locateUser}>
                  📍 Actualizar mi ubicación
                </button>

                <button
                  type="button"
                  className="geo-btn geo-btn-ghost"
                  onClick={() => setShowReports((current) => !current)}
                >
                  {showReports ? '🙈 Ocultar reportes' : '👁️ Ver reportes'}
                </button>

                {geoStatus && <p className="geo-status">{geoStatus}</p>}
                
                <div className="filter-group">
                  <label>Tipo de Reporte</label>
                  <select 
                    value={filtro} 
                    onChange={(e) => setFiltro(e.target.value)}
                    className="filter-select"
                  >
                    <option value="ambos">Todos</option>
                    <option value="perdido">🔍 Perdidos</option>
                    <option value="encontrado">✅ Encontrados</option>
                  </select>
                </div>

                <p className="filter-count">
                  {locations.length} reporte{locations.length !== 1 ? 's' : ''}
                </p>
              </div>

              {showReports ? (
                <>
                  <h3 className="reports-title">📋 Reportes</h3>
                  <div className="locations-list">
                    {locations.map(location => (
                      <div
                        key={location.id}
                        className={`location-item ${selectedLocation?.id === location.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedLocation(location);
                          map.current?.flyTo({
                            center: [location.longitud, location.latitud],
                            zoom: 15,
                            duration: 1000
                          });
                        }}
                        style={{ 
                          borderLeftColor: location.tipo_reporte === 'perdido' ? '#ff6b6b' : '#51cf66' 
                        }}
                      >
                        <div className="location-icon">
                          {location.tipo_reporte === 'perdido' ? '🔍' : '✅'}
                        </div>
                        <div className="location-info">
                          <h4>{location.titulo}</h4>
                          <p className="animal-type">
                            {location.tipo_animal} • {location.raza_probable}
                          </p>
                          <p className="report-date">{formatDate(location.fecha_reporte)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="reports-locked">
                  <h3>📍 Tu ubicación está activa</h3>
                  <p>Los reportes están ocultos. Pulsa “Ver reportes” si quieres verlos en el mapa.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Panel de detalles del reporte seleccionado */}
        {showReports && selectedLocation && (
          <div className="location-popup">
            <div className="popup-header">
              <h3>{selectedLocation.titulo}</h3>
              <span className={`badge badge-${selectedLocation.tipo_reporte}`}>
                {selectedLocation.tipo_reporte === 'perdido' ? '🔍 Perdido' : '✅ Encontrado'}
              </span>
            </div>

            <div className="popup-row">
              <span className="icon"></span>
              <span>{selectedLocation.descripcion}</span>
            </div>

            {resolveImageUrl(selectedLocation.imagen_url) && (
              <img
                src={resolveImageUrl(selectedLocation.imagen_url)}
                alt={selectedLocation.titulo || 'Foto del reporte'}
                className="report-popup-image"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}

            <div className="popup-grid">
              <div className="popup-item">
                <span className="label">Animal</span>
                <span className="value">{selectedLocation.tipo_animal}</span>
              </div>
              <div className="popup-item">
                <span className="label">Raza</span>
                <span className="value">{selectedLocation.raza_probable}</span>
              </div>
              <div className="popup-item">
                <span className="label">Color</span>
                <span className="value">{selectedLocation.color}</span>
              </div>
              <div className="popup-item">
                <span className="label">Tamaño</span>
                <span className="value">{selectedLocation.tamaño}</span>
              </div>
            </div>

            <div className="popup-row">
              <span className="icon">📍</span>
              <span>{selectedLocation.latitud.toFixed(4)}, {selectedLocation.longitud.toFixed(4)}</span>
            </div>

            <div className="popup-row">
              <span className="icon">📅</span>
              <span>Reportado: {formatDate(selectedLocation.fecha_reporte)}</span>
            </div>

            <button 
              className="google-maps-btn"
              onClick={() => {
                window.open(
                  `https://www.google.com/maps/search/${selectedLocation.latitud},${selectedLocation.longitud}`,
                  '_blank'
                );
              }}
            >
              Ver en Google Maps
            </button>

            <button
              type="button"
              className="google-maps-btn"
              style={{ marginTop: 8, background: '#0071ce', color: '#fff' }}
              onClick={() => setModalReport(selectedLocation)}
            >
              Ver detalles, chat y coincidencias
            </button>
          </div>
        )}
      </div>

      <ReportDetailModal
        report={modalReport}
        isOpen={!!modalReport}
        onClose={() => setModalReport(null)}
        currentUser={user}
      />
    </section>
  );
}
