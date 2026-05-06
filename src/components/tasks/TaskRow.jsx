import { Calendar, CheckCircle2, Edit2, Hash, History, Paperclip, Timer, Trash2 } from 'lucide-react';
import { SLA_TYPES } from '../../constants/domain';
import { daysUntil, fmtDateShort, fmtDuration, totalLoggedSeconds, getUrgentDays } from '../../lib/format';
import { LiveDuration } from '../common/LiveDuration';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusPill } from '../common/StatusPill';
import { TimerButton } from '../common/TimerButton';

export function TaskRow({ task, index, isActiveTimer, activeStartTime, hasOtherTimer, onStartTimer, onStopTimer, onViewLogs, onViewAttachments, onStatusChange, onEdit, onDelete }) {
  const slaLabel = task.slaType ? SLA_TYPES.find(t => t.id === task.slaType)?.label : null;
  const days = daysUntil(task.deadline);
  const urgent = days != null && days <= getUrgentDays() && task.status !== 'completed';
  const overdue = days != null && days < 0 && task.status !== 'completed';
  const baseSeconds = totalLoggedSeconds(task.workLogs);
  const logCount = (task.workLogs || []).length;
  const attachmentCount = (task.attachments || []).length;
  const showTimeChip = baseSeconds > 0 || isActiveTimer;

  return (
    <div
      className="pd-card pd-card-hover p-4 pd-anim-in"
      style={{
        animationDelay: `${Math.min(index * 35, 400)}ms`,
        borderColor: isActiveTimer ? 'var(--accent)' : undefined,
        boxShadow: isActiveTimer ? '0 0 0 1px var(--accent-soft), 0 8px 24px -8px var(--accent-glow)' : undefined
      }}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => onStatusChange(task.status === 'completed' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'completed')}
          className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0"
          style={{
            border: `1.5px solid ${task.status === 'completed' ? 'var(--success)' : 'var(--border-strong)'}`,
            background: task.status === 'completed' ? 'var(--success)' : 'transparent',
            color: 'var(--bg)'
          }}
          title="Toggle status"
        >
          {task.status === 'completed' && <CheckCircle2 size={12} />}
          {task.status === 'in_progress' && <span className="block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--warning)' }} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-base font-medium ${task.status === 'completed' ? 'line-through' : ''}`} style={{ color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text)' }}>
                  {task.title}
                </span>
                <PriorityBadge priority={task.priority} />
              </div>
              {task.description && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <StatusPill status={task.status} />
                {task.category && (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Hash size={10} />{task.category}
                  </span>
                )}
                {task.deadline && (
                  <span className="text-xs flex items-center gap-1 pd-mono" style={{ color: overdue ? 'var(--danger)' : urgent ? 'var(--warning)' : 'var(--text-muted)' }}>
                    <Calendar size={10} />
                    {fmtDateShort(task.deadline)}
                    {days != null && task.status !== 'completed' && (
                      <span>· {days < 0 ? `${Math.abs(days)}d late` : days === 0 ? 'today' : `${days}d`}</span>
                    )}
                    {slaLabel && (
                      <span
                        className="px-1.5 py-0.5 rounded uppercase tracking-wider"
                        style={{ background: 'var(--surface-3)', color: 'var(--text-muted)', fontSize: 9, marginLeft: 4 }}
                        title={`SLA: ${slaLabel}${task.slaDays ? ` (${task.slaDays} working days)` : ''}`}
                      >
                        {slaLabel}
                      </span>
                    )}
                  </span>
                )}
                {showTimeChip && (
                  <button
                    onClick={onViewLogs}
                    className="text-xs flex items-center gap-1 pd-mono transition-colors"
                    style={{ color: isActiveTimer ? 'var(--accent)' : 'var(--text-muted)' }}
                    onMouseEnter={(e) => { if (!isActiveTimer) e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={(e) => { if (!isActiveTimer) e.currentTarget.style.color = 'var(--text-muted)'; }}
                    title="View logs"
                  >
                    <Timer size={10} />
                    {isActiveTimer
                      ? <LiveDuration startTime={activeStartTime} format="live" />
                      : fmtDuration(baseSeconds)}
                    {logCount > 0 && <span style={{ color: 'var(--text-faint)' }}>· {logCount} log{logCount === 1 ? '' : 's'}</span>}
                  </button>
                )}
              </div>
            </div>
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
              <button className="pd-icon-btn" onClick={onEdit} title="Edit" aria-label="Edit task"><Edit2 size={14} /></button>
              <button className="pd-icon-btn danger" onClick={onDelete} title="Delete" aria-label="Delete task"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
