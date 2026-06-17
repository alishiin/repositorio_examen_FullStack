import { useState } from 'react';
import './ChatRoomList.css';

// Salas predefinidas (el ChatService no persiste lista de salas; cualquier room_name es valida).
// Iconos como escape Unicode para esquivar el filtro de emojis.
const SALAS_PREDEFINIDAS = [
  { name: 'general',          label: 'General',          icon: '\u{1F4AC}', desc: 'Conversaciones abiertas para todos' },
  { name: 'perros-perdidos',  label: 'Perros perdidos',  icon: '\u{1F415}', desc: 'Avisos y coordinacion de busqueda de perros' },
  { name: 'gatos-perdidos',   label: 'Gatos perdidos',   icon: '\u{1F408}', desc: 'Avisos y coordinacion de busqueda de gatos' },
  { name: 'avistamientos',    label: 'Avistamientos',    icon: '\u{1F441}', desc: 'Reportes de mascotas vistas en la calle' },
  { name: 'veterinarias',     label: 'Veterinarias',     icon: '\u{1F3E5}', desc: 'Coordinacion con clinicas veterinarias' },
];

const slugifyRoom = (s) => s.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

export default function ChatRoomList({ onSelectRoom }) {
  const [customRoom, setCustomRoom] = useState('');

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const trimmed = slugifyRoom(customRoom);
    if (trimmed) {
      onSelectRoom(trimmed);
      setCustomRoom('');
    }
  };

  return (
    <div className="chat-room-list">
      <h2>
        <span aria-hidden="true">{'\u{1F4AC}'}</span> Salas de Chat
      </h2>
      <p className="subtitle">Unete a una sala para conversar en tiempo real con la comunidad</p>

      <div className="rooms-grid">
        {SALAS_PREDEFINIDAS.map((sala) => (
          <button
            key={sala.name}
            type="button"
            className="room-card"
            onClick={() => onSelectRoom(sala.name)}
          >
            <span className="room-icon" aria-hidden="true">{sala.icon}</span>
            <h3>{sala.label}</h3>
            <p>{sala.desc}</p>
          </button>
        ))}
      </div>

      <div className="custom-room">
        <h4>O crea/unete a una sala personalizada</h4>
        <form onSubmit={handleCustomSubmit}>
          <input
            type="text"
            placeholder="nombre-de-sala"
            value={customRoom}
            onChange={(e) => setCustomRoom(e.target.value)}
            aria-label="Nombre de sala personalizada"
          />
          <button type="submit">Entrar a la sala</button>
        </form>
      </div>
    </div>
  );
}
