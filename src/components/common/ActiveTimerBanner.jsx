// Sticky banner shown when a timer is running.

import { ListChecks, NotebookPen, Square, Timer } from 'lucide-react';
import { LiveDuration } from './LiveDuration';

export const ActiveTimerBanner = ({ timer, item, onStop, onJump, onLogProgress }) => {
  if (!timer || !item) return null;
  return (
    <div
      className="pd-active-timer-banner px-4 sm:px-6 md:px-10 py-3 flex items-center gap-4 border-b sticky top-0 z-30"
      style={{
        background: 'var(--accent-soft)',
        borderColor: 'var(--accent)'
      }}
    >
      <div className="pd-atb-label flex items-center gap-2">
        <span className="w-2 h-2 rounded-full pd-tick-dot" style={{ background: 'var(--accent)' }} />
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: 'var(--accent)' }}>Timer running</span>
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium truncate">{item.title}</span>
        <span className="pd-atb-kind text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
          {timer.kind}
        </span>
      </div>
      <span className="pd-mono text-base sm:text-xl font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>
        <LiveDuration startTime={timer.startTime} format="live" />
      </span>
      <div className="flex items-center gap-2">
        <button className="pd-atb-view-btn pd-btn pd-btn-ghost px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5" onClick={onJump}>
          <ListChecks size={13} /> View
        </button>
        {onLogProgress && (
          <button
            className="pd-atb-log-btn pd-btn pd-btn-ghost px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
            onClick={onLogProgress}
            title="Log the time so far and keep the timer running"
            aria-label="Log progress without stopping the timer"
          >
            <NotebookPen size={13} /> Log progress
          </button>
        )}
        <button
          className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0"
          onClick={onStop}
          style={{ background: 'var(--accent)', color: 'var(--bg)', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
        >
          <Square size={11} fill="currentColor" /> Stop
        </button>
      </div>
    </div>
  );
};
