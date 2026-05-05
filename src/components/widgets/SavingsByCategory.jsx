import React, { useMemo } from 'react';
import { DollarSign } from 'lucide-react';
import { SAVINGS_CATEGORIES } from '../../constants/domain';
import { fmtMoney } from '../../lib/format';

function Widget_SavingsByCategory({ data }) {
  const byCategory = useMemo(() => {
    const map = {};
    SAVINGS_CATEGORIES.forEach(c => { map[c] = 0; });
    data.savings.forEach(s => { map[s.category] = (map[s.category] || 0) + Number(s.amount); });
    return Object.entries(map).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  }, [data.savings]);
  const max = Math.max(1, ...byCategory.map(c => c.amount));
  return (
    <div className="pd-card p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="pd-display text-xl sm:text-2xl font-medium">Savings by Category</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Where it's coming from</p>
        </div>
        <DollarSign size={18} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div className="space-y-3">
        {byCategory.map(c => (
          <div key={c.category}>
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: 'var(--text-muted)' }}>{c.category}</span>
              <span className="pd-mono font-medium">{fmtMoney(c.amount)}</span>
            </div>
            <div className="pd-progress-track" style={{ height: 4 }}>
              <div className="pd-progress-fill" style={{ width: `${(c.amount / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Widget_SavingsByCategory;
