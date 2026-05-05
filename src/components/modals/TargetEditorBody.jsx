// Body of the annual-savings-target editor.

import { FileText, Target } from 'lucide-react';
import { computeTarget, computeTenderBudget, countTendersInYear, fmtMoney, fmtMoneyExact } from '../../lib/format';
import { Field } from '../common/Field';
import { ModeToggle } from '../common/ModeToggle';

export const TargetEditorBody = ({ draft, setDraft, tenders = [] }) => {
  const year = new Date().getFullYear();
  const tenderBudget = computeTenderBudget(tenders, year);
  const tenderCount = countTendersInYear(tenders, year);
  const computed = computeTarget(draft, tenders);

  return (
    <div>
      <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Target type</div>
      <ModeToggle
        value={draft.targetMode || 'absolute'}
        onChange={(m) => setDraft({ ...draft, targetMode: m })}
        options={[
          { id: 'absolute', label: 'Absolute amount' },
          { id: 'percentage', label: 'Percentage of tender budget' }
        ]}
      />

      <div className="mt-4">
        {draft.targetMode === 'percentage' ? (
          <>
            <Field label="Target percentage of tender budget (%)">
              <input
                type="number" step="0.1" min="0" max="100"
                className="pd-input rounded-lg px-3 py-2 text-sm w-full"
                value={draft.targetPercentage}
                onChange={(e) => setDraft({ ...draft, targetPercentage: e.target.value })}
                placeholder="e.g. 8"
              />
            </Field>
            <div className="px-4 py-3 rounded-lg flex items-center justify-between mb-3" style={{ background: 'var(--surface-2)' }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <FileText size={12} />
                <span>{year} tender budget — auto-computed from {tenderCount} tender{tenderCount === 1 ? '' : 's'}</span>
              </div>
              <span className="pd-mono text-sm font-medium">{fmtMoneyExact(tenderBudget)}</span>
            </div>
          </>
        ) : (
          <Field label="Annual target amount">
            <input
              type="number" min="0"
              className="pd-input rounded-lg px-3 py-2 text-sm w-full"
              value={draft.annualTarget}
              onChange={(e) => setDraft({ ...draft, annualTarget: e.target.value })}
              placeholder="e.g. 500000"
            />
          </Field>
        )}
      </div>

      <div className="px-4 py-3 rounded-lg flex items-center justify-between mt-1" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
        <div className="text-xs" style={{ color: 'var(--text)' }}>
          {draft.targetMode === 'percentage' ? (
            tenderBudget > 0
              ? <>Resolved target: <span className="pd-mono">{Number(draft.targetPercentage) || 0}%</span> × <span className="pd-mono">{fmtMoney(tenderBudget)}</span></>
              : <>Add tenders to {year} to activate this target</>
          ) : 'Resolved target value'}
        </div>
        <span className="pd-display text-xl font-semibold" style={{ color: 'var(--accent)' }}>{fmtMoneyExact(computed)}</span>
      </div>
      {draft.targetMode === 'percentage' && (
        <p className="text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>
          The target updates automatically as you add or update tenders. Only tenders dated within {year} count toward the budget.
        </p>
      )}
    </div>
  );
};
