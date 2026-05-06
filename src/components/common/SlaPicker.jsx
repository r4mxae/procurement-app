// SLA picker — instrument dropdown + working-days input.
//
// Replaces the plain date deadline on tasks and tenders. Picking an
// instrument auto-fills the working-days from the user's preset; picking
// "Custom" lets the user type any number. The parent form computes the
// concrete deadline ISO date at submit time using addWorkingDays() and
// the user's configured workWeek.

import React, { useEffect } from 'react';
import { Field } from './Field';
import { DEFAULT_SLA_PRESETS, SLA_TYPES } from '../../constants/domain';
import { addWorkingDays, fmtDateShort, todayISO } from '../../lib/format';

export function SlaPicker({ slaType, slaDays, onChange, slaPresets, workWeek, startISO }) {
  const presets = { ...DEFAULT_SLA_PRESETS, ...(slaPresets || {}) };

  // Auto-sync slaDays whenever the type changes to a preset, so the user
  // doesn't have to remember the standard number for each instrument.
  // Only fires when type changes, not on every render — guard with effect.
  useEffect(() => {
    if (!slaType || slaType === 'custom') return;
    const preset = presets[slaType];
    if (preset != null && preset !== Number(slaDays)) {
      onChange({ slaType, slaDays: preset });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slaType]);

  const days = slaDays === '' || slaDays == null ? '' : Number(slaDays);
  const previewDeadline = days
    ? addWorkingDays(startISO || todayISO(), days, workWeek)
    : null;

  return (
    <>
      <Field label="SLA type">
        <select
          className="pd-input rounded-lg px-3 py-2 text-sm w-full"
          value={slaType || ''}
          onChange={(e) => {
            const next = e.target.value || null;
            const presetDays = next && next !== 'custom' ? presets[next] : slaDays;
            onChange({ slaType: next, slaDays: presetDays });
          }}
        >
          <option value="">— None —</option>
          {SLA_TYPES.map(t => (
            <option key={t.id} value={t.id}>
              {t.label} · {t.description}
              {t.id !== 'custom' && presets[t.id] != null ? ` (${presets[t.id]} days)` : ''}
            </option>
          ))}
        </select>
      </Field>
      <Field label="SLA days (working days)">
        <input
          type="number"
          min="0"
          className="pd-input rounded-lg px-3 py-2 text-sm w-full"
          value={days}
          onChange={(e) => onChange({ slaType: slaType || 'custom', slaDays: e.target.value })}
          placeholder="e.g. 18"
        />
        {previewDeadline && (
          <div className="text-[11px] mt-1.5 pd-mono" style={{ color: 'var(--text-faint)' }}>
            Deadline: {fmtDateShort(previewDeadline)}
          </div>
        )}
      </Field>
    </>
  );
}
