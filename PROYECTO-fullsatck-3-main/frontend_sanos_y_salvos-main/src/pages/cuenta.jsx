import { useState } from 'react';
import { useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import NotificationList from '../components/Notifications/NotificationList';
import UiDialog from '../components/UiDialog/UiDialog';
import { geoServiceClient } from '../services/api';
import './cuenta.css';

export default function Cuenta({ onNavigate }) {
  const { user, logout } = useAuth();
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [loadingPets, setLoadingPets] = useState(false);
  const [userPets, setUserPets] = useState([]);
  const [petDialog, setPetDialog] = useState({ open: false, mode: 'edit' });
  const [petForm, setPetForm] = useState(null);
  const [petMessage, setPetMessage] = useState({ open: false, tone: 'info', title: '', message: '' });
  const [savingPet, setSavingPet] = useState(false);
  const userId = user?.id || user?.usuario_id || user?.uid;

  if (!user) {
    return (
      <div className="cuenta-page">
        <h2>No autenticado</h2>
        <p>Por favor inicia sesión para ver tu cuenta</p>
      </div>
    );
  }

  const handleLogout = () => {
    setLogoutDialog(true);
  };

  useEffect(() => {
    const loadPets = async () => {
      if (!userId) return;
      setLoadingPets(true);
      try {
        const response = await geoServiceClient.getLocations({ page_size: 100 });
        const reports = response?.results || response || [];
        const ownedReports = reports.filter((report) => String(report.usuario_id) === String(userId));
        setUserPets(ownedReports);
      } catch {
        setUserPets([]);
      } finally {
        setLoadingPets(false);
      }
    };

    loadPets();
  }, [userId]);

  const profileSummary = useMemo(() => [user?.phone, user?.commune, user?.address].filter(Boolean).join(' · '), [user]);

  const openPetEditor = (pet) => {
    setPetForm({
      ...pet,
      title: pet.titulo || pet.title || '',
      description: pet.descripcion || pet.description || '',
      image_url: pet.imagen_url || pet.image_url || '',
    });
    setPetDialog({ open: true, mode: 'edit' });
  };

  const savePet = async () => {
    if (!petForm?.id) return;
    setSavingPet(true);
    try {
      await fetch(`${import.meta.env.VITE_BFF_URL || 'http://localhost:5000'}/api/ubicaciones/${petForm.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` } : {}),
        },
        body: JSON.stringify({
          titulo: petForm.title,
          descripcion: petForm.description,
          tipo_reporte: petForm.tipo_reporte,
          tipo_animal: petForm.tipo_animal,
          raza_probable: petForm.raza_probable,
          color: petForm.color,
          tamaño: petForm.tamaño || petForm.tamano,
          imagen_url: petForm.image_url,
          latitud: petForm.latitud,
          longitud: petForm.longitud,
        }),
      });

      setUserPets((prev) => prev.map((pet) => (pet.id === petForm.id ? { ...pet, ...petForm, titulo: petForm.title, descripcion: petForm.description, imagen_url: petForm.image_url } : pet)));
      setPetDialog({ open: false, mode: 'edit' });
      setPetMessage({ open: true, tone: 'success', title: 'Mascota actualizada', message: 'Los cambios se guardaron correctamente.' });
    } catch (error) {
      setPetMessage({ open: true, tone: 'error', title: 'No se pudo actualizar', message: error.message || 'Error inesperado' });
    } finally {
      setSavingPet(false);
    }
  };

  const deletePet = (pet) => {
    setPetDialog({ open: true, mode: 'delete', pet });
    setPetForm(pet);
  };

  const confirmDeletePet = async () => {
    if (!petForm?.id) return;
    setSavingPet(true);
    try {
      await fetch(`${import.meta.env.VITE_BFF_URL || 'http://localhost:5000'}/api/ubicaciones/${petForm.id}/`, {
        method: 'DELETE',
        headers: localStorage.getItem('authToken') ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` } : {},
      });
      setUserPets((prev) => prev.filter((pet) => pet.id !== petForm.id));
      setPetDialog({ open: false, mode: 'delete' });
      setPetMessage({ open: true, tone: 'success', title: 'Mascota eliminada', message: 'La publicación fue eliminada correctamente.' });
    } catch (error) {
      setPetMessage({ open: true, tone: 'error', title: 'No se pudo eliminar', message: error.message || 'Error inesperado' });
    } finally {
      setSavingPet(false);
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

        <div className="info-section">
          <NotificationList />
        </div>

        <div className="info-section">
          <h2>Mis Mascotas</h2>
          {profileSummary && <p className="account-summary">{profileSummary}</p>}
          {loadingPets ? (
            <p>Cargando mascotas...</p>
          ) : userPets.length === 0 ? (
            <p>No tienes mascotas reportadas todavía.</p>
          ) : (
            <div className="account-pets-grid">
              {userPets.map((pet) => (
                <article key={pet.id} className="account-pet-card">
                  <div className="account-pet-card-header">
                    <strong>{pet.titulo || pet.title || 'Mascota'}</strong>
                    <span>{pet.tipo_reporte === 'perdido' ? 'Perdida' : 'Encontrada'}</span>
                  </div>
                  <p>{pet.descripcion || pet.description || 'Sin descripción'}</p>
                  <div className="account-pet-actions">
                    <button type="button" className="btn-primary" onClick={() => openPetEditor(pet)}>Editar</button>
                    <button type="button" className="btn-danger" onClick={() => deletePet(pet)}>Eliminar</button>
                  </div>
                </article>
              ))}
            </div>
          )}
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

      <UiDialog
        open={logoutDialog}
        tone="warning"
        title="Cerrar sesión"
        message="¿Deseas cerrar sesión?"
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        showCancel
        onCancel={() => setLogoutDialog(false)}
        onConfirm={() => {
          setLogoutDialog(false);
          logout();
          onNavigate('home');
        }}
      />

      <UiDialog
        open={petMessage.open}
        tone={petMessage.tone}
        title={petMessage.title}
        message={petMessage.message}
        confirmLabel="Aceptar"
        onConfirm={() => setPetMessage((prev) => ({ ...prev, open: false }))}
      />

      <UiDialog
        open={petDialog.open && petDialog.mode === 'edit'}
        tone="info"
        title="Editar mascota"
        message="Actualiza la información de tu publicación sin recargar la página."
        confirmLabel={savingPet ? 'Guardando...' : 'Guardar cambios'}
        cancelLabel="Cancelar"
        showCancel
        onCancel={() => setPetDialog({ open: false, mode: 'edit' })}
        onConfirm={savePet}
      >
        {petForm && (
          <div className="institution-form-grid">
            <label>
              Título
              <input value={petForm.title || ''} onChange={(e) => setPetForm({ ...petForm, title: e.target.value })} />
            </label>
            <label>
              Descripción
              <textarea rows="4" value={petForm.description || ''} onChange={(e) => setPetForm({ ...petForm, description: e.target.value })} />
            </label>
            <label>
              Tipo de reporte
              <select value={petForm.tipo_reporte || 'perdido'} onChange={(e) => setPetForm({ ...petForm, tipo_reporte: e.target.value })}>
                <option value="perdido">Perdido</option>
                <option value="encontrado">Encontrado</option>
              </select>
            </label>
            <label>
              Tipo de animal
              <select value={petForm.tipo_animal || 'perro'} onChange={(e) => setPetForm({ ...petForm, tipo_animal: e.target.value })}>
                <option value="perro">Perro</option>
                <option value="gato">Gato</option>
                <option value="otro">Otro</option>
              </select>
            </label>
            <label>
              Raza probable
              <input value={petForm.raza_probable || ''} onChange={(e) => setPetForm({ ...petForm, raza_probable: e.target.value })} />
            </label>
            <label>
              Color
              <input value={petForm.color || ''} onChange={(e) => setPetForm({ ...petForm, color: e.target.value })} />
            </label>
            <label>
              Imagen URL
              <input value={petForm.image_url || ''} onChange={(e) => setPetForm({ ...petForm, image_url: e.target.value })} />
            </label>
            <label>
              Ubicación
              <input value={petForm.titulo || ''} onChange={(e) => setPetForm({ ...petForm, titulo: e.target.value })} />
            </label>
          </div>
        )}
      </UiDialog>

      <UiDialog
        open={petDialog.open && petDialog.mode === 'delete'}
        tone="warning"
        title="Eliminar mascota"
        message={`¿Seguro que deseas eliminar ${petForm?.titulo || 'esta mascota'}? Esta acción no se puede deshacer.`}
        confirmLabel={savingPet ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        showCancel
        onCancel={() => setPetDialog({ open: false, mode: 'delete' })}
        onConfirm={confirmDeletePet}
      />
    </div>
  );
}
