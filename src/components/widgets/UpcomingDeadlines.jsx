import React, { useMemo } from 'react';
import { Calendar, ClipboardList, FileText, Inbox } from 'lucide-react';
import { daysUntil, fmtDateShort, getUrgentDays } from '../../lib/format';
import { Empty } from '../common/Empty';

function Widget_UpcomingDeadlines({ data, setView, disabled }) {
  const upcoming = useMemo(() => {
    const items = [
      ...data.tasks.filter(t => t.status !== 'completed' && t.deadline).map(t => ({ kind: 'task', id: t.id, title: t.title, deadline: t.deadline, meta: t.priority })),
      ...data.tenders.filter(t => !['closed', 'awarded'].includes(t.stage) && t.deadline).map(t => ({ kind: 'tender', id: t.id, title: t.title, deadline: t.deadline, meta: t.stage }))
    ];
    return items.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 6);
  }, [data]);
  return (
    <div className="pd-card p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="pd-display text-xl sm:text-2xl font-medium">Upcoming Deadlines</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Next priority items</p>
        </div>
        <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
      </div>
      {upcoming.length === 0 ? (
        <Empty icon={Inbox} title="All clear" hint="No upcoming deadlines" />
      ) : (
        <div className="space-y-1">
          {upcoming.map(item => {
            const days = daysUntil(item.deadline);
            const urgent = days != null && days <= getUrgentDays();
            const RowEl = disabled ? 'div' : 'button';
            return (
              <RowEl
                key={`${item.kind}-${item.id}`}
                {...(disabled
                  ? {}
                  : {
                      type: 'button',
                      onClick: () => setView(item.kind === 'task' ? 'tasks' : 'tenders'),
                      'aria-label': `Open ${item.kind}: ${item.title}`,
                    })}
                className={`pd-row w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left ${disabled ? '' : 'cursor-pointer'}`}
                style={disabled ? undefined : { background: 'transparent', border: 'none' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: urgent ? 'rgba(201, 122, 122, 0.12)' : 'var(--surface-2)', color: urgent ? 'var(--danger)' : 'var(--text-muted)' }}>
                  {item.kind === 'task' ? <ClipboardList size={15} /> : <FileText size={15} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.title}</div>
                  <div className="text-xs uppercase tracking-wide mt-0.5" style={{ color: 'var(--text-faint)' }}>{item.kind} · {item.meta}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm pd-mono" style={{ color: urgent ? 'var(--danger)' : 'var(--text)' }}>
                    {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days < 0 ? `${Math.abs(days)}d late` : `${days}d`}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{fmtDateShort(item.deadline)}</div>
                </div>
              </RowEl>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Widget_UpcomingDeadlines;
