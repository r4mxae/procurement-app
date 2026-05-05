import React, { useMemo } from 'react';
import { Award, Building2, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Area, CartesianGrid, Line, LineChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../components/common/PageHeader';
import { Insight } from '../components/performance/Insight';
import { computeTarget, fmtMoney, monthKey } from '../lib/format';

function PerformanceView({ data }) {
  const year = new Date().getFullYear();
  const ytdSavings = data.savings.filter(s => new Date(s.date).getFullYear() === year).reduce((sum, s) => sum + Number(s.amount), 0);
  const target = computeTarget(data.profile, data.tenders);

  const completed = data.tasks.filter(t => t.status === 'completed');
  const completedTasks = completed.length;
  const totalTasks = data.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // On-time = completed on/before deadline. Falls back to createdAt for legacy
  // rows missing completedAt — best-effort, but won't claim 100% by accident.
  const measurable = completed.filter(t => t.deadline);
  const onTimeTasks = measurable.filter(t => {
    const finishedISO = t.completedAt || t.createdAt;
    if (!finishedISO) return false;
    return new Date(finishedISO) <= new Date(t.deadline);
  }).length;
  const onTimeRate = measurable.length > 0 ? Math.round((onTimeTasks / measurable.length) * 100) : 0;

  const awardedTenders = data.tenders.filter(t => t.stage === 'awarded').length;
  const totalTenders = data.tenders.length;
  const awardRate = totalTenders > 0 ? Math.round((awardedTenders / totalTenders) * 100) : 0;

  const targetRate = target > 0 ? Math.min(100, Math.round((ytdSavings / target) * 100)) : 0;

  // Score: weighted average
  const score = Math.round((completionRate * 0.25) + (onTimeRate * 0.25) + (targetRate * 0.35) + (awardRate * 0.15));

  const radial = [{ name: 'Score', value: score, fill: 'var(--accent)' }];

  const trendData = useMemo(() => {
    const months = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      months[key] = { month: d.toLocaleDateString('en-US', { month: 'short' }), tasks: 0, savings: 0 };
    }
    data.tasks.filter(t => t.status === 'completed').forEach(t => {
      const key = monthKey(t.completedAt || t.deadline || t.createdAt);
      if (months[key]) months[key].tasks += 1;
    });
    data.savings.forEach(s => {
      const key = monthKey(s.date);
      if (months[key]) months[key].savings += Number(s.amount) / 1000;
    });
    return Object.values(months);
  }, [data]);

  const metrics = [
    { label: 'Task Completion', value: completionRate, total: 100, suffix: '%', desc: `${completedTasks} of ${totalTasks} tasks done` },
    { label: 'On-Time Delivery', value: onTimeRate, total: 100, suffix: '%', desc: `${onTimeTasks} of ${measurable.length} delivered on schedule` },
    { label: 'Savings Target', value: targetRate, total: 100, suffix: '%', desc: `${fmtMoney(ytdSavings)} of ${fmtMoney(target)}` },
    { label: 'Tender Award Rate', value: awardRate, total: 100, suffix: '%', desc: `${awardedTenders} of ${totalTenders} awarded` }
  ];

  // Sort copies so the metrics array used in the cards above isn't mutated.
  const ranked = [...metrics].sort((a, b) => b.value - a.value);
  const topMetric = ranked[0];
  const focusMetric = ranked[ranked.length - 1];

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 pb-16">
      <PageHeader title="Performance" subtitle="Quantify your impact with key metrics" />

      {/* Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="pd-card p-6 lg:col-span-1">
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Performance Score</div>
          <div className="relative" style={{ height: 220 }}>
            <ResponsiveContainer>
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={20} fill="var(--accent)" background={{ fill: 'var(--surface-2)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="pd-display text-5xl font-semibold pd-glow-text">{score}</div>
              <div className="text-xs uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>out of 100</div>
            </div>
          </div>
          <div className="text-center mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            {score >= 80 ? '🌟 Outstanding performance' : score >= 60 ? '✓ On track' : score >= 40 ? '↗ Building momentum' : '⚠ Needs attention'}
          </div>
        </div>

        <div className="lg:col-span-2 pd-card p-6">
          <h3 className="pd-display text-2xl font-medium mb-1">Trend Analysis</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Tasks completed & savings (in $k) — last 6 months</p>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 10, fontSize: 12 }} />
                <Line type="monotone" dataKey="tasks" stroke="var(--info)" strokeWidth={2.5} dot={{ fill: 'var(--info)', r: 4 }} activeDot={{ r: 6 }} name="Tasks" />
                <Line type="monotone" dataKey="savings" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', r: 4 }} activeDot={{ r: 6 }} name="Savings ($k)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {metrics.map((m, i) => (
          <div key={m.label} className="pd-card pd-card-hover p-5 pd-anim-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
                <div className="pd-display text-3xl font-semibold mt-1">{m.value}{m.suffix}</div>
              </div>
              <div className="text-right">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  <Sparkles size={18} />
                </div>
              </div>
            </div>
            <div className="pd-progress-track mb-2">
              <div className="pd-progress-fill" style={{ width: `${m.value}%` }} />
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="pd-card p-6">
        <h3 className="pd-display text-2xl font-medium mb-4">Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Insight
            icon={Award}
            title="Top Strength"
            text={topMetric.label}
            value={`${topMetric.value}%`}
            tone="success"
          />
          <Insight
            icon={TrendingUp}
            title="Focus Area"
            text={focusMetric.label}
            value={`${focusMetric.value}%`}
            tone="warning"
          />
          <Insight
            icon={Building2}
            title="Pipeline Value"
            text="Active tenders"
            value={fmtMoney(data.tenders.filter(t => t.stage !== 'closed').reduce((s, t) => s + Number(t.value || 0), 0))}
            tone="info"
          />
        </div>
      </div>
    </div>
  );
}

export default PerformanceView;
