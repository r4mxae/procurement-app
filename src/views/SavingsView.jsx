// Savings — auto-derived from tender offers and budget.
//
// The view exposes the same dashboard for two complementary calculations:
//   * vs first offer = first_offer − final_offer (negotiation delta)
//   * vs budget      = budgeted_amount − final_offer (under-plan delta)
// No manual logging — all numbers come from tenders that have a final
// commercial offer plus the relevant left-hand input. Two export buttons
// in the header: a styled .xlsx (one sheet per mode) and a PNG snapshot
// of the currently visible dashboard.

import React, { useMemo, useRef, useState } from 'react';
import { Calendar, Camera, DollarSign, FileSpreadsheet, FileText, Hash, Settings, TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toPng } from 'html-to-image';
import { Empty } from '../components/common/Empty';
import { FilterTabs } from '../components/common/FilterTabs';
import { Modal } from '../components/common/Modal';
import { PageHeader } from '../components/common/PageHeader';
import { TargetEditorBody } from '../components/modals/TargetEditorBody';
import {
  computeTarget,
  computeTenderBudget,
  countTendersInYear,
  deriveSavingsFromTenders,
  fmtDateShort,
  fmtMoney,
  fmtMoneyExact,
  monthKey,
  todayISO,
} from '../lib/format';
import { exportSavingsToExcel } from '../lib/excel';

const MODES = [
  { id: 'vsFirst',  label: 'vs First Offer', subtitle: 'first commercial offer − final offer (negotiation gain)' },
  { id: 'vsBudget', label: 'vs Budget',      subtitle: 'budgeted amount − final offer (kept under plan)' },
];

