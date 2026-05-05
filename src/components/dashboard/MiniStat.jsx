// Compact stat display (label + value).

export function MiniStat({ label, value }) {
  return (
    <div className="px-3 py-2.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="pd-display text-lg font-medium mt-0.5">{value}</div>
    </div>
  );
}
