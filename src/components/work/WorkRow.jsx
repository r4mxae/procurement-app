import { Calendar, ClipboardList, FileText, History, Paperclip, Timer } from 'lucide-react';
import { SLA_TYPES, TASK_STATUSES, TENDER_STAGES } from '../../constants/domain';
import { daysUntil, fmtDateShort, fmtDuration, totalLoggedSeconds, getUrgentDays } from '../../lib/format';
import { LiveDuration } from '../common/LiveDuration';
import { PriorityBadge } from '../common/PriorityBadge';
import { TimerButton } from '../common/TimerButton';

export function WorkRow({ item, index, isActiveTimer, activeStartTime, hasOtherTimer, onStartTimer, onStopTimer, onViewLogs, onViewAttachments }) {
  const days = daysUntil(item.deadline);
  const overdue = days != null && days < 0 && item._open;
  const urgent = days != null && days <= getUrgentDays() && days >= 0 && item._open;
  const baseSeconds = totalLoggedSeconds(item.workLogs);
  const logCount = (item.workLogs || []).length;
  const attachmentCount = (item.attachments || []).length;
  const slaLabel = item.slaType ? SLA_TYPES.find(t => t.id === item.slaType)?.label : null;
  const showTimeChip = baseSeconds > 0 || isActiveTimer;

  const statusLabel = item.kind === 'task'
    ? (TASK_STATUSES.find(s => s.id === item.status)?.label || item.status)
    : (TENDER_STAGES.find(s => s.id === item.stage)?.label || item.stage);

  return (
    <div
      className="pd-card pd-card-hover p-4 pd-anim-in"
      style={{
        animationDelay: `${Math.min(index * 30, 400)}ms`,
        borderColor: isActiveTimer ? 'var(--accent)' : undefined,
        boxShadow: isActiveTimer ? '0 0 0 1px var(--accent-soft), 0 8px 24px -8px var(--accent-glow)' : undefined
      }}
    >
      <div className="flex items-center gap-4">
        {/* Kind badge */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: item.kind === 'tender' ? 'var(--accent-soft)' : 'var(--surface-2)',
            color: item.kind === 'tender' ? 'var(--accent)' : 'var(--text-muted)'
          }}
        >
          {item.kind === 'tender' ? <FileText size={16} /> : <ClipboardList size={16} />}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold pd-mono" style={{ color: 'var(--text-faint)' }}>
              {item.kind}
              {item.reference && <span> · {item.reference}</span>}
            </span>
            {item.kind === 'task' && <PriorityBadge priority={item.priority} />}
          </div>
          <div className="text-base font-medium mt-0.5 truncate">{item.title}</div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="pd-pill" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', borderColor: 'transparent' }}>
              <span className="pd-pill-dot" style={{ background: 'var(--text-muted)' }} />
              {statusLabel}
            </span>
            {item.deadline && (
              <span className="text-xs flex items-center gap-1 pd-mono" style={{ color: overdue ? 'var(--danger)' : urgent ? 'var(--warning)' : 'var(--text-muted)' }}>
                <Calendar size={10} />
                {fmtDateShort(item.deadline)}
                {days != null && item._open && (
                  <span>· {days < 0 ? `${Math.abs(days)}d late` : days === 0 ? 'today' : `${days}d`}</span>
                )}
                {slaLabel && (
                  <span
                    className="px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: 'var(--surface-3)', color: 'var(--text-muted)', fontSize: 9, marginLeft: 4 }}
                    title={`SLA: ${slaLabel}${item.slaDays ? ` (${item.slaDays} working days)` : ''}`}
                  >
                    {slaLabel}
                  </span>
                )}
              </span>
            )}
            {showTimeChip && (
              <span className="text-xs flex items-center gap-1 pd-mono" style={{ color: isActiveTimer ? 'var(--accent)' : 'var(--text-muted)' }}>
                <Timer size={10} />
                {isActiveTimer
                  ? <LiveDuration startTime={activeStartTime} format="live" />
                  : fmtDuration(baseSeconds)}
                {logCount > 0 && <span style={{ color: 'var(--text-faint)' }}>· {logCount} log{logCount === 1 ? '' : 's'}</span>}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <TimerButton
            isActive={isActiveTimer}
            disabled={hasOtherTimer}
            activeStartTime={activeStartTime}
            onStart={onStartTimer}
            onStop={onStopTimer}
          />
          {logCount > 0 && (
            <button className="pd-icon-btn" onClick={onViewLogs} title="View work logs" aria-label="View work logs"><History size={14} /></button>
          )}
          <button
            className="pd-icon-btn relative"
            onClick={onViewAttachments}
            title={attachmentCount > 0 ? `Attachments · ${attachmentCount}` : 'Attachments'}
            aria-label="Attachments"
            style={attachmentCount > 0 ? { color: 'var(--accent)' } : undefined}
          >
            <Paperclip size={14} />
            {attachmentCount > 0 && (
              <span
                className="absolute pd-mono"
                style={{
                  top: 2, right: 2,
                  fontSize: 9, lineHeight: 1,
                  padding: '2px 4px',
                  borderRadius: 999,
                  background: 'var(--accent)',
                  color: 'var(--bg)'
                }}
              >
                {attachmentCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
