import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { SAVINGS_CATEGORIES } from '../../constants/domain';
import { todayISO } from '../../lib/format';
import { Field } from '../common/Field';

export function SavingsForm({ initial, settings, onSubmit, onCancel }) {
  const allCategories = [...SAVINGS_CATEGORIES, ...(settings?.customSavingsCategories || [])];
  const [form, setForm] = useState(initial || { description: '', amount: '', category: allCategories[0] || 'Other', date: todayISO(), tenderRef: '' });

  const submit = () => {
    if (!form.description.trim() || !form.amount) return;
    onSubmit({ ...form, amount: Number(form.amount) });
  };

  return (
    <div>
      <Field label="Description">
        <input className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Cloud Infrastructure renegotiation" autoFocus />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Amount (USD)">
          <input type="number" className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
        </Field>
        <Field label="Category">
          <select className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <Field label="Tender Reference">
          <input className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.tenderRef} onChange={(e) => setForm({ ...form, tenderRef: e.target.value })} placeholder="Optional" />
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="pd-btn pd-btn-ghost px-4 py-2 rounded-lg text-sm" onClick={onCancel}>Cancel</button>
        <button className="pd-btn pd-btn-primary px-4 py-2 rounded-lg text-sm" onClick={submit}>{initial ? 'Save' : 'Log Savings'}</button>
      </div>
    </div>
  );
}
