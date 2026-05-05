import { ClipboardList, DollarSign, FileText, ListChecks } from 'lucide-react';

function Widget_QuickActions({ setView, disabled }) {
  const actions = [
    { label: 'New Task', icon: ClipboardList, view: 'tasks' },
    { label: 'New Tender', icon: FileText, view: 'tenders' },
    { label: 'Log Saving', icon: DollarSign, view: 'savings' },
    { label: 'View All Work', icon: ListChecks, view: 'work' }
  ];
  return (
    <div className="pd-card p-5 sm:p-6 h-full">
      <h3 className="pd-display text-xl sm:text-2xl font-medium mb-1">Quick Actions</h3>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>One-tap navigation</p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(a => (
          <button
            key={a.view}
            className="pd-btn pd-btn-ghost px-3 py-3 rounded-lg text-sm flex items-center gap-2"
            onClick={disabled ? undefined : () => setView(a.view)}
          >
            <a.icon size={15} /> {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Widget_QuickActions;
