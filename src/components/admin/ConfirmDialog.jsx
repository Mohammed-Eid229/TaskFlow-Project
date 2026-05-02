export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="tf-dialog-root" role="presentation">
      <button
        type="button"
        className="tf-dialog-backdrop"
        aria-label="Close dialog"
        onClick={onCancel}
        disabled={loading}
      />
      <div
        className="tf-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="tf-dialog-title"
      >
        <h2 id="tf-dialog-title" className="tf-dialog-title">
          {title}
        </h2>
        {children ? <div className="tf-dialog-body">{children}</div> : null}
        <div className="tf-dialog-actions">
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Loading..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}