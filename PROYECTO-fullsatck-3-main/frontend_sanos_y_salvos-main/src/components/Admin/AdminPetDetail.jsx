import './AdminPetDetail.css';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/client';
import UiDialog from '../UiDialog/UiDialog';

export default function AdminPetDetail({ petId, onBack }) {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoveryClinicId, setRecoveryClinicId] = useState('');
  const [dialog, setDialog] = useState({ open: false, tone: 'info', title: '', message: '' });
  const [editForm, setEditForm] = useState({
    titulo: '', descripcion: '', tipo_reporte: 'perdido', tipo_animal: '',
    raza_probable: '', color: '', 'tamaño': '', estado: 'activo'
  });

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
        setEditForm({
          titulo: response.data.location?.area || '',
          descripcion: response.data.description || '',
          tipo_reporte: response.data.reportType === 'missing' ? 'perdido' : 'encontrado',
          tipo_animal: response.data.type || '',
          raza_probable: response.data.breed === 'Desconocida' ? '' : (response.data.breed || ''),
          color: response.data.color === 'No especificado' ? '' : (response.data.color || ''),
          'tamaño': response.data['tamaño'] || '',
          estado: response.data.estado || 'activo'
        });
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
      setDialog({ open: true, tone: 'success', title: 'Reporte aprobado', message: 'El reporte fue aprobado exitosamente.' });
    } catch (err) {
      setDialog({ open: true, tone: 'error', title: 'No se pudo aprobar', message: err.message || 'Error al aprobar reporte' });
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
      setDialog({ open: true, tone: 'warning', title: 'Reporte rechazado', message: 'La publicación fue rechazada.' });
    } catch (err) {
      setDialog({ open: true, tone: 'error', title: 'No se pudo rechazar', message: err.message || 'Error al rechazar reporte' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkRecovered = async () => {
    setRecoveryClinicId('');
    setShowRecoverModal(true);
  };

  const handleSaveNotes = async () => {
    try {
      await adminAPI.updatePetNotes(petId, notes);
      setDialog({ open: true, tone: 'success', title: 'Notas guardadas', message: 'Las notas administrativas se guardaron correctamente.' });
    } catch (err) {
      setDialog({ open: true, tone: 'error', title: 'No se pudieron guardar', message: err.message || 'Error al guardar notas' });
    }
  };

  const handleSaveEdit = async () => {
    setActionLoading(true);
    try {
      await adminAPI.updatePet(petId, editForm);
      await fetchPetDetail();
      setShowEditModal(false);
      setDialog({ open: true, tone: 'success', title: 'Reporte actualizado', message: 'Los cambios se guardaron correctamente.' });
    } catch (err) {
      setDialog({ open: true, tone: 'error', title: 'No se pudo actualizar', message: err.message || 'Error al actualizar reporte' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setDialog({
      open: true,
      tone: 'warning',
      title: 'Eliminar reporte',
      message: '¿Estás seguro de eliminar este reporte? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      showCancel: true,
      onCancel: () => setDialog((prev) => ({ ...prev, open: false })),
      onConfirm: async () => {
        setDialog((prev) => ({ ...prev, open: false }));
        await confirmDelete();
      },
    });
    return;
  };

  const confirmDelete = async () => {
    setActionLoading(true);
    try {
      await adminAPI.deletePet(petId);
      setDialog({ open: true, tone: 'success', title: 'Reporte eliminado', message: 'El reporte fue eliminado correctamente.' });
      onBack();
    } catch (err) {
      setDialog({ open: true, tone: 'error', title: 'No se pudo eliminar', message: err.message || 'Error al eliminar reporte' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecoverSubmit = async () => {
    if (!recoveryClinicId.trim()) return;
    setActionLoading(true);
    try {
      await adminAPI.recoverPet(petId, recoveryClinicId, new Date().toISOString());
      setPet({ ...pet, status: 'recovered' });
      setShowRecoverModal(false);
      setDialog({ open: true, tone: 'success', title: 'Mascota recuperada', message: 'La mascota fue marcada como recuperada.' });
    } catch (err) {
      setDialog({ open: true, tone: 'error', title: 'No se pudo marcar', message: err.message || 'Error al marcar como recuperada' });
    } finally {
      setActionLoading(false);
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
            <div className="info-item">
              <span className="label">Estado mascota:</span>
              <span className={`value estado-${pet.estado || 'activo'}`}>
                {pet.estado === 'resuelto' && 'Resuelto (devuelto)'}
                {pet.estado === 'cerrado' && 'Cerrado'}
                {(!pet.estado || pet.estado === 'activo') && 'Activo (vigente)'}
              </span>
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

      <UiDialog
        open={dialog.open}
        tone={dialog.tone}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel || 'Aceptar'}
        cancelLabel={dialog.cancelLabel || 'Cancelar'}
        showCancel={dialog.showCancel}
        onCancel={dialog.onCancel}
        onConfirm={dialog.onConfirm || (() => setDialog((prev) => ({ ...prev, open: false })))}
      />

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

        {/* Editar / Eliminar — siempre disponibles */}
        <section className="actions-section">
          <h3>Editar / Eliminar</h3>
          <div className="actions-grid">
            <button
              className="action-btn edit"
              onClick={() => setShowEditModal(true)}
              disabled={actionLoading}
            >
              Editar Reporte
            </button>
            <button
              className="action-btn delete"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              Eliminar Reporte
            </button>
          </div>
        </section>
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

      {showRecoverModal && (
        <UiDialog
          open={showRecoverModal}
          tone="info"
          title="Marcar como recuperada"
          message="Ingresa el ID de la clínica donde fue recuperada la mascota."
          confirmLabel={actionLoading ? 'Guardando...' : 'Confirmar'}
          cancelLabel="Cancelar"
          showCancel
          onCancel={() => setShowRecoverModal(false)}
          onConfirm={handleRecoverSubmit}
        >
          <label className="recover-input-label">
            ID de la clínica
            <input
              type="text"
              value={recoveryClinicId}
              onChange={(e) => setRecoveryClinicId(e.target.value)}
              placeholder="Ej: 24"
            />
          </label>
        </UiDialog>
      )}

      {/* Modal de Edición */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal modal-edit">
            <h3>Editar Reporte</h3>

            <label>
              Título / Zona
              <input
                type="text"
                value={editForm.titulo}
                onChange={e => setEditForm({ ...editForm, titulo: e.target.value })}
              />
            </label>

            <label>
              Descripción
              <textarea
                rows="3"
                value={editForm.descripcion}
                onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })}
              />
            </label>

            <label>
              Tipo de reporte
              <select
                value={editForm.tipo_reporte}
                onChange={e => setEditForm({ ...editForm, tipo_reporte: e.target.value })}
              >
                <option value="perdido">Perdido</option>
                <option value="encontrado">Encontrado</option>
              </select>
            </label>

            <label>
              Estado
              <select
                value={editForm.estado}
                onChange={e => setEditForm({ ...editForm, estado: e.target.value })}
              >
                <option value="activo">Activo (vigente)</option>
                <option value="resuelto">Resuelto (devuelto)</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </label>

            <label>
              Tipo de animal
              <select
                value={editForm.tipo_animal}
                onChange={e => setEditForm({ ...editForm, tipo_animal: e.target.value })}
              >
                <option value="">Selecciona</option>
                <option value="perro">Perro</option>
                <option value="gato">Gato</option>
                <option value="otro">Otro</option>
              </select>
            </label>

            <label>
              Raza
              <input
                type="text"
                value={editForm.raza_probable}
                onChange={e => setEditForm({ ...editForm, raza_probable: e.target.value })}
              />
            </label>

            <label>
              Color
              <input
                type="text"
                value={editForm.color}
                onChange={e => setEditForm({ ...editForm, color: e.target.value })}
              />
            </label>

            <label>
              Tamaño
              <select
                value={editForm['tamaño']}
                onChange={e => setEditForm({ ...editForm, 'tamaño': e.target.value })}
              >
                <option value="">Selecciona</option>
                <option value="pequeño">Pequeño</option>
                <option value="mediano">Mediano</option>
                <option value="grande">Grande</option>
              </select>
            </label>

            <div className="modal-actions">
              <button
                className="btn btn-cancel"
                onClick={() => setShowEditModal(false)}
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                className="btn btn-confirm"
                onClick={handleSaveEdit}
                disabled={actionLoading}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
