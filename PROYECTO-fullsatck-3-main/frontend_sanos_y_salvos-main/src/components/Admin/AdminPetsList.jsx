import './AdminPetsList.css';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/client';

export default function AdminPetsList({ onSelectPet }) {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });

  useEffect(() => {
    fetchPets();
  }, [filters]);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPets(filters);
      if (response.success) {
        setPets(response.data);
      }
    } catch (err) {
      setError('Error al cargar mascotas');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (e) => {
    setFilters({ ...filters, status: e.target.value });
  };

  const handleTypeChange = (e) => {
    setFilters({ ...filters, type: e.target.value });
  };

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  return (
    <div className="pets-list-container">
      <h2>Gestionar Reportes</h2>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Tipo de Reporte</label>
          <select value={filters.type} onChange={handleTypeChange}>
            <option value="all">Todos</option>
            <option value="missing">Perdidas</option>
            <option value="found">Encontradas</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Estado</label>
          <select value={filters.status} onChange={handleStatusChange}>
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
            <option value="recovered">Recuperados</option>
          </select>
        </div>

        <div className="filter-group search">
          <input
            type="text"
            placeholder="Buscar por nombre o reportante..."
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Lista de mascotas */}
      <div className="pets-list">
        {loading && <div className="loading">Cargando...</div>}
        {error && <div className="error">{error}</div>}

        {!loading && pets.length === 0 && (
          <div className="no-results">No hay reportes que mostrar</div>
        )}

        {!loading && pets.map((pet) => (
          <div
            key={pet.id}
            className={`pet-card status-${pet.status}`}
            onClick={() => onSelectPet(pet.id)}
          >
            <div className="pet-image">
              <img src={pet.image} alt={pet.name} />
            </div>

            <div className="pet-info">
              <div className="pet-name">
                {pet.name}
                <span className={`type-badge ${pet.reportType}`}>
                  {pet.reportType === 'missing' ? 'Perdida' : 'Encontrada'}
                </span>
              </div>
              <div className="pet-details">
                <span>{pet.type} • {pet.breed}</span>
                <span>Por: {pet.reporter}</span>
                <span>{new Date(pet.reportDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pet-status">
              <span className={`status-label status-${pet.status}`}>
                {pet.status === 'pending' && 'Pendiente'}
                {pet.status === 'approved' && 'Aprobado'}
                {pet.status === 'rejected' && 'Rechazado'}
                {pet.status === 'recovered' && 'Recuperado'}
              </span>
            </div>

            <div className="pet-action">
              <button className="detail-btn">Ver Detalle →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
