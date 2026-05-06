import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { PRIORITIES, TASK_CATEGORIES, TASK_STATUSES } from '../../constants/domain';
import { Field } from '../common/Field';
import { SlaPicker } from '../common/SlaPicker';
import { addWorkingDays, todayISO } from '../../lib/format';

export function TaskForm({ initial, settings, onSubmit, onCancel }) {
  const allCategories = [...TASK_CATEGORIES, ...(settings?.customTaskCategories || [])];
  const defaultPriority = settings?.defaultTaskPriority || 'medium';
  const [form, setForm] = useState(initial || {
    title: '', description: '', status: 'todo',
    priority: defaultPriority,
    category: allCategories[0] || 'Other',
    slaType: null, slaDays: null, deadline: '',
  });

  const submit = () => {
    if (!form.title.trim()) return;
    // Compute deadline at save time from SLA, falling back to whatever was
    // already on the row (e.g. legacy items still using a hand-picked date).
    const start = form.createdAt ? form.createdAt.slice(0, 10) : todayISO();
    const deadline = form.slaDays
      ? addWorkingDays(start, form.slaDays, settings?.workWeek)
      : (form.deadline || null);
    onSubmit({
      ...form,
      slaDays: form.slaDays ? Number(form.slaDays) : null,
      deadline,
    });
  };

  return (
    <div>
      <Field label="Title">
        <input className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" autoFocus />
      </Field>
      <Field label="Description">
        <textarea className="pd-input rounded-lg px-3 py-2 text-sm w-full" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional details" />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Status">
          <select className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {TASK_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
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
      <div className="flex justify-end gap-2 mt-4">
        <button className="pd-btn pd-btn-ghost px-4 py-2 rounded-lg text-sm" onClick={onCancel}>Cancel</button>
        <button className="pd-btn pd-btn-primary px-4 py-2 rounded-lg text-sm" onClick={submit}>{initial ? 'Save Changes' : 'Create Task'}</button>
      </div>
    </div>
  );
}
