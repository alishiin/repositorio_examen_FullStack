import './InteractionModal.css';

export default function InteractionModal({
  open,
  tone = 'info',
  title,
  message,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  confirmTone = 'primary',
  onConfirm,
  onCancel,
  children,
  inputValue,
  onInputChange,
  inputPlaceholder,
  inputType = 'text',
}) {
  if (!open) return null;

  const isConfirm = typeof onCancel === 'function' && typeof onConfirm === 'function';

  return (
    <div className={`interaction-modal-overlay tone-${tone}`} onClick={onCancel || onConfirm}>
      <div className="interaction-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="interaction-modal-header">
          <div>
            <p className="interaction-modal-kicker">{tone === 'success' ? 'Correcto' : tone === 'error' ? 'Error' : tone === 'warning' ? 'Atención' : 'Mensaje'}</p>
            <h3>{title}</h3>
          </div>
          {typeof onCancel === 'function' && (
            <button type="button" className="interaction-modal-close" onClick={onCancel} aria-label="Cerrar modal">×</button>
          )}
        </div>

        {message && <p className="interaction-modal-message">{message}</p>}
        {children}

        {inputValue !== undefined && typeof onInputChange === 'function' && (
          inputType === 'textarea' ? (
            <textarea
              className="interaction-modal-input"
              rows="4"
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder={inputPlaceholder}
            />
          ) : (
            <input
              className="interaction-modal-input"
              type={inputType}
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder={inputPlaceholder}
            />
          )
        )}

        <div className="interaction-modal-actions">
          {isConfirm && (
            <button type="button" className="interaction-modal-btn secondary" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            className={`interaction-modal-btn ${confirmTone}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}