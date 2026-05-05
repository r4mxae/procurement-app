// Log history viewer + per-item Excel export.

import { useEffect } from 'react';
import { Calendar, FileSpreadsheet, History, Timer, Trash2, X } from 'lucide-react';
import { exportWorkLogToExcel } from '../../lib/excel';
import { fmtDate, fmtDuration, fmtTimeOfDay, todayISO, totalLoggedSeconds } from '../../lib/format';
import { Empty } from '../common/Empty';

export const ViewLogsModal = ({ kind, item, profile, onClose, onDeleteLog }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!item) return null;
  const logs = [...(item.workLogs || [])].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  const totalSeconds = totalLoggedSeconds(item.workLogs);

  const handleExport = () => {
    exportWorkLogToExcel({
      profile,
      items: [{ kind, ...item }],
      filename: `worklog-${(item.title || 'item').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${todayISO()}.xlsx`
    });
  };

  return (
    <div className="pd-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="pd-modal pd-scroll"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(720px, 92vw)' }}
        role="dialog"
        aria-modal="true"
        aria-label={`Work logs for ${item.title}`}
      >
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--accent)' }}>{kind} · work logs</div>
            <h3 className="pd-display text-2xl font-medium leading-tight">{item.title}</h3>
            <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1.5"><Timer size={11} /> Total: <span className="pd-mono" style={{ color: 'var(--text)' }}>{fmtDuration(totalSeconds)}</span></span>
              <span className="flex items-center gap-1.5"><History size={11} /> {logs.length} session{logs.length === 1 ? '' : 's'}</span>
              {item.deadline && <span className="flex items-center gap-1.5"><Calendar size={11} /> Due {fmtDate(item.deadline)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="pd-btn pd-btn-ghost px-3 py-2 rounded-lg text-xs flex items-center gap-1.5" onClick={handleExport} disabled={logs.length === 0}>
              <FileSpreadsheet size={13} /> Export Excel
            </button>
            <button className="pd-icon-btn" onClick={onClose} aria-label="Close work logs" title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {logs.length === 0 ? (
            <Empty icon={Timer} title="No logs yet" hint="Start the timer to record your first session" />
          ) : (
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl pd-anim-in"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="text-sm font-medium pd-mono">
                        {fmtDate(log.startTime)} · {fmtTimeOfDay(log.startTime)} → {fmtTimeOfDay(log.endTime)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs pd-mono px-2 py-1 rounded" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                        {fmtDuration(log.durationSeconds)}
                      </span>
                      <button
                        className="pd-icon-btn danger"
                        onClick={() => { if (confirm('Delete this log entry?')) onDeleteLog(log.id); }}
                        title="Delete log"
                        aria-label="Delete log entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{log.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
