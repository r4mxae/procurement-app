// Centered modal dialog with backdrop click-to-close, Esc support, and ARIA roles.

import { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="pd-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="pd-modal pd-scroll"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dialog'}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="pd-display text-2xl font-medium">{title}</h3>
          <button className="pd-icon-btn" onClick={onClose} aria-label="Close dialog" title="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
