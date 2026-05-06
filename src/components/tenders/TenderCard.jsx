import { Calendar, Edit2, History, Paperclip, Timer, Trash2 } from 'lucide-react';
import { SLA_TYPES, TENDER_STAGES } from '../../constants/domain';
import { daysUntil, fmtDateShort, fmtDuration, fmtMoney, totalLoggedSeconds } from '../../lib/format';
import { LiveDuration } from '../common/LiveDuration';
import { StagePill } from '../common/StagePill';
import { TimerButton } from '../common/TimerButton';

export function TenderCard({ tender, index, isActiveTimer, activeStartTime, hasOtherTimer, onStartTimer, onStopTimer, onViewLogs, onViewAttachments, onEdit, onDelete }) {
  const days = daysUntil(tender.deadline);
  const stageIdx = TENDER_STAGES.findIndex(s => s.id === tender.stage);
  const progress = ((stageIdx + 1) / TENDER_STAGES.length) * 100;
  const baseSeconds = totalLoggedSeconds(tender.workLogs);
  const logCount = (tender.workLogs || []).length;
  const attachmentCount = (tender.attachments || []).length;
  const showTimeChip = baseSeconds > 0 || isActiveTimer;
  const slaLabel = tender.slaType ? SLA_TYPES.find(t => t.id === tender.slaType)?.label : null;

  // Derived savings — both calculations are shown when their inputs are
  // present. Falls back to the legacy savings field for old data.
  const fo = Number(tender.firstOffer);
  const fn = Number(tender.finalOffer);
  const budget = Number(tender.value) || 0;
  const savingsVsFirst = fo > 0 && fn > 0 ? fo - fn : null;
  const savingsVsBudget = budget > 0 && fn > 0 ? budget - fn : null;
  const legacySavings = Number(tender.savings) || 0;

  return (
    <div
      className="pd-card pd-card-hover p-5 pd-anim-in"
      style={{
        animationDelay: `${Math.min(index * 50, 400)}ms`,
        borderColor: isActiveTimer ? 'var(--accent)' : undefined,
        boxShadow: isActiveTimer ? '0 0 0 1px var(--accent-soft), 0 8px 24px -8px var(--accent-glow)' : undefined
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] pd-mono mb-1" style={{ color: 'var(--accent)' }}>{tender.reference || '—'}</div>
          <h3 className="text-lg font-medium leading-tight">{tender.title}</h3>
          {tender.notes && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{tender.notes}</p>}
        </div>
        <StagePill stage={tender.stage} />
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-3">
        <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Budget</div>
          <div className="pd-display text-base font-medium mt-0.5">{fmtMoney(budget)}</div>
        </div>
        <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Vendors</div>
          <div className="pd-display text-base font-medium mt-0.5">{tender.vendorCount || 0}</div>
        </div>
      </div>

      {/* Savings strip — two derived figures when offers are filled,
          legacy single-number fallback for older tenders, otherwise hide. */}
      {(savingsVsFirst != null || savingsVsBudget != null) ? (
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-4">
          <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>vs first offer</div>
            <div
              className="pd-display text-base font-medium mt-0.5"
              style={{ color: savingsVsFirst != null ? (savingsVsFirst >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)' }}
            >
              {savingsVsFirst != null ? fmtMoney(savingsVsFirst) : '—'}
            </div>
          </div>
          <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>vs budget</div>
            <div
              className="pd-display text-base font-medium mt-0.5"
              style={{ color: savingsVsBudget != null ? (savingsVsBudget >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)' }}
            >
              {savingsVsBudget != null ? fmtMoney(savingsVsBudget) : '—'}
            </div>
          </div>
        </div>
      ) : legacySavings > 0 ? (
        <div className="mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Savings</div>
          <div className="pd-display text-base font-medium mt-0.5" style={{ color: 'var(--success)' }}>
            {fmtMoney(legacySavings)}
          </div>
        </div>
      ) : null}

      <div className="mb-3">
        <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
          <span>Stage progress</span>
          <span className="pd-mono">{stageIdx + 1}/{TENDER_STAGES.length}</span>
        </div>
        <div className="pd-progress-track">
          <div className="pd-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <div className="text-xs flex items-center gap-1.5 pd-mono" style={{ color: days != null && days < 0 && tender.stage !== 'closed' ? 'var(--danger)' : 'var(--text-muted)' }}>
            <Calendar size={11} />
            {tender.deadline ? `${fmtDateShort(tender.deadline)}${days != null ? ` · ${days < 0 ? `${Math.abs(days)}d late` : days === 0 ? 'today' : `${days}d left`}` : ''}` : 'No deadline'}
            {slaLabel && (
              <span
                className="px-1.5 py-0.5 rounded uppercase tracking-wider"
                style={{ background: 'var(--surface-3)', color: 'var(--text-muted)', fontSize: 9, marginLeft: 4 }}
                title={`SLA: ${slaLabel}${tender.slaDays ? ` (${tender.slaDays} working days)` : ''}`}
              >
                {slaLabel}
              </span>
            )}
          </div>
          {showTimeChip && (
            <button
              onClick={onViewLogs}
              className="text-xs flex items-center gap-1 pd-mono transition-colors"
              style={{ color: isActiveTimer ? 'var(--accent)' : 'var(--text-muted)' }}
              onMouseEnter={(e) => { if (!isActiveTimer) e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { if (!isActiveTimer) e.currentTarget.style.color = 'var(--text-muted)'; }}
              title="View logs"
            >
              <Timer size={11} />
              {isActiveTimer
                ? <LiveDuration startTime={activeStartTime} format="live" />
                : fmtDuration(baseSeconds)}
              {logCount > 0 && <span style={{ color: 'var(--text-faint)' }}>· {logCount}</span>}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <TimerButton
            isActive={isActiveTimer}
            disabled={hasOtherTimer}
            activeStartTime={activeStartTime}
            onStart={onStartTimer}
            onStop={onStopTimer}
          />
          {logCount > 0 && (
            <button className="pd-icon-btn" onClick={onViewLogs} title="View work logs" aria-label="View work logs"><History size={14} /></button>
          )}
          <button
            className="pd-icon-btn relative"
            onClick={onViewAttachments}
            title={attachmentCount > 0 ? `Attachments · ${attachmentCount}` : 'Attachments'}
            aria-label="Attachments"
            style={attachmentCount > 0 ? { color: 'var(--accent)' } : undefined}
          >
            <Paperclip size={14} />
            {attachmentCount > 0 && (
              <span
                className="absolute pd-mono"
                style={{
                  top: 2, right: 2,
                  fontSize: 9, lineHeight: 1,
                  padding: '2px 4px',
                  borderRadius: 999,
                  background: 'var(--accent)',
                  color: 'var(--bg)'
                }}
              >
                {attachmentCount}
              </span>
            )}
          </button>
          <button className="pd-icon-btn" onClick={onEdit} title="Edit" aria-label="Edit tender"><Edit2 size={14} /></button>
          <button className="pd-icon-btn danger" onClick={onDelete} title="Delete" aria-label="Delete tender"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  );
}
