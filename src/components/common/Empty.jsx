// Empty-state placeholder for lists.

export const Empty = ({ icon: Icon, title, hint }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
      <Icon size={22} />
    </div>
    <p className="pd-display text-xl mb-1">{title}</p>
    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{hint}</p>
  </div>
);
