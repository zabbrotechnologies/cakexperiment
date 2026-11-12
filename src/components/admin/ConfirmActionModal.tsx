import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmActionModalProps {
  open: boolean;
  title: string;
  itemLabel?: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning';
  isProcessing?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  open,
  title,
  itemLabel,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isProcessing = false,
  errorMessage = null,
  onCancel,
  onConfirm
}) => {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, isProcessing, onCancel]);

  if (!open) return null;

  const isDanger = tone === 'danger';
  const accentColor = isDanger ? '#D0342C' : '#E65100';
  const badgeBg = isDanger ? '#FFF2F4' : '#FFF3E0';

  return createPortal(
    <div
      className="modal-overlay"
      onClick={() => !isProcessing && onCancel()}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(40, 15, 22, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        overflowY: 'auto',
        overscrollBehavior: 'contain'
      }}
    >
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '460px',
          width: '100%',
          maxHeight: 'calc(100dvh - 40px)',
          overflowY: 'auto',
          margin: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 24px 60px rgba(40, 15, 22, 0.25)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center'
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          aria-label="Close confirmation dialog"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'none',
            border: 'none',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            color: 'var(--text-muted)',
            padding: '4px'
          }}
        >
          <X size={18} />
        </button>

        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: badgeBg,
            color: accentColor,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}
        >
          {isDanger ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
        </div>

        <h3
          id="confirm-action-title"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.35rem',
            color: 'var(--color-plum)',
            margin: '0 0 0.5rem 0',
            fontWeight: 600
          }}
        >
          {title}
        </h3>

        {itemLabel && (
          <p
            style={{
              color: 'var(--color-plum)',
              fontSize: '0.94rem',
              fontWeight: 700,
              margin: '0 0 0.55rem 0',
              wordBreak: 'break-word'
            }}
          >
            {itemLabel}
          </p>
        )}

        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.86rem',
            margin: '0 0 1.4rem 0',
            lineHeight: 1.55
          }}
        >
          {description}
        </div>

        {errorMessage && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.7rem 0.9rem',
              backgroundColor: '#FFEBEE',
              color: '#C62828',
              borderRadius: '8px',
              border: '1px solid #FFCDD2',
              fontSize: '0.83rem',
              textAlign: 'left'
            }}
          >
            {errorMessage}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onCancel}
            className="btn btn-secondary btn-sm"
            style={{ minWidth: '100px' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onConfirm}
            style={{
              backgroundColor: accentColor,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '999px',
              padding: '0.55rem 1.3rem',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: isProcessing ? 'wait' : 'pointer',
              opacity: isProcessing ? 0.75 : 1,
              minWidth: '125px'
            }}
          >
            {isProcessing ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

