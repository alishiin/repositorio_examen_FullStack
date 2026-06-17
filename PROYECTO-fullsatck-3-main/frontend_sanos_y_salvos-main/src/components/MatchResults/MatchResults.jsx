// src/components/MatchResults/MatchResults.jsx
// Lista de coincidencias devueltas por findMatches.
import './MatchResults.css';

// Traduccion human-readable de los codigos de razon del backend.
const REASON_LABELS = {
  mismo_tipo_animal: 'Mismo tipo de animal',
  misma_raza: 'Misma raza',
  mismo_color: 'Mismo color',
  color_similar: 'Color similar',
  mismo_tamano: 'Mismo tamaño',
  zona_muy_cercana: 'Muy cerca (<2km)',
  zona_cercana: 'Zona cercana (<10km)',
  fecha_muy_cercana: 'Reportes recientes (<7 días)',
  fecha_cercana: 'Fechas cercanas (<30 días)',
};

function scoreClass(score) {
  if (score >= 70) return 'score-bar score-high';
  if (score >= 50) return 'score-bar score-mid';
  return 'score-bar score-low';
}

export default function MatchResults({ matches = [], loading = false, onMatchClick }) {
  if (loading) {
    return (
      <div className="match-results-loading" role="status" aria-live="polite">
        <div className="spinner" />
        <p>Buscando coincidencias...</p>
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div className="match-results-empty">
        <p>No se encontraron coincidencias.</p>
        <p className="match-empty-hint">
          El sistema cruza reportes <strong>perdidos</strong> con <strong>encontrados</strong>.
          Si tu reporte es de una mascota perdida, busca entre las encontradas (y viceversa).
          Aun no hay reportes del tipo opuesto que coincidan.
        </p>
      </div>
    );
  }

  return (
    <div className="match-results-list">
      {matches.map((match, idx) => {
        const reporte = match.reporte || {};
        const id = reporte.reporte_id || reporte.id || `match-${idx}`;
        const tipo = (reporte.tipo_reporte || '').toLowerCase();
        const tipoBadge = tipo === 'perdido' ? 'Perdido' : tipo === 'encontrado' ? 'Encontrado' : tipo;
        return (
          <article
            key={id}
            className="match-card"
            onClick={() => onMatchClick?.(match)}
            role={onMatchClick ? 'button' : undefined}
            tabIndex={onMatchClick ? 0 : undefined}
            onKeyDown={(e) => {
              if (onMatchClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onMatchClick(match);
              }
            }}
          >
            <div className="match-card-header">
              {reporte.imagen_url ? (
                <img
                  src={reporte.imagen_url}
                  alt={reporte.titulo || 'reporte'}
                  className="match-thumb"
                />
              ) : (
                <div className="match-thumb match-thumb-placeholder" aria-hidden="true">
                  
                </div>
              )}
              <div className="match-card-title">
                <h4>{reporte.titulo || `Reporte ${id}`}</h4>
                {tipoBadge && (
                  <span className={`match-tipo-badge match-tipo-${tipo}`}>
                    {tipoBadge}
                  </span>
                )}
              </div>
            </div>

            <div className="match-score-row">
              <div className="score-bar-container" aria-label={`Score ${match.score}`}>
                <div
                  className={scoreClass(match.score)}
                  style={{ width: `${Math.min(100, Math.max(0, match.score))}%` }}
                />
              </div>
              <span className="score-number">{Math.round(match.score)}%</span>
            </div>

            <div className="match-reasons">
              {(match.reasons || []).map((reason) => (
                <span key={reason} className="reason-badge" title={reason}>
                  {REASON_LABELS[reason] || reason}
                </span>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
