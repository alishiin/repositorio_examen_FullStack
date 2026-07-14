import { useState, useEffect, useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapSection.css';
import ReportDetailModal from '../ReportDetailModal/ReportDetailModal';
import { useAuth } from '../../hooks/useAuth';
import { institutionProfileClient } from '../../services/api';
import { resolveImageUrl } from '../../utils/imageUrl';

// Importar mapboxgl de forma compatible con Vite
import mapboxglModule from 'mapbox-gl';

const mapboxgl = mapboxglModule;

mapboxgl.accessToken = 'pk.eyJ1IjoiZmVyZ3VpbjIzIiwiYSI6ImNtbjYzOXJ2YzAxbWMyc3EzbTUwanVtZmEifQ.GUiPoeVUgf-HlTp7WLPYJg';

export default function MapSection({ setShowMap }) {
  const [locations, setLocations] = useState([]);
  const [veterinarias, setVeterinarias] = useState([]);
  const [municipalidades, setMunicipalidades] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedVeterinaria, setSelectedVeterinaria] = useState(null);
  const [selectedMunicipalidad, setSelectedMunicipalidad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [geoStatus, setGeoStatus] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [filtro, setFiltro] = useState('ambos');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showReports, setShowReports] = useState(false);
  const [showVeterinarias, setShowVeterinarias] = useState(false);
  const [showMunicipalidades, setShowMunicipalidades] = useState(false);
  const [modalReport, setModalReport] = useState(null);
  const { user } = useAuth();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const veterinaryMarkers = useRef({});
  const municipalityMarkers = useRef({});
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
    const handleReportCreated = () => {
      setShowReports(true);
      fetchLocations();
    };

    window.addEventListener('sanos-y-salvos:report-created', handleReportCreated);
    return () => window.removeEventListener('sanos-y-salvos:report-created', handleReportCreated);
  }, [filtro]);

  useEffect(() => {
    fetchVeterinarias();
    fetchMunicipalidades();
  }, []);

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
      
      setLocations(reportes);
      setSelectedLocation(null);

      if (reportes.length > 0) {
        setGeoStatus('Reportes cargados correctamente.');
        console.log('✅ Datos REALES cargados correctamente');
      } else {
        setGeoStatus('No hay reportes disponibles para mostrar.');
        console.warn('⚠️ No hay reportes en la API');
      }
    } catch (error) {
      console.error('❌ Error crítico:', error.message);
      setSelectedLocation(null);
      setLocations([]);
      setGeoStatus('No se pudieron cargar los reportes. Verifica que el BFF y GeoService estén activos.');
    } finally {
      setLoading(false);
    }
  };

  const normalizeInstitution = (profile) => {
    const contact = profile.contact || {};
    const latitud = profile.latitud ?? profile.latitude ?? profile.location?.lat ?? profile.location?.latitud;
    const longitud = profile.longitud ?? profile.longitude ?? profile.location?.lng ?? profile.location?.longitud;

    return {
      id: profile.id || profile.type || profile.name,
      type: profile.type,
      name: profile.name,
      titulo: profile.name,
      descripcion: profile.description || profile.tagline || '',
      tagline: profile.tagline || '',
      address: profile.address || '',
      phone: contact.phone || profile.phone || '',
      email: contact.email || profile.email || '',
      hours: profile.hours || '',
      logo: profile.type === 'municipalidad' ? '🏛️' : '❤️',
      latitud: Number(latitud),
      longitud: Number(longitud),
      services: profile.services || [],
    };
  };

  const loadInstitutionGroup = async (type) => {
    const remoteProfile = await institutionProfileClient.getProfile(type).catch(() => null);
    const localProfiles = institutionProfileClient.getLocalProfiles(type);
    return [remoteProfile?.success ? remoteProfile.data : null, ...localProfiles]
      .filter(Boolean)
      .map(normalizeInstitution)
      .filter((institution) => Number.isFinite(institution.latitud) && Number.isFinite(institution.longitud));
  };

  const fetchVeterinarias = async () => {
    try {
      const nextVeterinarias = await loadInstitutionGroup('veterinaria');
      setVeterinarias(nextVeterinarias);
      setSelectedVeterinaria(null);
    } catch (error) {
      console.error('❌ Error cargando veterinarias:', error.message);
      setVeterinarias([]);
      setSelectedVeterinaria(null);
    }
  };

  const fetchMunicipalidades = async () => {
    try {
      const nextMunicipalidades = await loadInstitutionGroup('municipalidad');
      setMunicipalidades(nextMunicipalidades);
      setSelectedMunicipalidad(null);
    } catch (error) {
      console.error('❌ Error cargando municipalidades:', error.message);
      setMunicipalidades([]);
      setSelectedMunicipalidad(null);
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

  useEffect(() => {
    if (!map.current || !showVeterinarias || veterinarias.length === 0) {
      Object.values(veterinaryMarkers.current).forEach((marker) => marker.remove());
      veterinaryMarkers.current = {};
      return;
    }

    Object.values(veterinaryMarkers.current).forEach((marker) => marker.remove());
    veterinaryMarkers.current = {};

    veterinarias.forEach((institution) => {
      const el = document.createElement('div');
      el.className = 'mapbox-marker institution-marker';
      el.innerHTML = '❤️';
      el.style.fontSize = selectedVeterinaria?.id === institution.id ? '34px' : '26px';
      el.style.cursor = 'pointer';
      el.style.filter = selectedVeterinaria?.id === institution.id
        ? 'drop-shadow(0 0 10px rgba(220,20,60,0.65))'
        : 'drop-shadow(0 0 4px rgba(220,20,60,0.35))';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([institution.longitud, institution.latitud])
        .addTo(map.current);

      el.addEventListener('click', () => {
        setSelectedVeterinaria(institution);
        map.current.flyTo({
          center: [institution.longitud, institution.latitud],
          zoom: 15,
          duration: 1000,
        });
      });

      veterinaryMarkers.current[institution.id] = marker;
    });

  }, [veterinarias, selectedVeterinaria, showVeterinarias]);

  useEffect(() => {
    if (!map.current || !showMunicipalidades || municipalidades.length === 0) {
      Object.values(municipalityMarkers.current).forEach((marker) => marker.remove());
      municipalityMarkers.current = {};
      return;
    }

    Object.values(municipalityMarkers.current).forEach((marker) => marker.remove());
    municipalityMarkers.current = {};

    municipalidades.forEach((institution) => {
      const el = document.createElement('div');
      el.className = 'mapbox-marker institution-marker';
      el.innerHTML = '🏛️';
      el.style.fontSize = selectedMunicipalidad?.id === institution.id ? '34px' : '26px';
      el.style.cursor = 'pointer';
      el.style.filter = selectedMunicipalidad?.id === institution.id
        ? 'drop-shadow(0 0 10px rgba(45,64,89,0.65))'
        : 'drop-shadow(0 0 4px rgba(45,64,89,0.35))';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([institution.longitud, institution.latitud])
        .addTo(map.current);

      el.addEventListener('click', () => {
        setSelectedMunicipalidad(institution);
        map.current.flyTo({
          center: [institution.longitud, institution.latitud],
          zoom: 15,
          duration: 1000,
        });
      });

      municipalityMarkers.current[institution.id] = marker;
    });

  }, [municipalidades, selectedMunicipalidad, showMunicipalidades]);

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

                <button
                  type="button"
                  className="geo-btn geo-btn-ghost"
                  onClick={() => setShowVeterinarias((current) => !current)}
                >
                  {showVeterinarias ? '🙈 Ocultar veterinarias' : '❤️ Ver veterinarias'}
                </button>

                <button
                  type="button"
                  className="geo-btn geo-btn-ghost"
                  onClick={() => setShowMunicipalidades((current) => !current)}
                >
                  {showMunicipalidades ? '🙈 Ocultar municipalidades' : '🏛️ Ver municipalidades'}
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
                </div>
              )}

              {showVeterinarias ? (
                <>
                  <h3 className="reports-title">❤️ Veterinarias</h3>
                  <div className="locations-list">
                    {veterinarias.map((institution) => (
                      <div
                        key={institution.id}
                        className={`location-item ${selectedVeterinaria?.id === institution.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedVeterinaria(institution);
                          map.current?.flyTo({
                            center: [institution.longitud, institution.latitud],
                            zoom: 15,
                            duration: 1000,
                          });
                        }}
                        style={{ borderLeftColor: '#ff4d6d' }}
                      >
                        <div className="location-icon">❤️</div>
                        <div className="location-info">
                          <h4>{institution.name}</h4>
                          <p className="animal-type">Veterinaria</p>
                          <p className="report-date">{institution.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="reports-locked">
                  <h3>❤️ Instituciones disponibles</h3>
                </div>
              )}

              {showMunicipalidades ? (
                <>
                  <h3 className="reports-title">🏛️ Municipalidades</h3>
                  <div className="locations-list">
                    {municipalidades.map((institution) => (
                      <div
                        key={institution.id}
                        className={`location-item ${selectedMunicipalidad?.id === institution.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedMunicipalidad(institution);
                          map.current?.flyTo({
                            center: [institution.longitud, institution.latitud],
                            zoom: 15,
                            duration: 1000,
                          });
                        }}
                        style={{ borderLeftColor: '#2D4059' }}
                      >
                        <div className="location-icon">🏛️</div>
                        <div className="location-info">
                          <h4>{institution.name}</h4>
                          <p className="animal-type">Municipalidad</p>
                          <p className="report-date">{institution.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="reports-locked">
                  <h3>🏛️ Instituciones municipales</h3>
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

        {showVeterinarias && selectedVeterinaria && (
          <div className="location-popup">
            <div className="popup-header">
              <h3>{selectedVeterinaria.titulo}</h3>
              <span className="badge badge-encontrado">❤️ Veterinaria</span>
            </div>

            <div className="popup-row">
              <span className="icon"></span>
              <span>{selectedVeterinaria.descripcion}</span>
            </div>

            <div className="popup-grid">
              <div className="popup-item">
                <span className="label">Dirección</span>
                <span className="value">{selectedVeterinaria.address}</span>
              </div>
              <div className="popup-item">
                <span className="label">Horario</span>
                <span className="value">{selectedVeterinaria.hours || 'N/A'}</span>
              </div>
              <div className="popup-item">
                <span className="label">Teléfono</span>
                <span className="value">{selectedVeterinaria.phone || 'N/A'}</span>
              </div>
              <div className="popup-item">
                <span className="label">Email</span>
                <span className="value">{selectedVeterinaria.email || 'N/A'}</span>
              </div>
            </div>

            <div className="popup-row">
              <span className="icon">📍</span>
              <span>{selectedVeterinaria.latitud.toFixed(4)}, {selectedVeterinaria.longitud.toFixed(4)}</span>
            </div>

            <button
              className="google-maps-btn"
              onClick={() => {
                window.open(
                  `https://www.google.com/maps/search/${selectedVeterinaria.latitud},${selectedVeterinaria.longitud}`,
                  '_blank'
                );
              }}
            >
              Ver en Google Maps
            </button>
          </div>
        )}

        {showMunicipalidades && selectedMunicipalidad && (
          <div className="location-popup">
            <div className="popup-header">
              <h3>{selectedMunicipalidad.titulo}</h3>
              <span className="badge badge-encontrado">🏛️ Municipalidad</span>
            </div>

            <div className="popup-row">
              <span className="icon"></span>
              <span>{selectedMunicipalidad.descripcion}</span>
            </div>

            <div className="popup-grid">
              <div className="popup-item">
                <span className="label">Dirección</span>
                <span className="value">{selectedMunicipalidad.address}</span>
              </div>
              <div className="popup-item">
                <span className="label">Horario</span>
                <span className="value">{selectedMunicipalidad.hours || 'N/A'}</span>
              </div>
              <div className="popup-item">
                <span className="label">Teléfono</span>
                <span className="value">{selectedMunicipalidad.phone || 'N/A'}</span>
              </div>
              <div className="popup-item">
                <span className="label">Email</span>
                <span className="value">{selectedMunicipalidad.email || 'N/A'}</span>
              </div>
            </div>

            <div className="popup-row">
              <span className="icon">📍</span>
              <span>{selectedMunicipalidad.latitud.toFixed(4)}, {selectedMunicipalidad.longitud.toFixed(4)}</span>
            </div>

            <button
              className="google-maps-btn"
              onClick={() => {
                window.open(
                  `https://www.google.com/maps/search/${selectedMunicipalidad.latitud},${selectedMunicipalidad.longitud}`,
                  '_blank'
                );
              }}
            >
              Ver en Google Maps
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
