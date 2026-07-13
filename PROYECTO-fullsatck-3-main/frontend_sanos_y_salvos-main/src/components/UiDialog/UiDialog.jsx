import './UiDialog.css';

export default function UiDialog({
  open,
  title,
  message,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  tone = 'info',
  onConfirm,
  onCancel,
  showCancel = false,
  children,
}) {
  if (!open) return null;

  return (
    <div className="ui-dialog-overlay" role="presentation" onClick={onCancel}>
      <div
        className={`ui-dialog ui-dialog-${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ui-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ui-dialog-header">
          <h3 id="ui-dialog-title">{title}</h3>
          {onCancel && (
            <button type="button" className="ui-dialog-close" onClick={onCancel} aria-label="Cerrar">
              ×
            </button>
          )}
        </div>

        {message && <p className="ui-dialog-message">{message}</p>}
        {children}

        <div className="ui-dialog-actions">
          {showCancel && onCancel && (
            <button type="button" className="ui-dialog-btn secondary" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button type="button" className="ui-dialog-btn primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
