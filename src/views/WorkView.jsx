import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, Inbox, Search } from 'lucide-react';
import { Empty } from '../components/common/Empty';
import { FilterTabs } from '../components/common/FilterTabs';
import { PageHeader } from '../components/common/PageHeader';
import { WorkRow } from '../components/work/WorkRow';
import { exportWorkLogToExcel } from '../lib/excel';
import { fmtDuration, todayISO, totalLoggedSeconds } from '../lib/format';

function WorkView({ data, activeTimer, onStartTimer, onStopTimer, onViewLogs, onDeleteLog }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const allItems = useMemo(() => {
    const tasks = (data.tasks || []).map(t => ({ ...t, kind: 'task', _open: t.status !== 'completed' }));
    const tenders = (data.tenders || []).map(t => ({ ...t, kind: 'tender', _open: !['closed', 'awarded'].includes(t.stage) }));
    return [...tasks, ...tenders];
  }, [data.tasks, data.tenders]);

  const filtered = useMemo(() => allItems
    .filter(it => {
      if (filter === 'tasks') return it.kind === 'task';
      if (filter === 'tenders') return it.kind === 'tender';
      if (filter === 'open') return it._open;
      if (filter === 'logged') return (it.workLogs || []).length > 0;
      return true;
    })
    .filter(it => !search || it.title.toLowerCase().includes(search.toLowerCase()) || (it.reference || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // active timer item first
      const aActive = activeTimer && activeTimer.kind === a.kind && activeTimer.itemId === a.id;
      const bActive = activeTimer && activeTimer.kind === b.kind && activeTimer.itemId === b.id;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      // open items before closed
      if (a._open !== b._open) return a._open ? -1 : 1;
      // by deadline
      return new Date(a.deadline || '2999-01-01') - new Date(b.deadline || '2999-01-01');
    }), [allItems, filter, search, activeTimer]);

  const counts = useMemo(() => ({
    all: allItems.length,
    tasks: allItems.filter(i => i.kind === 'task').length,
    tenders: allItems.filter(i => i.kind === 'tender').length,
    open: allItems.filter(i => i._open).length,
    logged: allItems.filter(i => (i.workLogs || []).length > 0).length
  }), [allItems]);

  const totalLogged = useMemo(() => allItems.reduce((sum, it) => sum + totalLoggedSeconds(it.workLogs), 0), [allItems]);
  const totalSessions = useMemo(() => allItems.reduce((sum, it) => sum + (it.workLogs || []).length, 0), [allItems]);

  const handleExportAll = () => {
    const itemsWithLogs = allItems.filter(it => (it.workLogs || []).length > 0);
    if (itemsWithLogs.length === 0) {
      alert('No work logs to export yet. Use the timer on a task or tender first.');
      return;
    }
    exportWorkLogToExcel({
      profile: data.profile,
      items: itemsWithLogs,
      filename: `worklog-report-${todayISO()}.xlsx`
    });
  };

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 pb-16">
      <PageHeader
        title="All Work"
        subtitle="Tasks and tenders in one place — track time and export reports"
        action={
          <button className="pd-btn pd-btn-primary px-4 py-2.5 rounded-lg text-sm flex items-center gap-2" onClick={handleExportAll}>
            <FileSpreadsheet size={15} /> Export Work Log Report
          </button>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total time logged</div>
          <div className="pd-display text-2xl font-semibold mt-0.5 pd-mono" style={{ color: 'var(--accent)' }}>{fmtDuration(totalLogged)}</div>
        </div>
        <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Sessions</div>
          <div className="pd-display text-2xl font-semibold mt-0.5">{totalSessions}</div>
        </div>
        <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Open items</div>
          <div className="pd-display text-2xl font-semibold mt-0.5">{counts.open}</div>
        </div>
        <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Items with logs</div>
          <div className="pd-display text-2xl font-semibold mt-0.5">{counts.logged}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <FilterTabs
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'open', label: 'Open', count: counts.open },
            { id: 'tasks', label: 'Tasks', count: counts.tasks },
            { id: 'tenders', label: 'Tenders', count: counts.tenders },
            { id: 'logged', label: 'With logs', count: counts.logged }
          ]}
          value={filter}
          onChange={setFilter}
        />
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="pd-input rounded-lg pl-9 pr-3 py-2 text-sm w-full" placeholder="Search tasks and tenders…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty icon={Inbox} title="Nothing to show" hint={search || filter !== 'all' ? 'Try adjusting your filters' : 'Add a task or tender to get started'} />
      ) : (
        <div className="space-y-2">
          {filtered.map((it, i) => {
            const isActive = activeTimer?.kind === it.kind && activeTimer?.itemId === it.id;
            return (
              <WorkRow
                key={`${it.kind}-${it.id}`}
                item={it}
                index={i}
                isActiveTimer={isActive}
                activeStartTime={isActive ? activeTimer.startTime : null}
                hasOtherTimer={!!activeTimer && !isActive}
                onStartTimer={() => onStartTimer(it.kind, it.id)}
                onStopTimer={onStopTimer}
                onViewLogs={() => onViewLogs(it.kind, it.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WorkView;
