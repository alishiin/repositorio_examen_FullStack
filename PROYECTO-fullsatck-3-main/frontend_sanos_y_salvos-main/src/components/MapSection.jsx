import { useState, useEffect } from 'react';
import './MapSection.css';

export default function MapSection({ setShowMap }) {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = 'http://localhost:8000/api/v1'; // Cambiar según tu backend Django
  const MAPBOX_TOKEN = import.meta.env.VITE_maptoken; // Asegúrate de tener esto en tu .env

  useEffect(() => {
    // Cargar ubicaciones del backend
    const fetchLocations = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/locations/`);
        if (!response.ok) throw new Error('Failed to fetch locations');
        const data = await response.json();
        setLocations(data);
        if (data.length > 0) {
          setSelectedLocation(data[0]);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        // Datos de ejemplo si no hay backend disponible
        setLocations([
          {
            id: 1,
            name: 'Main Branch',
            address: '123 Pet Street, City',
            phone: '+098987 876 767',
            email: 'info@website.com',
            lat: 40.7128,
            lng: -74.0060
          },
          {
            id: 2,
            name: 'Downtown Branch',
            address: '456 Animal Ave, City',
            phone: '+098987 876 768',
            email: 'downtown@website.com',
            lat: 40.7505,
            lng: -73.9972
          }
        ]);
        setSelectedLocation({
          id: 1,
          name: 'Main Branch',
          address: '123 Pet Street, City',
          phone: '+098987 876 767',
          email: 'info@website.com',
          lat: 40.7128,
          lng: -74.0060
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return (
    <section className="map-section">
      <button className="close-btn" onClick={() => setShowMap(false)}>✕</button>
      
      <div className="map-container">
        <div className="map-header">
          <h2>Find Our Locations</h2>
          <p>Visit any of our pet care centers</p>
        </div>

        {loading ? (
          <div className="loading">Loading locations...</div>
        ) : (
          <div className="map-content">
            <div className="map-sidebar">
              <h3>Our Branches</h3>
              <div className="locations-list">
                {locations.map(location => (
                  <div
                    key={location.id}
                    className={`location-item ${selectedLocation?.id === location.id ? 'active' : ''}`}
                    onClick={() => setSelectedLocation(location)}
                  >
                    <div className="location-icon">📍</div>
                    <div className="location-info">
                      <h4>{location.name}</h4>
                      <p>{location.address}</p>
                      <p className="location-phone">{location.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="map-display">
              {selectedLocation && (
                <div className="map-card">
                  <div className="map-placeholder">
                    <div className="map-marker">📍</div>
                    <p>Map View</p>
                    <small>Latitude: {selectedLocation.latitud}</small>
                    <small>Longitude: {selectedLocation.longitud}</small>
                  </div>

                  <div className="location-details">
                    <h3>{selectedLocation.titulo}</h3>
                    <div className="detail-row">
                      <span className="icon">📍</span>
                      <span>{selectedLocation.descripcion}</span>
                    </div>
                    <div className="detail-row">
                      <span className="icon">📞</span>
                      <span>{selectedLocation.phone}</span>
                    </div>
                    <div className="detail-row">
                      <span className="icon">✉️</span>
                      <span>{selectedLocation.email}</span>
                    </div>
                    <button className="get-directions">
                      Get Directions
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
