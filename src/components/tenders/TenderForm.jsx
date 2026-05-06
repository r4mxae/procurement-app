import React, { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { TENDER_STAGES } from '../../constants/domain';
import { CURRENCIES } from '../../constants/locale';
import { Field } from '../common/Field';
import { SlaPicker } from '../common/SlaPicker';
import { addWorkingDays, fmtMoneyExact, todayISO } from '../../lib/format';

const CLOSED_STAGES = ['closed', 'awarded'];

export function TenderForm({ initial, settings, onSubmit, onCancel }) {
  const currencyLabel = (
    CURRENCIES.find(c => c.code === (settings?.currency || 'USD'))?.code || 'USD'
  );
  const [form, setForm] = useState(initial || {
    title: '', reference: '', stage: 'draft',
    value: '', vendorCount: 0,
    slaType: null, slaDays: null, deadline: '',
    firstOffer: '', finalOffer: '',
    notes: '',
  });

  const isClosingStage = CLOSED_STAGES.includes(form.stage);

  // Live savings preview using the same math the card will use.
  const savingsPreview = useMemo(() => {
    const fo = Number(form.firstOffer);
    const fn = Number(form.finalOffer);
    const budget = Number(form.value);
    return {
      vsFirst: fo > 0 && fn > 0 ? fo - fn : null,
      vsBudget: budget > 0 && fn > 0 ? budget - fn : null,
    };
  }, [form.firstOffer, form.finalOffer, form.value]);

  const submit = () => {
    if (!form.title.trim()) return;
    const start = form.createdAt ? form.createdAt.slice(0, 10) : todayISO();
    const deadline = form.slaDays
      ? addWorkingDays(start, form.slaDays, settings?.workWeek)
      : (form.deadline || null);
    onSubmit({
      ...form,
      value: Number(form.value) || 0,
      vendorCount: Number(form.vendorCount) || 0,
      slaDays: form.slaDays ? Number(form.slaDays) : null,
      firstOffer: form.firstOffer === '' || form.firstOffer == null ? null : Number(form.firstOffer),
      finalOffer: form.finalOffer === '' || form.finalOffer == null ? null : Number(form.finalOffer),
      deadline,
    });
  };

  return (
    <div>
      <Field label="Title">
        <input className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Facilities Management Services" autoFocus />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Reference">
          <input className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="TND-2026-001" />
        </Field>
        <Field label="Stage">
          <select className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
            {TENDER_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
        <Field label={`Budgeted amount (${currencyLabel})`}>
          <input type="number" className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0" />
        </Field>
        <Field label="Vendor Count">
          <input type="number" className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.vendorCount} onChange={(e) => setForm({ ...form, vendorCount: e.target.value })} placeholder="0" />
        </Field>
        <SlaPicker
          slaType={form.slaType}
          slaDays={form.slaDays}
          onChange={(p) => setForm({ ...form, ...p })}
          slaPresets={settings?.slaPresets}
          workWeek={settings?.workWeek}
          startISO={form.createdAt ? form.createdAt.slice(0, 10) : todayISO()}
        />
      </div>

      {/* Commercial offers — surfaced always, but visually called out when
          the tender is in a closing stage so it's obvious where to fill
          in the post-evaluation numbers. */}
      <div
        className="mt-4 p-3 rounded-lg"
        style={{
          background: isClosingStage ? 'var(--accent-soft)' : 'var(--surface-2)',
          border: `1px solid ${isClosingStage ? 'var(--accent)' : 'var(--border)'}`,
        }}
      >
        <div className="text-xs uppercase tracking-wider mb-2" style={{ color: isClosingStage ? 'var(--accent)' : 'var(--text-muted)' }}>
          Commercial offers {isClosingStage ? '· required to compute savings' : '(optional until closing)'}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={`First commercial offer (${currencyLabel})`}>
            <input type="number" className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.firstOffer ?? ''} onChange={(e) => setForm({ ...form, firstOffer: e.target.value })} placeholder="0" />
          </Field>
          <Field label={`Final commercial offer (${currencyLabel})`}>
            <input type="number" className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.finalOffer ?? ''} onChange={(e) => setForm({ ...form, finalOffer: e.target.value })} placeholder="0" />
          </Field>
        </div>
        {(savingsPreview.vsFirst != null || savingsPreview.vsBudget != null) && (
          <div className="text-[11px] mt-2 pd-mono flex flex-wrap gap-x-4 gap-y-1" style={{ color: 'var(--text-muted)' }}>
            {savingsPreview.vsFirst != null && (
              <span>
                Savings vs first offer:{' '}
                <span style={{ color: savingsPreview.vsFirst >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {fmtMoneyExact(savingsPreview.vsFirst)}
                </span>
              </span>
            )}
            {savingsPreview.vsBudget != null && (
              <span>
                Savings vs budget:{' '}
                <span style={{ color: savingsPreview.vsBudget >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {fmtMoneyExact(savingsPreview.vsBudget)}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      <Field label="Notes">
        <textarea className="pd-input rounded-lg px-3 py-2 text-sm w-full" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <button className="pd-btn pd-btn-ghost px-4 py-2 rounded-lg text-sm" onClick={onCancel}>Cancel</button>
        <button className="pd-btn pd-btn-primary px-4 py-2 rounded-lg text-sm" onClick={submit}>{initial ? 'Save Changes' : 'Create Tender'}</button>
      </div>
    </div>
  );
}
