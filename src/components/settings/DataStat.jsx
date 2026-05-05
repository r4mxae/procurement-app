// Data Management stat tile.

export function DataStat({ label, value }) {
  return (
    <div className="px-3 py-2.5 rounded-lg text-center" style={{ background: 'var(--surface-2)' }}>
      <div className="pd-display text-2xl font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}
