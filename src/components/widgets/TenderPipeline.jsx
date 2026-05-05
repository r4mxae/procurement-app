import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { TENDER_STAGES } from '../../constants/domain';
import { fmtMoney } from '../../lib/format';

function Widget_TenderPipeline({ data, setView, disabled }) {
  const byStage = useMemo(() => {
    const map = {};
    TENDER_STAGES.forEach(s => { map[s.id] = data.tenders.filter(t => t.stage === s.id); });
    return map;
  }, [data.tenders]);
  return (
    <div className="pd-card p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="pd-display text-xl sm:text-2xl font-medium">Tender Pipeline</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Tenders across stages</p>
        </div>
        {!disabled && (
          <button className="pd-btn pd-btn-ghost px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5" onClick={() => setView('tenders')}>
            <ChevronRight size={12} /> View all
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {TENDER_STAGES.map(s => {
          const items = byStage[s.id] || [];
          const value = items.reduce((sum, t) => sum + Number(t.value || 0), 0);
          return (
            <div key={s.id} className="px-3 py-3 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              <div className="pd-display text-2xl font-semibold mt-1">{items.length}</div>
              <div className="text-[10px] pd-mono mt-0.5" style={{ color: 'var(--text-faint)' }}>{fmtMoney(value)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Widget_TenderPipeline;
