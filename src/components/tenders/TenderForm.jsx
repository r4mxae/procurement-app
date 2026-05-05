import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { TENDER_STAGES } from '../../constants/domain';
import { Field } from '../common/Field';

export function TenderForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', reference: '', stage: 'draft', value: '', vendorCount: 0, deadline: '', savings: 0, notes: '' });

  const submit = () => {
    if (!form.title.trim()) return;
    onSubmit({ ...form, value: Number(form.value) || 0, vendorCount: Number(form.vendorCount) || 0, savings: Number(form.savings) || 0 });
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
        <Field label="Value (USD)">
          <input type="number" className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0" />
        </Field>
        <Field label="Vendor Count">
          <input type="number" className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.vendorCount} onChange={(e) => setForm({ ...form, vendorCount: e.target.value })} placeholder="0" />
        </Field>
        <Field label="Deadline">
          <input type="date" className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </Field>
        <Field label="Savings (USD)">
          <input type="number" className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.savings} onChange={(e) => setForm({ ...form, savings: e.target.value })} placeholder="0" />
        </Field>
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
