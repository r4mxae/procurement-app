import React, { useMemo, useState } from 'react';
import { Activity, ClipboardList, DollarSign, FileText, Search } from 'lucide-react';
import { Empty } from '../components/common/Empty';
import { FilterTabs } from '../components/common/FilterTabs';
import { PageHeader } from '../components/common/PageHeader';

function ActivityView({ data }) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');

  const types = useMemo(() => {
    const t = new Set(data.activity.map(a => a.type));
    return ['all', ...Array.from(t)];
  }, [data.activity]);

  const filtered = data.activity
    .filter(a => type === 'all' || a.type === type)
    .filter(a => !search || a.message.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(a => {
      const date = new Date(a.timestamp);
      const today = new Date();
      const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
      let key;
      if (date.toDateString() === today.toDateString()) key = 'Today';
      else if (date.toDateString() === yesterday.toDateString()) key = 'Yesterday';
      else key = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    return groups;
  }, [filtered]);

  const iconFor = (type) => {
    if (type.includes('task')) return ClipboardList;
    if (type.includes('tender')) return FileText;
    if (type.includes('savings')) return DollarSign;
    return Activity;
  };

  const colorFor = (type) => {
    if (type.includes('completed') || type.includes('logged')) return 'var(--success)';
    if (type.includes('deleted') || type.includes('removed')) return 'var(--danger)';
    if (type.includes('created')) return 'var(--accent)';
    return 'var(--info)';
  };

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 pb-16">
      <PageHeader title="Activity Log" subtitle="A complete chronicle of your workspace" />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <FilterTabs
          options={types.map(t => ({ id: t, label: t === 'all' ? 'All' : t.replace(/_/g, ' '), count: t === 'all' ? data.activity.length : data.activity.filter(a => a.type === t).length }))}
          value={type}
          onChange={setType}
        />
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="pd-input rounded-lg pl-9 pr-3 py-2 text-sm w-full" placeholder="Search activity…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty icon={Activity} title="No activity" hint="Actions you take will appear here" />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="pd-display text-lg font-medium">{day}</h3>
                <div className="flex-1 pd-divider" />
                <span className="text-xs pd-mono" style={{ color: 'var(--text-muted)' }}>{items.length}</span>
              </div>
              <div className="pd-card overflow-hidden">
                {items.map((a, i) => {
                  const Icon = iconFor(a.type);
                  const color = colorFor(a.type);
                  return (
                    <div key={a.id} className="pd-row flex items-center gap-4 px-5 py-3.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)', color }}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm" style={{ color: 'var(--text)' }}>{a.message}</div>
                        <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-faint)' }}>{a.type.replace(/_/g, ' ')}</div>
                      </div>
                      <div className="text-xs pd-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {new Date(a.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityView;
