// src/components/ReportDetailModal/ReportDetailModal.jsx
// Modal lateral derecho con detalle del reporte + chat publico + match.
import { useEffect, useState } from 'react';
import ChatWindow from '../Chat/ChatWindow';
import MatchResults from '../MatchResults/MatchResults';
import { useFindMatches } from '../../hooks/useFindMatches';
import { resolveImageUrl } from '../../utils/imageUrl';
import './ReportDetailModal.css';

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('es-CL', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export default function ReportDetailModal({ report, isOpen, onClose, currentUser }) {
  const [showChat, setShowChat] = useState(false);
  const { loading, matches, error, findMatches, reset } = useFindMatches();
  const [hasSearched, setHasSearched] = useState(false);

  // Reset state cuando cambia de reporte o se cierra
  useEffect(() => {
    setShowChat(false);
    setHasSearched(false);
    reset();
  }, [report?.id, report?.reporte_id, isOpen, reset]);

  // ESC para cerrar
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !report) return null;

  const reportId = report.reporte_id || report.id;
  const roomName = `reporte_${reportId}`;
  const tipo = (report.tipo_reporte || '').toLowerCase();
  const isLogged = !!currentUser;

  const handleFindMatches = async () => {
    setHasSearched(true);
    try {
      await findMatches({
        report_id: String(reportId),
        tipo_reporte: tipo,
        tipo_animal: report.tipo_animal,
        raza_probable: report.raza_probable,
        color: report.color,
        tamano: report.tamano || report.tamaño,
        latitud: report.latitud,
        longitud: report.longitud,
        fecha_reporte: report.fecha_reporte,
        titulo: report.titulo,
        imagen_url: report.imagen_url,
        user_id: currentUser?.id || currentUser?.usuario_id,
      });
    } catch {
      // error ya esta en el hook
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <aside
        className="report-modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        <header className="report-modal-header">
          <div className="header-left">
            <h2 id="report-modal-title">{report.titulo || `Reporte ${reportId}`}</h2>
            {tipo && (
              <span className={`tipo-badge tipo-${tipo}`}>
                {tipo === 'perdido' ? 'Perdido' : tipo === 'encontrado' ? 'Encontrado' : tipo}
              </span>
            )}
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            X
          </button>
        </header>

        <div className="report-modal-body">
          {resolveImageUrl(report.imagen_url) ? (
            <img
              src={resolveImageUrl(report.imagen_url)}
              alt={report.titulo || 'Foto del reporte'}
              className="report-image"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="report-image-placeholder" aria-hidden="true">Sin foto</div>
          )}

          {report.descripcion && (
            <section className="report-section">
              <h3>Descripcion</h3>
              <p>{report.descripcion}</p>
            </section>
          )}

          <section className="report-section">
            <h3>Datos</h3>
            <dl className="report-data-grid">
              <div><dt>Animal</dt><dd>{report.tipo_animal || 'N/A'}</dd></div>
              <div><dt>Raza</dt><dd>{report.raza_probable || 'N/A'}</dd></div>
              <div><dt>Color</dt><dd>{report.color || 'N/A'}</dd></div>
              <div><dt>Tamano</dt><dd>{report.tamano || report.tamaño || 'N/A'}</dd></div>
              <div><dt>Ubicacion</dt><dd>{report.latitud?.toFixed?.(4)}, {report.longitud?.toFixed?.(4)}</dd></div>
              <div><dt>Fecha</dt><dd>{formatDate(report.fecha_reporte)}</dd></div>
            </dl>
          </section>

          {isLogged ? (
            <>
              <section className="report-section">
                <h3>Chat sobre este reporte</h3>
                {!showChat ? (
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => setShowChat(true)}
                  >
                    Abrir chat
                  </button>
                ) : (
                  <div className="chat-embedded">
                    <ChatWindow roomName={roomName} onBack={() => setShowChat(false)} />
                  </div>
                )}
              </section>

              <section className="report-section">
                <h3>Buscar coincidencias</h3>
                <button
                  type="button"
                  className="action-btn primary"
                  onClick={handleFindMatches}
                  disabled={loading}
                >
                  {loading ? 'Buscando...' : 'Buscar coincidencias'}
                </button>
                {error && <p className="error-msg">Error: {error}</p>}
                {hasSearched && <MatchResults matches={matches} loading={loading} />}
              </section>
            </>
          ) : (
            <section className="report-section locked-section">
              <p>Inicia sesion para abrir el chat o buscar coincidencias.</p>
            </section>
          )}
        </div>

        <footer className="report-modal-footer">
          <button type="button" className="action-btn" onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </aside>
    </div>
  );
}
