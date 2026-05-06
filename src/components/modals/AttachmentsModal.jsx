// Attachments dialog — shared by tasks and tenders.
//
// The list of attachments is JSONB on the parent row (kept in sync via
// the addAttachment / deleteAttachment mutators in App.jsx); the actual
// blobs live in Supabase Storage. Upload is intentionally available
// regardless of the item's status/stage so the user can attach files
// while working *or* after the item is closed.

import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Paperclip, Plus, Trash2, X } from 'lucide-react';
import { fmtDate } from '../../lib/format';
import { Empty } from '../common/Empty';
import { getAttachmentUrl } from '../../lib/attachments';

const fmtSize = (bytes) => {
  if (bytes == null || isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export const AttachmentsModal = ({ kind, item, onClose, onUpload, onDelete }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [opening, setOpening] = useState(null); // attachment id being opened
  const fileInput = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!item) return null;
  const attachments = [...(item.attachments || [])].sort(
    (a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0)
  );

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      // Upload sequentially so we can stop on the first failure and
      // surface a clear message rather than a Promise.all rejection.
      for (const file of Array.from(fileList)) {
        await onUpload(file);
      }
    } catch (e) {
      setError(e?.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const handleOpen = async (att, { download = false } = {}) => {
    setError(null);
    setOpening(att.id);
    try {
      const url = await getAttachmentUrl(att.path, { download });
      // Open in a new tab; signed URL is short-lived (5 min).
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      setError(e?.message || 'Could not open file');
    } finally {
      setOpening(null);
    }
  };

  const handleDelete = (att) => {
    if (!confirm(`Delete attachment "${att.name}"?`)) return;
    onDelete(att);
  };

  return (
    <div className="pd-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="pd-modal pd-scroll"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(720px, 92vw)' }}
        role="dialog"
        aria-modal="true"
        aria-label={`Attachments for ${item.title}`}
      >
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--accent)' }}>{kind} · attachments</div>
            <h3 className="pd-display text-2xl font-medium leading-tight">{item.title}</h3>
            <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1.5"><Paperclip size={11} /> {attachments.length} file{attachments.length === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="pd-btn pd-btn-primary px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-60"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
            >
              <Plus size={13} /> {busy ? 'Uploading…' : 'Add files'}
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button className="pd-icon-btn" onClick={onClose} aria-label="Close attachments" title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div
              className="mb-4 px-3 py-2 rounded-lg text-xs"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
              }}
            >
              {error}
            </div>
          )}

          {attachments.length === 0 ? (
            <Empty
              icon={Paperclip}
              title="No attachments yet"
              hint='Click "Add files" to attach project documents, quotes, or contracts'
            />
          ) : (
            <div className="space-y-2">
              {attachments.map((att, i) => (
                <div
                  key={att.id}
                  className="p-3 rounded-xl pd-anim-in flex items-center gap-3"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', animationDelay: `${i * 30}ms` }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}
                  >
                    <FileText size={16} />
                  </div>
                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => handleOpen(att)}
                    title="Open in a new tab"
                    disabled={opening === att.id}
                  >
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {att.name}
                    </div>
                    <div className="text-[11px] pd-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {fmtSize(att.size)}
                      {att.uploadedAt && <> · {fmtDate(att.uploadedAt)}</>}
                      {opening === att.id && <> · opening…</>}
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="pd-icon-btn"
                      onClick={() => handleOpen(att, { download: true })}
                      title="Download"
                      aria-label={`Download ${att.name}`}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      className="pd-icon-btn danger"
                      onClick={() => handleDelete(att)}
                      title="Delete"
                      aria-label={`Delete ${att.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
