// Reusable KPI tile used across dashboard widgets.

import { ArrowDown, ArrowUp } from 'lucide-react';

export function KpiCard({ label, value, sub, icon: Icon, delta, deltaText, accent }) {
  return (
    <div className="pd-stat-card p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent ? 'var(--accent-soft)' : 'var(--surface-2)', color: accent ? 'var(--accent)' : 'var(--text-muted)' }}>
          <Icon size={15} strokeWidth={1.8} />
        </div>
      </div>
      <div className="pd-display text-3xl font-medium mb-1" style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}>
        {value}
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        {delta === 'up' ? (
          <ArrowUp size={11} style={{ color: 'var(--success)' }} />
        ) : (
          <ArrowDown size={11} style={{ color: 'var(--danger)' }} />
        )}
        <span style={{ color: 'var(--text-muted)' }}>{sub}</span>
      </div>
    </div>
  );
}
