// Form field wrapper with label.

export const Field = ({ label, children }) => (
  <label className="block mb-4">
    <span className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{label}</span>
    {children}
  </label>
);
