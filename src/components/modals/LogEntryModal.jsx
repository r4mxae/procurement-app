// Log-entry note modal — shown when a timer is stopped.

import React, { useEffect, useState } from 'react';
import { Save, Timer, Trash2 } from 'lucide-react';
import { fmtDuration, fmtTimeOfDay } from '../../lib/format';
import { Field } from '../common/Field';
import { MiniStat } from '../dashboard/MiniStat';

export const LogEntryModal = ({ pending, item, onSave, onDiscard }) => {
  const [note, setNote] = useState('');
  const trimmed = note.trim();
  const keepRunning = !!pending?.keepRunning;
  const discardPrompt = keepRunning
    ? 'Discard this segment? The timer will keep running, but the time so far will not be recorded.'
    : 'Discard this session? The time will not be saved.';

  // Esc key triggers Discard with confirmation. We can't close silently
  // because the timer session hasn't been recorded yet.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (confirm(discardPrompt)) onDiscard?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onDiscard, discardPrompt]);

  return (
    <div
      className="pd-modal-backdrop"
      onClick={() => { /* prevent click-out closing — must explicitly Save or Discard */ }}
      role="presentation"
    >
      <div
        className="pd-modal pd-scroll"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Log work session"
      >
        <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Timer size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: 'var(--accent)' }}>
              {keepRunning ? 'Timer still running' : 'Session complete'}
            </span>
          </div>
          <h3 className="pd-display text-2xl font-medium leading-tight">
            {keepRunning ? 'Log progress' : 'Log your work'}
          </h3>
          {item && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              On <span style={{ color: 'var(--text)' }}>{item.title}</span>
            </p>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-2 mb-5">
            <MiniStat label="Duration" value={fmtDuration(pending.durationSeconds)} />
            <MiniStat label="Started" value={fmtTimeOfDay(pending.startTime)} />
            <MiniStat label={keepRunning ? 'Marker' : 'Stopped'} value={fmtTimeOfDay(pending.endTime)} />
          </div>

          <Field label="What did you accomplish?">
            <textarea
              className="pd-input rounded-lg px-3 py-2 text-sm w-full"
              rows={5}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={keepRunning ? 'Describe this step or sub-task before continuing…' : 'Describe what you worked on during this session…'}
              autoFocus
            />
            <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-faint)' }}>
              {keepRunning
                ? 'On save, this segment is logged and the timer restarts from now. Discard skips this segment but keeps the timer running.'
                : 'Required to save. If you discard, the time is not recorded.'}
            </p>
          </Field>

          <div className="flex justify-end gap-2 mt-2">
            <button
              className="pd-btn pd-btn-ghost px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
              onClick={() => { if (confirm(discardPrompt)) onDiscard(); }}
            >
              <Trash2 size={13} /> {keepRunning ? 'Discard segment' : 'Discard session'}
            </button>
            <button
              className="pd-btn pd-btn-primary px-4 py-2 rounded-lg text-sm"
              onClick={() => onSave(trimmed)}
              disabled={!trimmed}
              style={{ opacity: trimmed ? 1 : 0.5, cursor: trimmed ? 'pointer' : 'not-allowed' }}
            >
              {keepRunning ? 'Save & keep running' : 'Save log'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
