import { Target } from 'lucide-react';
import { computeTarget, fmtMoney, fmtMoneyExact } from '../../lib/format';
import { MiniStat } from '../dashboard/MiniStat';

function Widget_AnnualTarget({ data }) {
  const today = new Date();
  const year = today.getFullYear();
  const ytd = data.savings.filter(s => new Date(s.date).getFullYear() === year).reduce((sum, s) => sum + Number(s.amount), 0);
  const target = computeTarget(data.profile, data.tenders);
  const targetPct = target > 0 ? Math.min(100, Math.round((ytd / target) * 100)) : 0;
  return (
    <div className="pd-card p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="pd-display text-xl sm:text-2xl font-medium">Annual Target</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Savings progress</p>
        </div>
        <Target size={18} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div className="flex items-baseline gap-3 mb-2 flex-wrap">
        <span className="pd-display text-3xl sm:text-4xl md:text-5xl font-semibold pd-glow-text">{fmtMoneyExact(ytd)}</span>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>of {fmtMoneyExact(target)}</span>
      </div>
      <div className="pd-progress-track mb-4">
        <div className="pd-progress-fill" style={{ width: `${targetPct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <MiniStat label="Achieved" value={`${targetPct}%`} />
        <MiniStat label="Remaining" value={fmtMoney(Math.max(0, target - ytd))} />
        <MiniStat label="Entries" value={data.savings.filter(s => new Date(s.date).getFullYear() === year).length} />
      </div>
    </div>
  );
}

export default Widget_AnnualTarget;
