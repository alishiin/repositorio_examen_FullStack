import { useEffect, useMemo, useState } from 'react';
import UiDialog from '../components/UiDialog/UiDialog';
import { institutionProfileClient } from '../services/api';
import './veterinarias.css';

const DEFAULT_PROFILES = {
  veterinaria: {
    type: 'veterinaria',
    name: 'Clínica Veterinaria Sanos y Salvos',
    tagline: 'Atención médica, rescate y seguimiento para mascotas',
    address: 'Av. Apoquindo 1234, Santiago',
    phone: '+56 9 4782 0482',
    email: 'contacto@sanosysalvos.cl',
    hours: 'Lun - Vie 08:00 - 20:00 / Sáb 09:00 - 14:00',
    logo: '🏥',
    services: ['Consulta General', 'Urgencias', 'Vacunas', 'Hospitalización'],
    description: 'Red veterinaria para atención, apoyo y coordinación con familias y comunidad.',
  },
  municipalidad: {
    type: 'municipalidad',
    name: 'Municipalidad de Providencia',
    tagline: 'Coordinación comunitaria para mascotas perdidas y encontradas',
    address: 'Av. Pedro de Valdivia 963, 7500643 Providencia, Región Metropolitana',
    phone: '+56 2 2654 3200',
    email: 'municipalidad@providencia.cl',
    hours: 'Lun - Vie 09:00 - 17:30',
    logo: '🏛️',
    services: ['Difusión territorial', 'Campañas comunitarias', 'Recepción de denuncias', 'Coordinación con veterinarias'],
    description: 'Perfil institucional para gestión de alertas, campañas y apoyo territorial.',
  },
};

export default function Veterinarias() {
  const [activeType, setActiveType] = useState('veterinaria');
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    setIsAdmin(!!localStorage.getItem('adminToken'));

    const load = async () => {
      const [vet, mun] = await Promise.all([
        institutionProfileClient.getProfile('veterinaria').catch(() => null),
        institutionProfileClient.getProfile('municipalidad').catch(() => null),
      ]);

      setProfiles({
        veterinaria: vet?.success ? vet.data : DEFAULT_PROFILES.veterinaria,
        municipalidad: mun?.success ? mun.data : DEFAULT_PROFILES.municipalidad,
      });
    };

    load();
  }, []);

  const currentProfile = profiles[activeType] || DEFAULT_PROFILES[activeType];

  const summary = useMemo(() => [currentProfile.address, currentProfile.hours, currentProfile.phone].filter(Boolean).join(' · '), [currentProfile]);

  const openEditor = () => {
    if (!isAdmin) return;
    setForm({ ...currentProfile, contact: currentProfile.contact || { email: currentProfile.email, phone: currentProfile.phone } });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form) return;
    setLoading(true);
    try {
      const response = await institutionProfileClient.updateProfile(activeType, {
        ...form,
        email: form.contact?.email || form.email,
        phone: form.contact?.phone || form.phone,
      });

      if (response.success) {
        setProfiles((prev) => ({ ...prev, [activeType]: response.data }));
        setEditing(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderProfile = (profile, type) => (
    <article className={`vet-card ${type === activeType ? 'active' : ''}`}>
      <div className="vet-header">
        <div className="vet-image">{profile.logo || '🏥'}</div>
        <div className="vet-rating">
          <span className="rating-number">Perfil institucional</span>
          <span className="reviews">{type === 'veterinaria' ? 'Veterinaria' : 'Municipalidad'}</span>
        </div>
      </div>

      <div className="vet-content">
        <h2 className="vet-name">{profile.name}</h2>
        <p className="vet-tagline">{profile.tagline}</p>

        <div className="vet-info">
          <div className="info-row"><span className="icon">📍</span><span>{profile.address}</span></div>
          <div className="info-row"><span className="icon">📞</span><a href={`tel:${profile.phone}`}>{profile.phone}</a></div>
          <div className="info-row"><span className="icon">✉️</span><a href={`mailto:${profile.email}`}>{profile.email}</a></div>
          <div className="info-row"><span className="icon">🕐</span><span>{profile.hours}</span></div>
        </div>

        <div className="vet-services">
          <h4>Servicios</h4>
          <ul>
            {profile.services.map((service) => <li key={service}>{service}</li>)}
          </ul>
        </div>

        <div className="vet-actions">
          <button type="button" className="btn-call" onClick={() => setActiveType(type)}>Ver perfil</button>
          {isAdmin && <button type="button" className="btn-email" onClick={openEditor}>Editar</button>}
        </div>
      </div>
    </article>
  );

  return (
    <section className="veterinarias-section">
      <div className="veterinarias-container">
        <h1 className="veterinarias-title">Perfiles Institucionales</h1>
        <p className="veterinarias-subtitle">Veterinarias y municipalidades con edición directa y diseño unificado.</p>

        <div className="institution-summary">{summary}</div>

        <div className="veterinarias-tabs">
          <button type="button" className={activeType === 'veterinaria' ? 'active' : ''} onClick={() => setActiveType('veterinaria')}>Veterinaria</button>
          <button type="button" className={activeType === 'municipalidad' ? 'active' : ''} onClick={() => setActiveType('municipalidad')}>Municipalidad</button>
        </div>

        <div className="veterinarias-grid institutional-grid">
          {renderProfile(profiles.veterinaria, 'veterinaria')}
          {renderProfile(profiles.municipalidad, 'municipalidad')}
        </div>


      </div>

      {isAdmin && (
        <UiDialog
          open={editing}
          title={`Editar ${activeType}`}
          message="Actualiza el perfil institucional y guarda los cambios sin salir de la página."
          confirmLabel={loading ? 'Guardando...' : 'Guardar'}
          cancelLabel="Cancelar"
          showCancel
          onCancel={() => setEditing(false)}
          onConfirm={handleSave}
        >
          {form && (
            <div className="institution-form-grid">
              <label>
                Nombre
                <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                Eslogan
                <input value={form.tagline || ''} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
              </label>
              <label>
                Dirección
                <input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </label>
              <label>
                Horario
                <input value={form.hours || ''} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
              </label>
              <label>
                Email
                <input value={form.contact?.email || form.email || ''} onChange={(e) => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })} />
              </label>
              <label>
                Teléfono
                <input value={form.contact?.phone || form.phone || ''} onChange={(e) => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} />
              </label>
              <label>
                Logo o emoji
                <input value={form.logo || ''} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
              </label>
              <label>
                Servicios
                <input value={(form.services || []).join(', ')} onChange={(e) => setForm({ ...form, services: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
              </label>
              <label className="full-width">
                Descripción
                <textarea rows="4" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
            </div>
          )}
        </UiDialog>
      )}
    </section>
  );
}
