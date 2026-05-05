import React, { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtMoney, fmtMoneyExact, monthKey } from '../../lib/format';
import { Pill } from '../common/Pill';

function Widget_SavingsChart({ data }) {
  const monthlyData = useMemo(() => {
    const months = {};
    for (let i = 5; i >= 0; i--) {
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
  const total = monthlyData.reduce((s, m) => s + m.savings, 0);
  return (
    <div className="pd-card p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="pd-display text-xl sm:text-2xl font-medium">Savings Trend</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Last 6 months</p>
        </div>
        <Pill color="var(--accent)" bg="var(--accent-soft)">{fmtMoney(total)}</Pill>
      </div>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <AreaChart data={monthlyData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: 'var(--text-muted)' }} formatter={(v) => fmtMoneyExact(v)} />
            <Area type="monotone" dataKey="savings" stroke="var(--accent)" strokeWidth={2.5} fill="url(#savingsGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Widget_SavingsChart;
