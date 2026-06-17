import './AdminPetDetail.css';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/client';

export default function AdminPetDetail({ petId, onBack }) {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchPetDetail();
  }, [petId]);

  const fetchPetDetail = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPetById(petId);
      if (response.success) {
        setPet(response.data);
        setNotes(response.data.notes || '');
      }
    } catch (err) {
      setError('Error al cargar detalles');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await adminAPI.approvePet(petId, notes);
      setPet({ ...pet, status: 'approved' });
      alert('✅ Reporte aprobado exitosamente');
    } catch (err) {
      alert('Error al aprobar reporte');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await adminAPI.rejectPet(petId, rejectReason);
      setPet({ ...pet, status: 'rejected' });
      setShowRejectModal(false);
      alert('❌ Reporte rechazado');
    } catch (err) {
      alert('Error al rechazar reporte');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkRecovered = async () => {
    const clinicId = window.prompt('Ingresa el ID de la clínica:');
    if (clinicId) {
      setActionLoading(true);
      try {
        await adminAPI.recoverPet(petId, clinicId, new Date().toISOString());
        setPet({ ...pet, status: 'recovered' });
        alert('🎉 Mascota marcada como recuperada');
      } catch (err) {
        alert('Error al marcar como recuperada');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleSaveNotes = async () => {
    try {
      await adminAPI.updatePetNotes(petId, notes);
      alert('📝 Notas guardadas');
    } catch (err) {
      alert('Error al guardar notas');
    }
  };

  if (loading) return <div className="detail-loading">Cargando...</div>;
  if (error) return <div className="detail-error">{error}</div>;
  if (!pet) return null;

  return (
    <div className="pet-detail-container">
      <button className="back-btn" onClick={onBack}>← Volver</button>

      <div className="detail-header">
        <div className="detail-image">
          <img src={pet.image} alt={pet.name} />
          <span className={`type-badge ${pet.reportType}`}>
            {pet.reportType === 'missing' ? 'Perdida' : 'Encontrada'}
          </span>
        </div>

        <div className="detail-info">
          <h2>{pet.name}</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Tipo:</span>
              <span className="value">{pet.type}</span>
            </div>
            <div className="info-item">
              <span className="label">Raza:</span>
              <span className="value">{pet.breed}</span>
            </div>
            <div className="info-item">
              <span className="label">Edad:</span>
              <span className="value">{pet.age}</span>
            </div>
            <div className="info-item">
              <span className="label">Color:</span>
              <span className="value">{pet.color}</span>
            </div>
            <div className="info-item">
              <span className="label">Microchip:</span>
              <span className="value">{pet.microchip || 'No registrado'}</span>
            </div>
            <div className="info-item">
              <span className="label">Vacunado:</span>
              <span className="value">{pet.vaccinated ? 'Sí' : 'No'}</span>
            </div>
          </div>
        </div>

        <div className="detail-status">
          <span className={`status-badge status-${pet.status}`}>
            {pet.status === 'pending' && 'Pendiente'}
            {pet.status === 'approved' && 'Aprobado'}
            {pet.status === 'rejected' && 'Rechazado'}
            {pet.status === 'recovered' && 'Recuperado'}
          </span>
        </div>
      </div>

      <div className="detail-body">
        {/* Información del Reportante */}
        <section className="detail-section">
          <h3>Información del Reportante</h3>
          <div className="section-content">
            <div className="info-item">
              <span className="label">Nombre:</span>
              <span className="value">{pet.reporter.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{pet.reporter.email}</span>
            </div>
            <div className="info-item">
              <span className="label">Teléfono:</span>
              <span className="value">{pet.reporter.phone}</span>
            </div>
            <div className="info-item">
              <span className="label">Dirección:</span>
              <span className="value">{pet.reporter.address}</span>
            </div>
          </div>
        </section>

        {/* Ubicación */}
        <section className="detail-section">
          <h3>Ubicación</h3>
          <div className="section-content">
            <div className="info-item">
              <span className="label">Área:</span>
              <span className="value">{pet.location.area}</span>
            </div>
            <div className="info-item">
              <span className="label">Coordenadas:</span>
              <span className="value">{pet.location.lat}, {pet.location.lng}</span>
            </div>
          </div>
        </section>

        {/* Descripción */}
        <section className="detail-section">
          <h3>Descripción</h3>
          <p className="description">{pet.description}</p>
        </section>

        {/* Clínicas Notificadas */}
        {pet.clinics.length > 0 && (
          <section className="detail-section">
            <h3>Clínicas Notificadas</h3>
            <div className="clinics-list">
              {pet.clinics.map((clinic) => (
                <div key={clinic.id} className="clinic-item">
                  <div className="clinic-name">{clinic.name}</div>
                  <div className="clinic-status">
                    {clinic.response ? (
                      <span className="response">{clinic.response}</span>
                    ) : (
                      <span className="notified">Notificada</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notas Administrativas */}
        <section className="detail-section">
          <h3>Notas Administrativas</h3>
          <textarea
            className="notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ingresa notas internas sobre este reporte..."
            rows="5"
          />
          <button className="save-notes-btn" onClick={handleSaveNotes}>
            Guardar Notas
          </button>
        </section>

        {/* Acciones */}
        {pet.status === 'pending' && (
          <section className="actions-section">
            <h3>Acciones</h3>
            <div className="actions-grid">
              <button
                className="action-btn approve"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                Aprobar Reporte
              </button>
              <button
                className="action-btn reject"
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
              >
                Rechazar Reporte
              </button>
            </div>
          </section>
        )}

        {pet.status === 'approved' && (
          <section className="actions-section">
            <h3>Acciones</h3>
            <div className="actions-grid">
              <button
                className="action-btn recover"
                onClick={handleMarkRecovered}
                disabled={actionLoading}
              >
                Marcar como Recuperada
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Modal de Rechazo */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Rechazar Reporte</h3>
            <textarea
              placeholder="Ingresa el motivo del rechazo..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows="4"
            />
            <div className="modal-actions">
              <button
                className="btn btn-cancel"
                onClick={() => setShowRejectModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-confirm"
                onClick={handleReject}
                disabled={!rejectReason || actionLoading}
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
