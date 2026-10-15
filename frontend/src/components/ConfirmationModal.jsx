import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, X, ShieldAlert } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "default", // default, danger, success
  children
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div 
        className="modal-content"
        style={{
          borderTopWidth: '8px',
          borderTopColor: type === 'danger' ? 'var(--color-danger)' : type === 'success' ? 'var(--color-safe)' : 'var(--color-brand)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {type === 'danger' && <ShieldAlert size={28} color="var(--color-danger)" />}
            {type === 'success' && <CheckCircle2 size={28} color="var(--color-safe)" />}
            {type === 'default' && <AlertTriangle size={28} color="var(--color-brand)" />}
            <h3 id="modal-title" style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: 0 }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer' }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {message && (
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            {message}
          </p>
        )}

        {children}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={type === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
