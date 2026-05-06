import React, { useMemo, useState } from 'react';
import { ClipboardList, Plus, Search } from 'lucide-react';
import { Empty } from '../components/common/Empty';
import { FilterTabs } from '../components/common/FilterTabs';
import { Modal } from '../components/common/Modal';
import { PageHeader } from '../components/common/PageHeader';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskRow } from '../components/tasks/TaskRow';

function TasksView({ data, upsertTask, updateTaskStatus, deleteTask, activeTimer, onStartTimer, onStopTimer, onViewLogs, onViewAttachments }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  // Tasks tab is for open work — completed tasks live in the Closed tab.
  const openTasks = useMemo(() => data.tasks.filter(t => t.status !== 'completed'), [data.tasks]);

  const filtered = useMemo(() => openTasks
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.description || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      const pa = order[a.priority] ?? 5;
      const pb = order[b.priority] ?? 5;
      if (pa !== pb) return pa - pb;
      return new Date(a.deadline || '2999-01-01') - new Date(b.deadline || '2999-01-01');
    }), [openTasks, filter, search]);

  const counts = useMemo(() => ({
    all: openTasks.length,
    todo: openTasks.filter(t => t.status === 'todo').length,
    in_progress: openTasks.filter(t => t.status === 'in_progress').length,
  }), [openTasks]);

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 pb-16">
      <PageHeader
        title="Tasks"
        subtitle="Manage your day-to-day procurement workload"
        action={<button className="pd-btn pd-btn-primary px-4 py-2.5 rounded-lg text-sm flex items-center gap-2" onClick={() => setAdding(true)}><Plus size={15} /> New Task</button>}
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <FilterTabs
          options={[
            { id: 'all', label: 'All open', count: counts.all },
            { id: 'todo', label: 'To Do', count: counts.todo },
            { id: 'in_progress', label: 'In Progress', count: counts.in_progress },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="pd-input rounded-lg pl-9 pr-3 py-2 text-sm w-full"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty icon={ClipboardList} title="No tasks here" hint={search || filter !== 'all' ? 'Try adjusting your filters' : 'Click "New Task" to get started'} />
      ) : (
        <div className="space-y-2">
          {filtered.map((t, i) => {
            const isActive = activeTimer?.kind === 'task' && activeTimer?.itemId === t.id;
            return (
              <TaskRow
                key={t.id}
                task={t}
                index={i}
                isActiveTimer={isActive}
                activeStartTime={isActive ? activeTimer.startTime : null}
                hasOtherTimer={!!activeTimer && !isActive}
                onStartTimer={() => onStartTimer('task', t.id)}
                onStopTimer={onStopTimer}
                onViewLogs={() => onViewLogs('task', t.id)}
                onViewAttachments={() => onViewAttachments('task', t.id)}
                onStatusChange={(s) => updateTaskStatus(t.id, s)}
                onEdit={() => setEditing(t)}
                onDelete={() => { if (confirm(`Delete task "${t.title}"?`)) deleteTask(t.id); }}
              />
            );
          })}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="New Task">
        <TaskForm settings={data.settings} onSubmit={(d) => { upsertTask(d); setAdding(false); }} onCancel={() => setAdding(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Task">
        {editing && <TaskForm settings={data.settings} initial={editing} onSubmit={(d) => { upsertTask({ ...editing, ...d }); setEditing(null); }} onCancel={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}

export default TasksView;
