// Data Management action row (export / import / reset / clear).

export function DataAction({ icon: Icon, title, description, actionLabel, onAction, danger }) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all"
      style={{ background: 'var(--surface-2)', border: '1px solid transparent' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = danger ? 'var(--danger)' : 'var(--border-strong)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--surface)', color: danger ? 'var(--danger)' : 'var(--text-muted)' }}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <button
        onClick={onAction}
        className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0"
        style={{
          background: danger ? 'transparent' : 'var(--surface)',
          border: `1px solid ${danger ? 'var(--danger)' : 'var(--border)'}`,
          color: danger ? 'var(--danger)' : 'var(--text)'
        }}
        onMouseEnter={(e) => {
          if (danger) {
            e.currentTarget.style.background = 'var(--danger)';
            e.currentTarget.style.color = 'var(--bg)';
          } else {
            e.currentTarget.style.borderColor = 'var(--border-strong)';
          }
        }}
        onMouseLeave={(e) => {
          if (danger) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--danger)';
          } else {
            e.currentTarget.style.borderColor = 'var(--border)';
          }
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}
