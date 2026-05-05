import React, { useMemo, useState } from 'react';
import { Calendar, DollarSign, Edit2, FileText, Hash, Plus, Save, Settings, Target, Trash2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Empty } from '../components/common/Empty';
import { Modal } from '../components/common/Modal';
import { PageHeader } from '../components/common/PageHeader';
import { TargetEditorBody } from '../components/modals/TargetEditorBody';
import { SavingsForm } from '../components/savings/SavingsForm';
import { SAVINGS_CATEGORIES } from '../constants/domain';
import { computeTarget, computeTenderBudget, countTendersInYear, fmtDateShort, fmtMoney, fmtMoneyExact, monthKey } from '../lib/format';

function SavingsView({ data, upsertSaving, deleteSaving, updateProfile }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editTarget, setEditTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState({
    targetMode: data.profile?.targetMode || 'absolute',
    annualTarget: data.profile?.annualTarget ?? 500000,
    targetPercentage: data.profile?.targetPercentage ?? 8
  });

  const openTargetEditor = () => {
    setTargetDraft({
      targetMode: data.profile?.targetMode || 'absolute',
      annualTarget: data.profile?.annualTarget ?? 500000,
      targetPercentage: data.profile?.targetPercentage ?? 8
    });
    setEditTarget(true);
  };

  const year = new Date().getFullYear();
  const ytd = data.savings.filter(s => new Date(s.date).getFullYear() === year).reduce((sum, s) => sum + Number(s.amount), 0);
  const total = data.savings.reduce((sum, s) => sum + Number(s.amount), 0);
  const target = computeTarget(data.profile, data.tenders);
  const targetPct = target > 0 ? Math.min(100, Math.round((ytd / target) * 100)) : 0;

  const byCategory = useMemo(() => {
    const map = {};
    SAVINGS_CATEGORIES.forEach(c => { map[c] = 0; });
    data.savings.forEach(s => { map[s.category] = (map[s.category] || 0) + Number(s.amount); });
    return Object.entries(map).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [data.savings]);

  const monthly = useMemo(() => {
    const months = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      months[key] = { month: d.toLocaleDateString('en-US', { month: 'short' }), savings: 0 };
    }
    data.savings.forEach(s => {
      const key = monthKey(s.date);
      if (months[key]) months[key].savings += Number(s.amount);
    });
    return Object.values(months);
  }, [data.savings]);

  const sorted = [...data.savings].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 pb-16">
      <PageHeader
        title="Savings"
        subtitle="Track and quantify the value you generate"
        action={<button className="pd-btn pd-btn-primary px-4 py-2.5 rounded-lg text-sm flex items-center gap-2" onClick={() => setAdding(true)}><Plus size={15} /> Log Savings</button>}
      />

      {/* Top row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="pd-card p-6">
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Year-to-date</div>
          <div className="pd-display text-4xl font-semibold pd-glow-text">{fmtMoneyExact(ytd)}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{year} cumulative</div>
        </div>
        <div className="pd-card p-6">
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>All-time total</div>
          <div className="pd-display text-4xl font-semibold">{fmtMoneyExact(total)}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{data.savings.length} entries logged</div>
        </div>
        <div className="pd-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Annual target</div>
            <button className="pd-icon-btn" onClick={openTargetEditor} aria-label="Edit savings target" title="Edit target"><Settings size={13} /></button>
          </div>
          <div className="pd-display text-4xl font-semibold">{fmtMoneyExact(target)}</div>
          {data.profile?.targetMode === 'percentage' && (
            <div className="text-[11px] mt-1 pd-mono" style={{ color: 'var(--accent)' }}>
              {Number(data.profile.targetPercentage) || 0}% of {fmtMoney(computeTenderBudget(data.tenders, year))} tender budget · {countTendersInYear(data.tenders, year)} tender{countTendersInYear(data.tenders, year) === 1 ? '' : 's'} in {year}
            </div>
          )}
          <div className="pd-progress-track mt-3">
            <div className="pd-progress-fill" style={{ width: `${targetPct}%` }} />
          </div>
          <div className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{targetPct}% achieved</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 pd-card p-6">
          <h3 className="pd-display text-2xl font-medium mb-1">Monthly Savings</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Last 12 months</p>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 10, fontSize: 12 }} formatter={(v) => fmtMoneyExact(v)} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey="savings" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="pd-card p-6">
          <h3 className="pd-display text-2xl font-medium mb-1">By Category</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>All-time breakdown</p>
          {byCategory.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No data yet</p>
          ) : (
            <div className="space-y-2.5">
              {byCategory.sort((a, b) => b.value - a.value).map((cat, i) => {
                const max = Math.max(...byCategory.map(c => c.value));
                const pct = (cat.value / max) * 100;
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-muted)' }}>{cat.name}</span>
                      <span className="pd-mono font-medium">{fmtMoney(cat.value)}</span>
                    </div>
                    <div className="pd-progress-track" style={{ height: 4 }}>
                      <div className="pd-progress-fill" style={{ width: `${pct}%`, transitionDelay: `${i * 50}ms` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Entries */}
      <div className="pd-card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <h3 className="pd-display text-xl font-medium">Savings Entries</h3>
          <span className="text-xs pd-mono" style={{ color: 'var(--text-muted)' }}>{sorted.length} total</span>
        </div>
        {sorted.length === 0 ? (
          <Empty icon={DollarSign} title="No savings logged" hint="Start tracking the value you generate" />
        ) : (
          <div>
            {sorted.map((s, i) => (
              <div key={s.id} className="pd-row flex items-center gap-4 px-6 py-4 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  <DollarSign size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{s.description}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Hash size={10} />{s.category}</span>
                    <span className="flex items-center gap-1 pd-mono"><Calendar size={10} />{fmtDateShort(s.date)}</span>
                    {s.tenderRef && <span className="flex items-center gap-1 pd-mono"><FileText size={10} />{s.tenderRef}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="pd-display text-lg font-semibold" style={{ color: 'var(--success)' }}>{fmtMoneyExact(s.amount)}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button className="pd-icon-btn" onClick={() => setEditing(s)} aria-label="Edit savings entry" title="Edit"><Edit2 size={14} /></button>
                  <button className="pd-icon-btn danger" onClick={() => { if (confirm('Delete this entry?')) deleteSaving(s.id); }} aria-label="Delete savings entry" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Log Savings">
        <SavingsForm settings={data.settings} onSubmit={(d) => { upsertSaving(d); setAdding(false); }} onCancel={() => setAdding(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Savings Entry">
        {editing && <SavingsForm settings={data.settings} initial={editing} onSubmit={(d) => { upsertSaving({ ...editing, ...d }); setEditing(null); }} onCancel={() => setEditing(null)} />}
      </Modal>
      <Modal open={editTarget} onClose={() => setEditTarget(false)} title="Update Annual Target">
        <TargetEditorBody draft={targetDraft} setDraft={setTargetDraft} tenders={data.tenders} />
        <div className="flex justify-end gap-2 mt-4">
          <button className="pd-btn pd-btn-ghost px-4 py-2 rounded-lg text-sm" onClick={() => setEditTarget(false)}>Cancel</button>
          <button
            className="pd-btn pd-btn-primary px-4 py-2 rounded-lg text-sm"
            onClick={() => {
              updateProfile({
                targetMode: targetDraft.targetMode,
                annualTarget: Number(targetDraft.annualTarget) || 0,
                targetPercentage: Number(targetDraft.targetPercentage) || 0
              });
              setEditTarget(false);
            }}
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default SavingsView;
