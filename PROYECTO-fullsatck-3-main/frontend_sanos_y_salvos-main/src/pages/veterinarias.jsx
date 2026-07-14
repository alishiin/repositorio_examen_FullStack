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
    latitud: -33.4167,
    longitud: -70.6036,
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
    latitud: -33.4489,
    longitud: -70.6693,
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
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState(null);
  const [createType, setCreateType] = useState('veterinaria');

  const buildCreateForm = (baseProfile, type) => ({
    name: baseProfile?.name || '',
    tagline: baseProfile?.tagline || '',
    address: baseProfile?.address || '',
    hours: baseProfile?.hours || '',
    email: baseProfile?.email || baseProfile?.contact?.email || '',
    phone: baseProfile?.phone || baseProfile?.contact?.phone || '',
    logo: baseProfile?.logo || (type === 'municipalidad' ? '🏛️' : '🏥'),
    services: Array.isArray(baseProfile?.services) ? baseProfile.services.join(', ') : '',
    description: baseProfile?.description || '',
    latitud: Number(baseProfile?.latitud ?? (type === 'municipalidad' ? -33.4489 : -33.4167)),
    longitud: Number(baseProfile?.longitud ?? (type === 'municipalidad' ? -70.6693 : -70.6036)),
    contact: {
      email: baseProfile?.contact?.email || baseProfile?.email || '',
      phone: baseProfile?.contact?.phone || baseProfile?.phone || '',
    },
  });

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

  const openCreateInstitution = (type) => {
    setCreateError('');
    setCreateType(type);
    setCreateForm(buildCreateForm(profiles[type] || DEFAULT_PROFILES[type], type));
    setCreateOpen(true);
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

  const handleCreateVeterinary = async () => {
    if (!createForm) return;

    if (!createForm.name.trim() || !createForm.address.trim() || Number.isNaN(Number(createForm.latitud)) || Number.isNaN(Number(createForm.longitud))) {
      setCreateError('Nombre, dirección, latitud y longitud son obligatorios.');
      return;
    }

    setCreateLoading(true);
    setCreateError('');

    try {
      const response = institutionProfileClient.createLocalInstitutionProfile(createType, {
        ...createForm,
        services: createForm.services
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        latitud: Number(createForm.latitud),
        longitud: Number(createForm.longitud),
      });

      if (response?.success) {
        setCreateOpen(false);
        setCreateForm(null);
      }
    } finally {
      setCreateLoading(false);
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
          <button
            type="button"
            className="btn-call"
            onClick={() => openCreateInstitution(type)}
          >
            {type === 'veterinaria' ? 'Crear veterinaria' : 'Crear municipalidad'}
          </button>
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

      <UiDialog
        open={createOpen}
          title={createType === 'municipalidad' ? 'Crear municipalidad' : 'Crear veterinaria'}
          message={createType === 'municipalidad'
            ? 'La municipalidad se guardará solo en este navegador y luego aparecerá en el mapa junto a la municipalidad original.'
            : 'La veterinaria se guardará solo en este navegador y luego aparecerá en el mapa junto a la veterinaria original.'}
          confirmLabel={createLoading ? 'Creando...' : (createType === 'municipalidad' ? 'Crear municipalidad' : 'Crear veterinaria')}
        cancelLabel="Cancelar"
        showCancel
        onCancel={() => setCreateOpen(false)}
        onConfirm={handleCreateVeterinary}
      >
        {createForm && (
          <div className="institution-form-grid">
            {createError && <div className="veterinarias-notice full-width"><p>{createError}</p></div>}
            <label>
              Nombre
              <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
            </label>
            <label>
              Eslogan
              <input value={createForm.tagline} onChange={(e) => setCreateForm({ ...createForm, tagline: e.target.value })} />
            </label>
            <label>
              Dirección
              <input value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} />
            </label>
            <label>
              Horario
              <input value={createForm.hours} onChange={(e) => setCreateForm({ ...createForm, hours: e.target.value })} />
            </label>
            <label>
              Email
              <input value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value, contact: { ...createForm.contact, email: e.target.value } })} />
            </label>
            <label>
              Teléfono
              <input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value, contact: { ...createForm.contact, phone: e.target.value } })} />
            </label>
            <label>
              Latitud
              <input type="number" step="0.0001" value={createForm.latitud} onChange={(e) => setCreateForm({ ...createForm, latitud: e.target.value })} />
            </label>
            <label>
              Longitud
              <input type="number" step="0.0001" value={createForm.longitud} onChange={(e) => setCreateForm({ ...createForm, longitud: e.target.value })} />
            </label>
            <label>
              Logo o emoji
              <input value={createForm.logo} onChange={(e) => setCreateForm({ ...createForm, logo: e.target.value })} />
            </label>
            <label>
              Servicios
              <input value={createForm.services} onChange={(e) => setCreateForm({ ...createForm, services: e.target.value })} />
            </label>
            <label className="full-width">
              Descripción
              <textarea rows="4" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
            </label>
          </div>
        )}
      </UiDialog>
    </section>
  );
}
