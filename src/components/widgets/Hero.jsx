import { Plus } from 'lucide-react';
import { fmtMoneyExact } from '../../lib/format';

function Widget_Hero({ data, setView, disabled }) {
  const today = new Date();
  const ytd = data.savings.filter(s => new Date(s.date).getFullYear() === today.getFullYear()).reduce((sum, s) => sum + Number(s.amount), 0);
  const activeTasks = data.tasks.filter(t => t.status !== 'completed').length;
  const activeTenders = data.tenders.filter(t => !['closed'].includes(t.stage)).length;
  return (
    <div className="pd-card p-5 sm:p-6 md:p-8" style={{ background: 'var(--surface)' }}>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h2 className="pd-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight mt-1">
            Good {today.getHours() < 12 ? 'morning' : today.getHours() < 18 ? 'afternoon' : 'evening'}<span style={{ color: 'var(--accent)' }}>.</span>
          </h2>
          <p className="text-sm mt-2 max-w-xl" style={{ color: 'var(--text-muted)' }}>
            You have <span style={{ color: 'var(--text)' }}>{activeTasks} open tasks</span> and <span style={{ color: 'var(--text)' }}>{activeTenders} active tenders</span>. Year-to-date savings sit at <span style={{ color: 'var(--accent)' }}>{fmtMoneyExact(ytd)}</span>.
          </p>
        </div>
        {!disabled && (
          <div className="flex gap-2">
            <button className="pd-btn pd-btn-ghost px-4 py-2.5 rounded-lg text-sm flex items-center gap-2" onClick={() => setView('tasks')}>
              <Plus size={15} /> New Task
            </button>
            <button className="pd-btn pd-btn-primary px-4 py-2.5 rounded-lg text-sm flex items-center gap-2" onClick={() => setView('tenders')}>
              <Plus size={15} /> New Tender
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Widget_Hero;