function SavingsView({ data, updateProfile }) {
  const [mode, setMode] = useState('vsFirst');
  const [editTarget, setEditTarget] = useState(false);
  const [snapshotting, setSnapshotting] = useState(false);
  const [targetDraft, setTargetDraft] = useState({
    targetMode: data.profile?.targetMode || 'absolute',
    annualTarget: data.profile?.annualTarget ?? 500000,
    targetPercentage: data.profile?.targetPercentage ?? 8,
  });
  const dashboardRef = useRef(null);

  const openTargetEditor = () => {
    setTargetDraft({
      targetMode: data.profile?.targetMode || 'absolute',
      annualTarget: data.profile?.annualTarget ?? 500000,
      targetPercentage: data.profile?.targetPercentage ?? 8,
    });
    setEditTarget(true);
  };

  // Both modes computed once — counts in the tabs, plus quick handoff to
  // the Excel exporter without re-walking tenders.
  const allVsFirst  = useMemo(() => deriveSavingsFromTenders(data.tenders, 'vsFirst'),  [data.tenders]);
  const allVsBudget = useMemo(() => deriveSavingsFromTenders(data.tenders, 'vsBudget'), [data.tenders]);
  const entries = mode === 'vsFirst' ? allVsFirst : allVsBudget;

  const year = new Date().getFullYear();
  const ytd = entries
    .filter(s => new Date(s.date).getFullYear() === year)
    .reduce((sum, s) => sum + Number(s.amount), 0);
  const total = entries.reduce((sum, s) => sum + Number(s.amount), 0);
  const target = computeTarget(data.profile, data.tenders);
  const targetPct = target > 0 ? Math.min(100, Math.round((Math.max(0, ytd) / target) * 100)) : 0;

  const monthly = useMemo(() => {
    const months = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      months[key] = { month: d.toLocaleDateString('en-US', { month: 'short' }), savings: 0 };
    }
    entries.forEach(s => {
      const key = monthKey(s.date);
      if (months[key]) months[key].savings += Number(s.amount);
    });
    return Object.values(months);
  }, [entries]);

  // Top-tender breakdown — replaces the by-category panel since derived
  // savings don't have a free-form category. Top 8 by amount.
  const topTenders = useMemo(() => {
    const max = Math.max(0, ...entries.map(e => Math.abs(e.amount)));
    return [...entries]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)
      .map(e => ({
        ...e,
        pct: max > 0 ? Math.min(100, (Math.abs(e.amount) / max) * 100) : 0,
      }));
  }, [entries]);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [entries]
  );

  const handleExportExcel = () => {
    exportSavingsToExcel({
      profile: data.profile,
      vsFirst: allVsFirst,
      vsBudget: allVsBudget,
      filename: `savings-${todayISO()}.xlsx`,
    });
  };

  const handleExportSnapshot = async () => {
    if (!dashboardRef.current) return;
    setSnapshotting(true);
    try {
      // Use the surface color so the image background matches the theme,
      // not the transparent default which renders as black in some viewers.
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ffffff';
      const dataUrl = await toPng(dashboardRef.current, {
        backgroundColor: bg,
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `savings-${mode}-${todayISO()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Snapshot failed', e);
      alert('Could not generate snapshot: ' + (e?.message || e));
    } finally {
      setSnapshotting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 pb-16">
      <PageHeader
        title="Savings"
        subtitle="Auto-derived from tender first / final / budget offers"
        action={
          <div className="flex items-center gap-2">
            <button
              className="pd-btn pd-btn-ghost px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50"
              onClick={handleExportSnapshot}
              disabled={snapshotting || entries.length === 0}
              title="Download a PNG of the current dashboard"
            >
              <Camera size={14} /> {snapshotting ? 'Capturing…' : 'Snapshot'}
            </button>
            <button
              className="pd-btn pd-btn-primary px-3 py-2 rounded-lg text-sm flex items-center gap-1.5"
              onClick={handleExportExcel}
              disabled={allVsFirst.length === 0 && allVsBudget.length === 0}
              title="Download an .xlsx with a sheet per savings mode"
            >
              <FileSpreadsheet size={14} /> Export Excel
            </button>
          </div>
        }
      />

      <div className="mb-5">
        <FilterTabs
          options={MODES.map(m => ({
            id: m.id,
            label: m.label,
            count: m.id === 'vsFirst' ? allVsFirst.length : allVsBudget.length,
          }))}
          value={mode}
          onChange={setMode}
        />
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          {MODES.find(m => m.id === mode)?.subtitle}
        </p>
      </div>

      {/* Snapshot target — wrap the dashboard so the export captures all
          KPIs, charts, and the entries table together. */}
      <div ref={dashboardRef} style={{ background: 'var(--bg)', padding: 8, borderRadius: 12 }}>
        {/* Top row: KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="pd-card p-6">
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Year-to-date</div>
            <div
              className="pd-display text-4xl font-semibold pd-glow-text"
              style={{ color: ytd >= 0 ? 'var(--accent)' : 'var(--danger)' }}
            >
              {fmtMoneyExact(ytd)}
            </div>
            <div className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              {ytd >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {year} cumulative · {MODES.find(m => m.id === mode)?.label}
            </div>
          </div>
          <div className="pd-card p-6">
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>All-time total</div>
            <div className="pd-display text-4xl font-semibold" style={{ color: total >= 0 ? 'var(--text)' : 'var(--danger)' }}>
              {fmtMoneyExact(total)}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {entries.length} tender{entries.length === 1 ? '' : 's'} contributing
            </div>
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
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Last 12 months · {MODES.find(m => m.id === mode)?.label}</p>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--grid)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 10, fontSize: 12 }} formatter={(v) => fmtMoneyExact(v)} cursor={{ fill: 'var(--accent-soft)' }} />
                  <Bar dataKey="savings" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="pd-card p-6">
            <h3 className="pd-display text-2xl font-medium mb-1">Top Tenders</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Highest contributors · {MODES.find(m => m.id === mode)?.label}</p>
            {topTenders.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No data yet</p>
            ) : (
              <div className="space-y-2.5">
                {topTenders.map((t, i) => (
                  <div key={t.id}>
                    <div className="flex justify-between text-xs mb-1 gap-2">
                      <span className="truncate" style={{ color: 'var(--text-muted)' }} title={t.tenderTitle}>
                        {t.tenderRef || t.tenderTitle}
                      </span>
                      <span
                        className="pd-mono font-medium shrink-0"
                        style={{ color: t.amount >= 0 ? 'var(--text)' : 'var(--danger)' }}
                      >
                        {fmtMoney(t.amount)}
                      </span>
                    </div>
                    <div className="pd-progress-track" style={{ height: 4 }}>
                      <div
                        className="pd-progress-fill"
                        style={{
                          width: `${t.pct}%`,
                          transitionDelay: `${i * 50}ms`,
                          background: t.amount >= 0 ? 'var(--accent)' : 'var(--danger)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Entries — one row per tender contributing to the current mode. */}
        <div className="pd-card overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <h3 className="pd-display text-xl font-medium">Per-tender breakdown</h3>
            <span className="text-xs pd-mono" style={{ color: 'var(--text-muted)' }}>{sorted.length} tender{sorted.length === 1 ? '' : 's'}</span>
          </div>
          {sorted.length === 0 ? (
            <Empty
              icon={DollarSign}
              title="No savings yet"
              hint={mode === 'vsFirst'
                ? 'Tenders need both a first and a final commercial offer'
                : 'Tenders need both a budget and a final commercial offer'}
            />
          ) : (
            <div>
              {sorted.map((s) => {
                const isPositive = Number(s.amount) >= 0;
                const left = mode === 'vsFirst' ? s.firstOffer : s.budget;
                return (
                  <div key={s.id} className="pd-row flex items-center gap-4 px-6 py-4 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: isPositive ? 'var(--accent-soft)' : 'var(--surface-2)',
                        color: isPositive ? 'var(--accent)' : 'var(--danger)',
                      }}
                    >
                      {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{s.tenderTitle}</div>
                      <div className="flex items-center gap-3 mt-1 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
                        {s.tenderRef && <span className="flex items-center gap-1 pd-mono"><FileText size={10} />{s.tenderRef}</span>}
                        <span className="flex items-center gap-1 pd-mono"><Calendar size={10} />{fmtDateShort(s.date)}</span>
                        <span className="flex items-center gap-1 pd-mono">
                          <Hash size={10} />
                          {fmtMoney(left)} → {fmtMoney(s.finalOffer)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="pd-display text-lg font-semibold"
                        style={{ color: isPositive ? 'var(--success)' : 'var(--danger)' }}
                      >
                        {fmtMoneyExact(s.amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
                targetPercentage: Number(targetDraft.targetPercentage) || 0,
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
