// Generic colored pill — used for status chips and tags.

export const Pill = ({ children, color = 'var(--text-muted)', bg = 'var(--surface-2)' }) => (
  <span className="pd-pill" style={{ background: bg, color, borderColor: 'transparent' }}>
    <span className="pd-pill-dot" style={{ background: color }} />
    {children}
  </span>
);
