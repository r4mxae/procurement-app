// Single-line insight card on the Performance view.

export function Insight({ icon: Icon, title, text, value, tone }) {
  const colorMap = { success: 'var(--success)', warning: 'var(--warning)', info: 'var(--info)' };
  const c = colorMap[tone];
  return (
    <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface)', color: c }}>
          <Icon size={14} />
        </div>
        <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</span>
      </div>
      <div className="text-base font-medium">{text}</div>
      <div className="pd-display text-2xl font-semibold mt-0.5" style={{ color: c }}>{value}</div>
    </div>
  );
}
